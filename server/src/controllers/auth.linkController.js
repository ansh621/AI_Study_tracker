const userModel = require('../DB/Model/user.model');
const jwt = require('jsonwebtoken');

// STEP 1: Parent generates the token
const generateLinkToken = async (req, res) => {
    try {
        // Ensure only a parent can generate a link
        if (req.user.role !== 'parent') {
            return res.status(403).json({ message: "Only parents can generate link tokens" });
        }

        const linkToken = jwt.sign(
            { parentId: req.user.id, purpose: 'link_account' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour for security
        );

        res.json({ linkToken });
    } catch (error) {
        res.status(500).json({ message: "Error generating token" });
    }
};

// STEP 2: Student uses the token to link
const claimLinkToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "Token is required" });

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.purpose !== 'link_account') {
            return res.status(400).json({ message: "Invalid token purpose" });
        }

        const studentId = req.user.id; // From the student's auth middleware
        const parentId = decoded.parentId;

        // The "Double Update" (The Handshake)
        // 1. Update Student to point to Parent
        await userModel.findByIdAndUpdate(studentId, { linkedUser: parentId });
        // 2. Update Parent to point to Student
        await userModel.findByIdAndUpdate(parentId, { linkedUser: studentId });

        res.status(200).json({ message: "Accounts linked successfully!" });
    } catch (error) {
        res.status(401).json({ message: "Token expired or invalid" });
    }
};

module.exports = { generateLinkToken, claimLinkToken };