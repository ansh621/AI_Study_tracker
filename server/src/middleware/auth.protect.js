const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  const token = req.cookies.Token;

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // This is the "magic" part: it passes the user ID to the next function
    req.user = { id: decoded.id }; 
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ message: "Token failed or expired" });
  }
};

module.exports = { protect };