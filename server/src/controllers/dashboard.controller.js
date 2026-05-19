const DailyStudyContext = require("../DB/Model/DailyStudyContextSchema.model");
const DailyTask = require("../DB/Model/DailyTaskSchema.model");
const User = require("../DB/Model/model.user");
const { recordStudyActivity } = require("../middleware/activity.streak");
const { GoogleGenerativeAI } = require("@google/generative-ai");

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function normalizeStreak(streak) {
  return {
    count: Number(streak?.count) || 0,
    longestStreak: Number(streak?.longestStreak) || 0,
    lastActive: streak?.lastActive || null,
  };
}

function buildTasksFromContext(context) {
  const tasks = [];

  if (context.studied) {
    tasks.push({
      title: `Revise ${context.studied}`,
      description: "Review notes and write down the main points you remember.",
      taskType: "revision",
      priority: "high",
      estimatedMinutes: 30,
    });
  }

  if (context.homework) {
    tasks.push({
      title: "Finish homework",
      description: context.homework,
      taskType: "homework",
      priority: "high",
      estimatedMinutes: 45,
    });
  }

  if (context.testSubject) {
    tasks.push({
      title: `Prepare for ${context.testSubject}`,
      description: context.testDate
        ? `Focus on important questions before ${context.testDate}.`
        : "Practice important questions and weak areas.",
      taskType: "study",
      priority: "medium",
      estimatedMinutes: 40,
    });
  }

  if (tasks.length === 0) {
    tasks.push({
      title: "Complete one focused study session",
      description: "Pick the most important subject and study without distractions.",
      taskType: "focus-session",
      priority: "medium",
      estimatedMinutes: 25,
    });
  }

  return tasks;
}

function parseAIJson(text) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

function normalizeAITasks(tasks) {
  const validTypes = new Set(["study", "revision", "homework", "quiz", "focus-session"]);
  const validPriorities = new Set(["low", "medium", "high"]);

  return tasks.slice(0, 5).map((task, index) => ({
    title: String(task.title || `Study task ${index + 1}`).trim(),
    description: String(task.description || "Complete this focused study task.").trim(),
    taskType: validTypes.has(task.taskType) ? task.taskType : "study",
    priority: validPriorities.has(task.priority) ? task.priority : "medium",
    estimatedMinutes: Number(task.estimatedMinutes) || 30,
  }));
}

async function generateTasksWithAI({ studied, homework, testSubject, testDate, user }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `
You are an AI study planner for a student dashboard.

Student:
- Name: ${user?.name || "Student"}
- Grade: ${user?.grade || "Not provided"}
- Board: ${user?.board || "Not provided"}

Today's check-in:
- Studied today: ${studied || "Not provided"}
- Homework: ${homework || "Not provided"}
- Upcoming test subject: ${testSubject || "Not provided"}
- Test date: ${testDate || "Not provided"}

Create 3 to 5 practical study tasks for today. Make them specific, useful, and realistic.

Return ONLY a JSON array. Each object must use exactly this shape:
[
  {
    "title": "short task title",
    "description": "one sentence explaining what to do",
    "taskType": "study | revision | homework | quiz | focus-session",
    "priority": "low | medium | high",
    "estimatedMinutes": 30
  }
]
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const tasks = parseAIJson(text);

  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new Error("AI returned no tasks");
  }

  return normalizeAITasks(tasks);
}

async function getDashboardStatus(req, res) {
  try {
    const userId = req.user.id;
    const { start, end } = todayRange();

    const [context, tasks, user] = await Promise.all([
      DailyStudyContext.findOne({
        userId,
        createdAt: { $gte: start, $lt: end },
      }),
      DailyTask.find({
        userId,
        dueDate: { $gte: start, $lt: end },
      }).sort({ createdAt: 1 }),
      User.findById(userId).select("name grade board streak"),
    ]);

    const completedTasks = tasks.filter((task) => task.status === "completed").length;
    let streak = normalizeStreak(user?.streak);

    if (
      completedTasks > 0 &&
      (!streak.lastActive || streak.lastActive < start || streak.lastActive >= end)
    ) {
      streak = normalizeStreak(await recordStudyActivity(userId));
    }

    res.status(200).json({
      hasSubmittedToday: Boolean(context),
      tasks,
      streak,
      stats: {
        completedTasks,
        totalTasks: tasks.length,
        focusMinutes: tasks
          .filter((task) => task.status === "completed")
          .reduce((total, task) => total + (task.estimatedMinutes || 0), 0),
      },
    });
  } catch (error) {
    console.error("Dashboard status error:", error);
    res.status(500).json({ message: "Unable to load dashboard status" });
  }
}

async function saveDailyContext(req, res) {
  try {
    const userId = req.user.id;
    const { start, end } = todayRange();
    const { studied, homework, testSubject, testDate } = req.body;

    const [existingContext, user] = await Promise.all([
      DailyStudyContext.findOne({
        userId,
        createdAt: { $gte: start, $lt: end },
      }),
      User.findById(userId).select("streak"),
    ]);

    const contextPayload = {
      userId,
      studiedToday: studied ? [{ topic: studied }] : [],
      homework: homework ? [{ description: homework }] : [],
      upcomingExams: testSubject
        ? [{
            subject: testSubject,
            examDate: testDate ? new Date(testDate) : undefined,
          }]
        : [],
      additionalNotes: [studied, homework].filter(Boolean).join("\n"),
    };

    const context = existingContext
      ? await DailyStudyContext.findByIdAndUpdate(existingContext._id, contextPayload, {
          new: true,
        })
      : await DailyStudyContext.create(contextPayload);

    const existingTasks = await DailyTask.find({
      userId,
      dueDate: { $gte: start, $lt: end },
    }).sort({ createdAt: 1 });

    let tasks = existingTasks;
    const shouldGenerateAITasks = !tasks.length || tasks.some((task) => !task.generatedByAI);

    if (shouldGenerateAITasks) {
      if (tasks.length) {
        await DailyTask.deleteMany({
          _id: { $in: tasks.map((task) => task._id) },
          userId,
        });
      }

      const aiTasks = await generateTasksWithAI({
        studied,
        homework,
        testSubject,
        testDate,
        user,
      });

      tasks = await DailyTask.insertMany(
        aiTasks.map((task) => ({
          ...task,
          userId,
          dueDate: start,
          generatedByAI: true,
        }))
      );
    }

    res.status(201).json({
      message: "Daily study context saved",
      context,
      tasks,
      streak: normalizeStreak(user?.streak),
      stats: {
        completedTasks: tasks.filter((task) => task.status === "completed").length,
        totalTasks: tasks.length,
        focusMinutes: tasks
          .filter((task) => task.status === "completed")
          .reduce((total, task) => total + (task.estimatedMinutes || 0), 0),
      },
    });
  } catch (error) {
    console.error("Daily context error:", error);
    res.status(500).json({ message: "AI failed to generate daily tasks" });
  }
}

async function toggleDailyTask(req, res) {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;

    const task = await DailyTask.findOne({ _id: taskId, userId });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.status = task.status === "completed" ? "pending" : "completed";
    await task.save();

    const streak = task.status === "completed"
      ? normalizeStreak(await recordStudyActivity(userId))
      : normalizeStreak((await User.findById(userId).select("streak"))?.streak);

    res.status(200).json({
      message: "Task updated",
      task,
      streak,
    });
  } catch (error) {
    console.error("Task toggle error:", error);
    res.status(500).json({ message: "Unable to update task" });
  }
}
async function studentInfo(req, res) {

  try {

    const userId = req.user.id;

    const user = await User.findById(userId)
      .select("name email grade board");

    res.status(200).json({
      data: user
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch user"
    });
  }
}

module.exports = {
  getDashboardStatus,
  saveDailyContext,
  toggleDailyTask,
  studentInfo
};
