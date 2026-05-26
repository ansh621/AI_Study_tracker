const mongoose = require("mongoose");

const QuizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
  },
  { _id: false }
);

const QuizAttemptSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    syllabusId: { type: mongoose.Schema.Types.ObjectId, ref: "Syllabus" },
    chapterId: { type: mongoose.Schema.Types.ObjectId },
    topicId: { type: mongoose.Schema.Types.ObjectId },
    subjectName: { type: String, required: true },
    chapterTitle: { type: String, required: true },
    topicName: { type: String, required: true },
    questions: [QuizQuestionSchema],
    answers: [{ type: String }],
    marksObtained: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 0 },
    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizAttempt", QuizAttemptSchema);
