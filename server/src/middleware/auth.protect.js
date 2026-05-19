const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  let token = req.cookies.Token;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

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
