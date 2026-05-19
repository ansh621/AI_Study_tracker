const express = require('express');
const router = express.Router();

// CHANGE THIS: Match the name you used in module.exports
const { generateInitialSyllabus } = require('../AI/syllabus.controller'); 

const { protect } = require('../middleware/auth.protect');
const updateStreak = require('../middleware/activity.streak');


router.post('/generate-syllabus',protect, generateInitialSyllabus);

module.exports = router;
