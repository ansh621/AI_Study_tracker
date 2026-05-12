const StudentSyllabus = require("../DB/Model/syllabus.model");
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Fixed Name
const studentModel = require("../DB/Model/student.user");


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function feedStudentSyllabus(req, res) {
    try {
        const { subjectName, grade, board } = req.body;
        const studentId = req.user.id; 

        // 1. Fetch Student Data
        const studentInfo = await studentModel.findOne({ userId: studentId }); // Fixed Query

        if (!studentInfo) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        const AImodel = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" } // Force JSON
        });

        // 2. Fixed Prompt (Using actual variables)
        const prompt = `
          Generate a detailed syllabus for ${subjectName} grade ${grade} for the ${board} board.
          Return the data in this exact JSON format:
          {
            "subjectName": "${subjectName}",
            "grade": "${grade}",
            "board": "${board}",
            "chapters": [
              {
                "chapterTitle": "Chapter Name",
                "topics": [
                  { "topicName": "Specific Topic 1" },
                  { "topicName": "Specific Topic 2" }
                ]
              }
            ]
          }
        `;

        const result = await AImodel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 3. Parse JSON safely
        const syllabusData = JSON.parse(text);

        // 4. Upsert (Update if exists, Create if not)
        const savedSyllabus = await StudentSyllabus.findOneAndUpdate(
            { subjectName, userId: studentId }, // Filter
            { ...syllabusData, userId: studentId }, // Data
            { upsert: true, new: true } // Options
        );

        res.status(201).json({ message: "AI Syllabus Generated", data: savedSyllabus });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: "AI failed to generate syllabus" });
    }
}
exports.model = genAI; // Exporting the model instance for reuse in quiz generation
module.exports = { feedStudentSyllabus };