const mongoose = require('mongoose');
const studentSchema =new mongoose.Schema({
    userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Points to your main User model
    required: true 
  },
    grade:{type : String , required: true},
    board:{type : String , required: true},
    age:{type:Number, required : true},
    gender:{type:String, required:true},
    stream:{type:String, default:"General"},
    subjects: {
    type: [String],
    default: []
  },timeSpent: {
    type: Number,
    default: 1
  }

})
module.exports = mongoose.model('StudentInfo',studentSchema);