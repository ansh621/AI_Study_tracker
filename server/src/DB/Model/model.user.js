const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Basic Credentials
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: function() { return this.role === 'parent'; }, unique: true }, // Required for the linking bridge
  
  role: { 
    type: String, 
    enum: ['student', 'parent'], 
    required: true 
  },

  // THE LINKING BRIDGE
  // Students fill this with their parent's number.
  // Parents don't need to fill this; they just "own" the phone number students reference.
  parentPhoneNumber: { 
    type: String, 
    required: function() { return this.role === 'student'; },
    index: true // Indexed for fast lookups when the parent logs in
  },

  // STUDENT-SPECIFIC FIELDS
  // Gamification & Monitoring
  streak: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }, // Critical for Streak logic
  offTaskCount: { type: Number, default: 0 }, 
  
  // PARENT-SPECIFIC FIELDS
  notificationsEnabled: { type: Boolean, default: true }

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);