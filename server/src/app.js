const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const connectDB = require('./DB/connectivity');const cors = require("cors");
app.use(cors({
    origin: "http://localhost:5173", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Allow cookies to be sent
}));

// Middleware
app.use(express.json()); // For parsing application/json
app.use(cookieParser()); // For parsing cookies


const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Connect to the database
connectDB().catch(err => {
    console.error("Failed to connect to the database:", err);
    process.exit(1); // Exit the process with an error code
});

module.exports = app;
