const express = require("express");
const { protect } = require("../middleware/auth.protect");
const {
  listSyllabus,
  startFocusSession,
  getFocusSession,
  endFocusSession,
  askFocusTutor,
  getFocusSessionSummary,
} = require("../controllers/focusSession.controller");

const router = express.Router();

router.get("/syllabus", protect, listSyllabus);
router.post("/sessions", protect, startFocusSession);
router.get("/sessions/:sessionId", protect, getFocusSession);
router.patch("/sessions/:sessionId/end", protect, endFocusSession);
router.post("/sessions/:sessionId/tutor", protect, askFocusTutor);
router.get("/sessions/:sessionId/summary", protect, getFocusSessionSummary);

module.exports = router;
