const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');

const connectDB = require('./DB/connectivity');const cors = require("cors");
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"], 
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true, // Allow cookies to be sent
}));

// Middleware
app.use(express.json()); // For parsing application/json
app.use(cookieParser()); // For parsing cookies


const authRoutes = require('./routes/auth.routes');
const aiRoutes = require('./routes/ai.routes')
const studentRoutes = require('./routes/student.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const focusSessionRoutes = require('./routes/focusSession.routes');
const parentRoutes = require('./routes/parent.routes');
const quizRoutes = require("./routes/quiz.routes");
const insightRoutes = require("./routes/insight.routes");

app.use('/api/parent', parentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/ai', aiRoutes)
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/focus', focusSessionRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/insights", insightRoutes);
// Connect to the database
connectDB().catch(err => {
    console.error("Failed to connect to the database:", err);
    process.exit(1); // Exit the process with an error code
});

module.exports = app;
