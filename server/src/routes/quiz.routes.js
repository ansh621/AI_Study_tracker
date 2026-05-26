const express = require("express");
const { protect } = require("../middleware/auth.protect");
const { generateQuiz, submitQuizAttempt } = require("../controllers/quiz.controller");

const router = express.Router();

router.post("/generate", protect, generateQuiz);
router.post("/submit", protect, submitQuizAttempt);

module.exports = router;
