const express = require('express');
const router = express.Router();

const {
  generateInitialSyllabus,
  expandChapterTopics,
  expandTopicSubtopics,
} = require('../AI/syllabus.controller'); 

const { protect } = require('../middleware/auth.protect');
const updateStreak = require('../middleware/activity.streak');


router.post('/generate-syllabus',protect, generateInitialSyllabus);
router.post('/expand-chapter', protect, expandChapterTopics);
router.post('/expand-topic', protect, expandTopicSubtopics);

module.exports = router;
