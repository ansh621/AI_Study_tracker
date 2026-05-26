const mongoose = require('mongoose');

const SubtopicSchema = new mongoose.Schema({
  subtopicName: {
    type: String,
    required: true
  },

  isCompleted: {
    type: Boolean,
    default: false
  }
});

const TopicSchema = new mongoose.Schema({
  topicName: {
    type: String,
    required: true
  },

  isCompleted: {
    type: Boolean,
    default: false
  },

  isExpanded: {
    type: Boolean,
    default: false
  },

  subtopics: [SubtopicSchema],

  resources: {
    youtubeUrl: String,
    images: [String]
  }
});

const ChapterSchema = new mongoose.Schema({
  chapterTitle: {
    type: String,
    required: true
  },

  isCompleted: {
    type: Boolean,
    default: false
  },

  isExpanded: {
    type: Boolean,
    default: false
  },

  topics: [TopicSchema]
});

const SyllabusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  subjectName: {
    type: String,
    required: true
  },

  classLevel: String,

  grade: String,

  board: String,

  chapters: [ChapterSchema]

}, { timestamps: true });

module.exports = mongoose.model('Syllabus', SyllabusSchema);
