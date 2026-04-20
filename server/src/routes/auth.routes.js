const express= require('express');
const router = express.Router();
const authController = require('../controllers/auth.cotroller')
const { generateLinkToken, claimLinkToken } = require('../controllers/auth.linkController');


router.get('/generate-link',generateLinkToken);
router.post('/claim-link',claimLinkToken);
router.post("/register",authController.registerUser)

module.exports = router;