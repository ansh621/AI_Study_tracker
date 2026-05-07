const express= require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller')
const { studentData } = require('../controllers/auth.studentData.controller');



router.post("/register",authController.registerUser)
router.post("/login",authController.loginUser)
router.post("/Onboarding",studentData)

module.exports = router;