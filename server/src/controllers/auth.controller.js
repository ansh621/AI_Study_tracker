const userModel = require('../DB/Model/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Add this for security

async function registerUser(req, res) {
    try {
        const { name, email, password, role } = req.body;

        // 1. Check if user already exists
        const userExists = await userModel.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create the user with the hashed password
        const newUser = await userModel.create({
            name,
            email,
            password: hashedPassword,
            role // 'student' or 'parent'
        });

        // 4. Generate the JWT
        // We include the 'role' in the token so the frontend knows where to redirect
        const token = jwt.sign(
            { id: newUser._id, role: newUser.role }, 
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 5. Set Cookie and Respond
        res.cookie("Token", token, {
            httpOnly: true, // Security: prevents frontend JS from reading the cookie
            secure: process.env.NODE_ENV === 'production', // Only sends over HTTPS in production
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(201).json({
            message: "User created successfully",
            role: newUser.role // Send role so React knows which dashboard to load
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error during registration" });
    }
}

module.exports = { registerUser };