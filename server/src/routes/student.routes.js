const express = require('express');
const router = express.Router();
const { studentData, StudentSubjects } = require('../controllers/studentData.controller');
const { getStudentProfile } = require('../controllers/StudentProfile.controller');

const { protect } = require('../middleware/auth.protect');
const { updateStreak } = require('../middleware/activity.streak');

router.post("/onboarding", protect, studentData);
router.post("/student-subjects", protect, StudentSubjects);
router.get("/me", protect, updateStreak);
router.get("/profile",protect, getStudentProfile);

module.exports = router;