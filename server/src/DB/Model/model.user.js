const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Basic Credentials (shared by both)
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Role Differentiation
  role: { 
    type: String, 
    enum: ['student', 'parent'], 
    required: true 
  },

  // The "Bridge"
  // If Parent: this stores the Student's ID
  // If Student: this stores the Parent's ID
  linkedUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },

  // Student-Specific Fields (ignored if role is 'parent')
  streak: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  offTaskCount: { type: Number, default: 0 }, // For tab-switch monitoring
  
  // Parent-Specific Fields (ignored if role is 'student')
  notificationsEnabled: { type: Boolean, default: true }

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);