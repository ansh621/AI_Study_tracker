const mongoose = require('mongoose');

const DailyTaskSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  syllabusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Syllabus'
  },

  chapterId: String,

  topicId: String,

  title: {
    type: String,
    required: true
  },

  description: String,

  taskType: {
    type: String,
    enum: [
      'study',
      'revision',
      'homework',
      'quiz',
      'focus-session'
    ]
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },

  estimatedMinutes: Number,

  generatedByAI: {
    type: Boolean,
    default: true
  },

  dueDate: Date

}, { timestamps: true });

module.exports = mongoose.model('DailyTask', DailyTaskSchema);