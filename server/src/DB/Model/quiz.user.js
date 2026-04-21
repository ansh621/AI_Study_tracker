const QuizResultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subjectName: String,
  score: Number,
  totalQuestions: Number,
  
  // This is the "Magic" field. You store the AI's JSON output here.
  quizHistory: { type: Object }, 
  
  attemptedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('QuizResult', QuizResultSchema);