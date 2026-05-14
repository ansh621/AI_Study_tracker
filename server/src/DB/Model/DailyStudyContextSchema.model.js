const mongoose = require('mongoose');

const DailyStudyContextSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  studiedToday: [{
    subject: String,
    chapter: String,
    topic: String
  }],

  homework: [{
    subject: String,
    description: String
  }],

  upcomingExams: [{
    subject: String,
    examDate: Date,
    chapters: [String]
  }],

  weakTopics: [String],

  additionalNotes: String

}, { timestamps: true });

module.exports = mongoose.model(
  'DailyStudyContext',
  DailyStudyContextSchema
);