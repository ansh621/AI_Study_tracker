const { GoogleGenerativeAI } = require("@google/generative-ai");
const DailyTask = require("../DB/Model/DailyTaskSchema.model");
const FocusSession = require("../DB/Model/focusSession.model");
const QuizAttempt = require("../DB/Model/quiz.user");
const User = require("../DB/Model/model.user");
const StudentSyllabus = require("../DB/Model/syllabus.model");

function cleanJson(text) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function getDateRange(days = 7) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { start, end };
}

function buildStudyMetrics(tasks, sessions, quizzes) {
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const completedSessions = sessions.filter((session) => session.status === "completed");
  const totalFocusMinutes = sessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const quizTotal = quizzes.reduce((sum, item) => sum + (item.maxMarks || 0), 0);
  const quizScore = quizzes.reduce((sum, item) => sum + (item.marksObtained || 0), 0);
  const quizAccuracy = quizTotal ? Math.round((quizScore / quizTotal) * 100) : 0;

  return {
    completedTasks,
    totalTasks: tasks.length,
    taskCompletionRate: completionRate,
    totalFocusMinutes,
    focusSessionsStarted: sessions.length,
    focusSessionsCompleted: completedSessions.length,
    focusCompletionRate: sessions.length ? Math.round((completedSessions.length / sessions.length) * 100) : 0,
    quizzesTaken: quizzes.length,
    quizMarksObtained: quizScore,
    quizMaxMarks: quizTotal,
    quizAccuracy,
  };
}

function buildSyllabusMetrics(syllabusList) {
  const subjectWise = syllabusList.map((subject) => {
    const totalChapters = subject.chapters.length;
    const completedChapters = subject.chapters.filter((chapter) => chapter.isCompleted).length;
    const totalTopics = subject.chapters.reduce((sum, chapter) => sum + chapter.topics.length, 0);
    const completedTopics = subject.chapters.reduce(
      (sum, chapter) => sum + chapter.topics.filter((topic) => topic.isCompleted).length,
      0
    );
    const remainingTopics = Math.max(0, totalTopics - completedTopics);
    return {
      subjectName: subject.subjectName,
      totalChapters,
      completedChapters,
      chapterCompletionRate: totalChapters ? Math.round((completedChapters / totalChapters) * 100) : 0,
      totalTopics,
      completedTopics,
      topicCompletionRate: totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0,
      estimatedMinutesRemaining: remainingTopics * 45,
    };
  });

  const totals = subjectWise.reduce(
    (acc, subject) => {
      acc.totalChapters += subject.totalChapters;
      acc.completedChapters += subject.completedChapters;
      acc.totalTopics += subject.totalTopics;
      acc.completedTopics += subject.completedTopics;
      acc.estimatedMinutesRemaining += subject.estimatedMinutesRemaining;
      return acc;
    },
    { totalChapters: 0, completedChapters: 0, totalTopics: 0, completedTopics: 0, estimatedMinutesRemaining: 0 }
  );

  return {
    ...totals,
    chapterCompletionRate: totals.totalChapters ? Math.round((totals.completedChapters / totals.totalChapters) * 100) : 0,
    topicCompletionRate: totals.totalTopics ? Math.round((totals.completedTopics / totals.totalTopics) * 100) : 0,
    subjectWise,
  };
}

function buildSubjectPerformance(quizzes, syllabusList = []) {
  const map = new Map();
  syllabusList.forEach((subject) => {
    const key = subject.subjectName || "Unknown";
    if (!map.has(key)) {
      map.set(key, { subjectName: key, quizzesTaken: 0, marksObtained: 0, maxMarks: 0 });
    }
  });
  quizzes.forEach((quiz) => {
    const key = quiz.subjectName || "Unknown";
    if (!map.has(key)) {
      map.set(key, { subjectName: key, quizzesTaken: 0, marksObtained: 0, maxMarks: 0 });
    }
    const entry = map.get(key);
    entry.quizzesTaken += 1;
    entry.marksObtained += quiz.marksObtained || 0;
    entry.maxMarks += quiz.maxMarks || 0;
  });
  return Array.from(map.values()).map((entry) => ({
    ...entry,
    accuracy: entry.maxMarks ? Math.round((entry.marksObtained / entry.maxMarks) * 100) : 0,
  }));
}

async function generateWithFallback(prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
  let lastError;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" },
      });
      return await model.generateContent(prompt);
    } catch (error) {
      lastError = error;
      console.error(`Insight generation failed on ${modelName}:`, error.message);
    }
  }

  throw lastError;
}

async function buildAIInsight({ name, metrics }) {
  if (!process.env.GEMINI_API_KEY) {
    return `Performance summary for ${name}: completed ${metrics.completedTasks}/${metrics.totalTasks} tasks, completed ${metrics.focusSessionsCompleted}/${metrics.focusSessionsStarted} focus sessions, scored ${metrics.quizMarksObtained}/${metrics.quizMaxMarks} in quizzes.`;
  }

  try {
    const prompt = `
You are an academic performance analyst for a parent dashboard.
Student: ${name}
Metrics:
${JSON.stringify(metrics)}

Return ONLY JSON:
{
  "summary": "4 to 6 sentences",
  "strengths": ["point", "point"],
  "improvements": ["point", "point"],
  "parentActions": ["point", "point", "point"]
}
`;
    const result = await generateWithFallback(prompt);
    return JSON.parse(cleanJson(result.response.text()));
  } catch (error) {
    console.error("AI insight generation error:", error);
    return {
      summary: `${name} completed ${metrics.completedTasks}/${metrics.totalTasks} tasks and ${metrics.focusSessionsCompleted}/${metrics.focusSessionsStarted} focus sessions, with quiz accuracy ${metrics.quizAccuracy}%.`,
      strengths: ["Maintaining regular study activity."],
      improvements: ["Improve consistency in task and focus-session completion."],
      parentActions: ["Set a fixed daily study window and check completion every evening."],
    };
  }
}

async function getStudentInsights(req, res) {
  try {
    const userId = req.user.id;
    const { start, end } = getDateRange(30);
    const user = await User.findById(userId).select("name");

    const [tasks, sessions, quizzes, syllabus] = await Promise.all([
      DailyTask.find({ userId, createdAt: { $gte: start, $lte: end } }),
      FocusSession.find({ userId, createdAt: { $gte: start, $lte: end } }),
      QuizAttempt.find({ studentId: userId, attemptedAt: { $gte: start, $lte: end } }),
      StudentSyllabus.find({ userId }),
    ]);

    const metrics = buildStudyMetrics(tasks, sessions, quizzes);
    const syllabusMetrics = buildSyllabusMetrics(syllabus);
    const subjectPerformance = buildSubjectPerformance(quizzes, syllabus);
    const aiInsight = await buildAIInsight({
      name: user?.name || "Student",
      metrics: { ...metrics, syllabusMetrics, subjectPerformance },
    });

    res.status(200).json({
      data: {
        periodDays: 30,
        metrics,
        syllabusMetrics,
        subjectPerformance,
        aiInsight,
        recentQuizzes: quizzes.slice(-5).map((quiz) => ({
          id: quiz._id,
          subjectName: quiz.subjectName,
          chapterTitle: quiz.chapterTitle,
          topicName: quiz.topicName,
          marksObtained: quiz.marksObtained,
          maxMarks: quiz.maxMarks,
          attemptedAt: quiz.attemptedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Student insight error:", error);
    res.status(500).json({ message: "Unable to load insights" });
  }
}

module.exports = {
  getStudentInsights,
  buildStudyMetrics,
  buildAIInsight,
  getDateRange,
  buildSyllabusMetrics,
  buildSubjectPerformance,
};
