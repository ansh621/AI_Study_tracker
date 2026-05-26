const userModel = require("../DB/Model/model.user");
const DailyTask = require("../DB/Model/DailyTaskSchema.model");
const FocusSession = require("../DB/Model/focusSession.model");
const QuizAttempt = require("../DB/Model/quiz.user");
const {
  buildStudyMetrics,
  buildAIInsight,
  getDateRange,
  buildSyllabusMetrics,
  buildSubjectPerformance,
} = require("./insight.controller");
const StudentSyllabus = require("../DB/Model/syllabus.model");

const getParentDashboard = async (req, res) => {
  try {

    // FIND PARENT
    const parent = await userModel
      .findById(req.user.id)
      .select("name email role phoneNumber");

    if (!parent) {
      return res.status(404).json({
        message: "Parent not found"
      });
    }

    // FIND STUDENT
    const student = await userModel
      .findOne({
        parentPhoneNumber: parent.phoneNumber,
        role: "student"
      })
      .select(
        "name streak points offTaskCount notificationsEnabled"
      );

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    const { start, end } = getDateRange(30);

    // FIND RECENT TASKS
    const tasks = await DailyTask
      .find({ userId: student._id })
      .select(
  "title description status priority updatedAt createdAt"
)
      .sort({ updatedAt: -1 })
      .limit(5);

    const [monthlyTasks, sessions, quizzes, syllabusList] = await Promise.all([
      DailyTask.find({ userId: student._id, createdAt: { $gte: start, $lte: end } }),
      FocusSession.find({ userId: student._id, createdAt: { $gte: start, $lte: end } }),
      QuizAttempt.find({ studentId: student._id, attemptedAt: { $gte: start, $lte: end } }),
      StudentSyllabus.find({ userId: student._id }),
    ]);
    const subjectPerformance = buildSubjectPerformance(quizzes, syllabusList);
    const syllabusSummary = buildSyllabusMetrics(syllabusList);

    const metrics = buildStudyMetrics(monthlyTasks, sessions, quizzes);
    const aiInsight = await buildAIInsight({
      name: student.name || "Student",
      metrics: { ...metrics, syllabusSummary, subjectPerformance },
    });

    // SEND EVERYTHING
    res.status(200).json({
      parent,
      student,
      tasks,
      insights: {
        periodDays: 30,
        metrics,
        subjectPerformance,
        syllabusSummary,
        aiInsight,
      },
    });
    console.log("Parent Dashboard Data Sent:", {
      parent: {
        name: parent.name,
        email: parent.email,
        role: parent.role,
        phoneNumber: parent.phoneNumber
      },
      student: {
        name: student.name,
        streak: student.streak,
        points: student.points,
        offTaskCount: student.offTaskCount,
        notificationsEnabled: student.notificationsEnabled
      },
      tasks: tasks.map(task => ({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,    
        updatedAt: task.updatedAt,
        createdAt: task.createdAt
      })),
      insights: metrics,
    });


  } catch (error) {

    console.error("Dashboard Error:", error);

    res.status(500).json({
      message: "Internal server error"
    });

  }
};

module.exports = {
  getParentDashboard
};
