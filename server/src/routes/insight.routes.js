const express = require("express");
const { protect } = require("../middleware/auth.protect");
const { getStudentInsights } = require("../controllers/insight.controller");

const router = express.Router();

router.get("/student", protect, getStudentInsights);

module.exports = router;
