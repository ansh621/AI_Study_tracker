const express = require('express');
const router = express.Router();

// CHANGE THIS: Match the name you used in module.exports
const { feedStudentSyllabus } = require('../AI/syllabus.controller'); 

const { protect } = require('../middleware/auth.protect');
const updateStreak = require('../middleware/activity.streak');

// Update the handler name here as well
router.post('/generate-syllabus', protect, feedStudentSyllabus);

module.exports = router;
