const User = require('../DB/Model/model.user');
const { protect } = require ( './auth.protect');




const updateStreak = async (user) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const lastActive = new Date(user.streak.lastActive).setHours(0, 0, 0, 0);
    
    const diffInMs = today - lastActive;
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInDays === 1) {
        // Perfect! It's the very next day
        user.streak.count += 1;
        if (user.streak.count > user.streak.longestStreak) {
            user.streak.longestStreak = user.streak.count;
        }
    } else if (diffInDays > 1) {
        // They missed a day or more. Reset!
        user.streak.count = 1;
    }
    // If diffInDays === 0, they already logged in today, do nothing.

    user.streak.lastActive = Date.now();
    await user.save();
};
module.exports = { updateStreak };