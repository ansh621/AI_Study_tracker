const taskModel = require('../DB/Model/task.model');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const studentModel = require("../DB/Model/student.user");
const userModel = require("../DB/Model/model.user");
const syllabusModel = require("../DB/Model/syllabus.model");
const protect = require('../middleware/auth.protect');

async function generateTasks(req, res) {
    try{
        const userId = req.user.id;
        const subjects = await syllabusModel.findById(userId).select('subjectName');
        const subjectNames = subjects.map(subject => subject.subjectName);
        const chapters = subjectNames.join(",");

        const AImodel = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
    }
}
