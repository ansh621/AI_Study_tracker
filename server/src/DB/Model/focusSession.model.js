const mongoose = require("mongoose");

const TutorMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["student", "tutor"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: String,
  },
  { timestamps: true }
);

const FocusSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    syllabusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Syllabus",
    },
    chapterId: mongoose.Schema.Types.ObjectId,
    subjectName: {
      type: String,
      required: true,
    },
    chapterTitle: {
      type: String,
      required: true,
    },
    topicName: {
      type: String,
      required: true,
    },
    isOtherTopic: {
      type: Boolean,
      default: false,
    },
    durationMinutes: {
      type: Number,
      default: 25,
    },
    actualDurationSeconds: {
      type: Number,
      default: 0,
    },
    actualDurationMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "exited"],
      default: "active",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
    tutorMessages: [TutorMessageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("FocusSession", FocusSessionSchema);
