// models/Syllabus.js
const mongoose = require('mongoose');

const SyllabusSchema = new mongoose.Schema({
  // This field differentiates the subjects
  subjectName: { type: String, required: true }, 

  // Nested structure for the actual content
  chapters: [{
    chapterTitle: String,
    topics: [{
      topicName: String,
      isCompleted: { type: Boolean, default: false },
      resources: {
        youtubeUrl: String,
        images: [String]
      }
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('Syllabus', SyllabusSchema);