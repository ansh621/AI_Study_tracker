const express = require("express");
const studentInfo = require("../controllers/dashboard.controller").studentInfo;
const {
  getDashboardStatus,
  saveDailyContext,
  toggleDailyTask,
} = require("../controllers/dashboard.controller");
const { protect } = require("../middleware/auth.protect");

const router = express.Router();

router.get("/daily-status", protect, getDashboardStatus);
router.post("/daily-context", protect, saveDailyContext);
router.patch("/task/:taskId", protect, toggleDailyTask);
router.get("/student-info", protect, studentInfo);

module.exports = router;
