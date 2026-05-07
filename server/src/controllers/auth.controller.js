const userModel = require("../DB/Model/model.user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // Add this for security

async function registerUser(req, res) {
  try {
    console.log("Register endpoint hit with data:", req.body);
    const { name, email, password, role, phoneNumber, parentPhoneNumber } =
      req.body;

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
      role, // 'student' or 'parent'
      phoneNumber,
      parentPhoneNumber, // Include parent's phone number
    });

    // 4. Generate the JWT
    // We include the 'role' in the token so the frontend knows where to redirect
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    // 5. Set Cookie and Respond
    res.cookie("Token", token, {
      httpOnly: true, // Security: prevents frontend JS from reading the cookie
      secure: false,
      sameSite: "lax", // Only sends over HTTPS in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(201).json({
      message: "User created successfully",
      role: newUser.role, // Send role so React knows which dashboard to load
    });
    console.log("Register endpoint hit with data:", req.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error during registration" });
  }
}
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3. Generate JWT (Same logic as registration)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    // 4. Set Cookie
    res.cookie("Token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful from backend",
      role: user.role,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error during login" });
  }
}

// Don't forget to export it!
module.exports = { registerUser, loginUser };
