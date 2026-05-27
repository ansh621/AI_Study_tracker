const Notification = require("../DB/Model/notification.model");
const User = require("../DB/Model/model.user");
const DailyTask = require("../DB/Model/DailyTaskSchema.model");

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function dateKey(date = new Date()) {
  return startOfDay(date).toISOString().slice(0, 10);
}

async function createNotification(payload) {
  try {
    return await Notification.create(payload);
  } catch (error) {
    if (error.code === 11000) {
      return null;
    }
    throw error;
  }
}

async function findParentsForStudent(student) {
  if (!student?.parentPhoneNumber) {
    return [];
  }

  return User.find({
    role: "parent",
    phoneNumber: student.parentPhoneNumber,
    notificationsEnabled: { $ne: false },
  }).select("_id name");
}

async function notifyStudent(userId, payload) {
  return createNotification({
    recipientId: userId,
    actorUserId: userId,
    audience: "student",
    ...payload,
  });
}

async function notifyParentsForStudent(studentId, payload) {
  const student = await User.findById(studentId).select("name parentPhoneNumber");
  const parents = await findParentsForStudent(student);

  await Promise.all(
    parents.map((parent) =>
      createNotification({
        recipientId: parent._id,
        actorUserId: studentId,
        audience: "parent",
        title: payload.parentTitle || payload.title,
        message: payload.parentMessage || payload.message,
        type: payload.type,
        link: payload.parentLink || payload.link,
        uniqueKey: payload.uniqueKey ? `${payload.uniqueKey}-parent-${parent._id}` : undefined,
      })
    )
  );
}

async function notifyStudentAndParents(studentId, payload) {
  await Promise.all([
    notifyStudent(studentId, payload),
    notifyParentsForStudent(studentId, payload),
  ]);
}

async function ensureDailyStudyAlerts(userId) {
  const user = await User.findById(userId).select("name role streak parentPhoneNumber phoneNumber notificationsEnabled");

  if (!user) {
    return;
  }

  const todayStart = startOfDay();
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const todayKey = dateKey(todayStart);

  const students = user.role === "parent"
    ? await User.find({
        role: "student",
        parentPhoneNumber: user.phoneNumber,
      }).select("name streak parentPhoneNumber")
    : [user];

  await Promise.all(
    students.map(async (student) => {
      const lastActive = student.streak?.lastActive ? new Date(student.streak.lastActive) : null;
      const shouldNotifyMissedStreak = lastActive && lastActive < yesterdayStart;

      if (shouldNotifyMissedStreak) {
        await notifyStudentAndParents(student._id, {
          title: "Streak needs attention",
          message: "You missed your study streak. Complete a task today to restart your momentum.",
          parentTitle: `${student.name}'s streak needs attention`,
          parentMessage: `${student.name} has not completed study activity recently. Encourage them to finish one task today.`,
          type: "streak",
          link: "/dashboard",
          parentLink: "/parentDash",
          uniqueKey: `missed-streak-${student._id}-${todayKey}`,
        });
      }

      const pendingTasks = await DailyTask.find({
        userId: student._id,
        status: "pending",
        dueDate: { $lt: todayStart },
      }).select("title dueDate").limit(5);

      if (pendingTasks.length) {
        await notifyStudentAndParents(student._id, {
          title: "Incomplete tasks pending",
          message: `${pendingTasks.length} previous task${pendingTasks.length > 1 ? "s are" : " is"} still incomplete.`,
          parentTitle: `${student.name} has incomplete tasks`,
          parentMessage: `${student.name} has ${pendingTasks.length} previous task${pendingTasks.length > 1 ? "s" : ""} still incomplete.`,
          type: "task",
          link: "/dashboard",
          parentLink: "/parentDash",
          uniqueKey: `incomplete-tasks-${student._id}-${todayKey}`,
        });
      }
    })
  );
}

module.exports = {
  createNotification,
  notifyStudent,
  notifyParentsForStudent,
  notifyStudentAndParents,
  ensureDailyStudyAlerts,
};
