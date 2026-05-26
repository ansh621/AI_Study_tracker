const express = require("express");
const router = express.Router();
const { studentData, StudentSubjects } = require('../controllers/studentData.controller');
const { protect } = require('../middleware/auth.protect');
const { updateStreak } = require('../middleware/activity.streak');
const studentModel = require("../DB/Model/student.user");
const userModel = require("../DB/Model/model.user");

async function getStudentProfile(req, res) {
    try {
        const userId = req.user.id;

        // 1. Fetch both documents in parallel to save time
        const [studentProfile, userBaseInfo] = await Promise.all([
            studentModel.findOne({ userId }).select('age grade stream board gender subjects timeSpent'),
            userModel.findById(userId).select('name streak')
        ]);

        // 2. Critical Check: Does the base user even exist?
        if (!userBaseInfo) {
            return res.status(404).json({ message: "User account not found" });
        }

        // 3. Does the student-specific profile exist?
        if (!studentProfile) {
            return res.status(404).json({ message: "Student-specific profile not found" });
        }

        // 4. Clean Response Construction
        const { name, streak } = userBaseInfo;
        const { age } = studentProfile;

        res.status(200).json({
            message: "Student profile retrieved",
            data: {
                ...studentProfile.toObject(), // Spread student-specific fields
                name,
                age,
                streak
            }
        })
        

    } catch (error) {
        console.error("Error fetching student profile:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
async function updateStudentProfile(req, res) {
    try {
        const userId = req.user.id;
        const { name, age, grade, stream, board, gender, subjects } = req.body;

        const [studentProfile, userBaseInfo] = await Promise.all([
            studentModel.findOne({ userId }),
            userModel.findById(userId)
        ]);

        if (!userBaseInfo || !studentProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        if (typeof name === "string" && name.trim()) {
            userBaseInfo.name = name.trim();
        }
        const parsedAge = typeof age === "string" ? Number(age) : age;
        if (Number.isFinite(parsedAge) && parsedAge >= 3 && parsedAge <= 100) {
            studentProfile.age = parsedAge;
        }
        if (typeof grade === "string" && grade.trim()) studentProfile.grade = grade.trim();
        if (typeof stream === "string" && stream.trim()) studentProfile.stream = stream.trim();
        if (typeof board === "string" && board.trim()) studentProfile.board = board.trim();
        if (typeof gender === "string" && gender.trim()) studentProfile.gender = gender.trim();
        if (Array.isArray(subjects)) {
            studentProfile.subjects = subjects.map((subject) => String(subject).trim()).filter(Boolean);
        }

        await Promise.all([userBaseInfo.save(), studentProfile.save()]);

        return res.status(200).json({
            message: "Student profile updated",
            data: {
                ...studentProfile.toObject(),
                name: userBaseInfo.name,
                streak: userBaseInfo.streak
            }
        });
    } catch (error) {
        console.error("Error updating student profile:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = { getStudentProfile, updateStudentProfile };
