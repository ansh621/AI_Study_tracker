const express = require('express');
const router = express.Router();
const { studentData, StudentSubjects } = require('../controllers/studentData.controller');
const { getStudentProfile } = require('../controllers/StudentProfile.controller');
const User = require('../DB/Model/model.user');

const { protect } = require('../middleware/auth.protect');

router.post("/onboarding", protect, studentData);
router.post("/student-subjects", protect, StudentSubjects);
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user.id).select("name email role streak points");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ data: user });
});
router.get("/profile",protect, getStudentProfile);

module.exports = router;
