const User = require("../DB/Model/model.user");

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function daysBetween(fromDate, toDate) {
  return Math.round((startOfDay(toDate) - startOfDay(fromDate)) / MS_PER_DAY);
}

function applyStreakActivity(user, activityDate = new Date()) {
  if (!user.streak) {
    user.streak = {};
  }

  const currentCount = user.streak.count || 0;
  const longestStreak = user.streak.longestStreak || 0;
  const lastActive = user.streak.lastActive;

  if (!lastActive) {
    user.streak.count = currentCount || 1;
  } else {
    const diffInDays = daysBetween(lastActive, activityDate);

    if (diffInDays === 0) {
      user.streak.count = currentCount || 1;
    } else if (diffInDays === 1) {
      user.streak.count = currentCount + 1;
    } else if (diffInDays > 1) {
      user.streak.count = 1;
    }
  }

  user.streak.longestStreak = Math.max(longestStreak, user.streak.count || 0);
  user.streak.lastActive = activityDate;

  return user.streak;
}

async function recordStudyActivity(userId, activityDate = new Date()) {
  const user = await User.findById(userId);

  if (!user) {
    return null;
  }

  applyStreakActivity(user, activityDate);
  user.markModified("streak");
  await user.save();

  return user.streak;
}

async function updateStreak(req, res, next) {
  try {
    const streak = await recordStudyActivity(req.user.id);
    req.streak = streak;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  applyStreakActivity,
  recordStudyActivity,
  updateStreak,
};
