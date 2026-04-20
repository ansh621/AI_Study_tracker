const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  isCompleted: { type: Boolean, default: false },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  dueDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);