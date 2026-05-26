const express = require("express");
const { protect } = require('../middleware/auth.protect');
const { getParentDashboard } = require("../controllers/parentDash.controller");


const router = express.Router();

router.get("/parent-dashboard", protect, getParentDashboard);


module.exports = router;