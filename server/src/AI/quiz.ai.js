const { GoogleGenerativeAI } = require("@google/generative-ai");
const studentModel = require("../DB/Model/student.user");
const QuizResult = require("../DB/Model/quiz.user");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateQuiz(req, res) {
    try {
        const { subjectName, topicName } = req.body;
        const studentInfo = await studentModel.findById({ studentId: req.user.id }).populate('userId', 'name');
        const AImodel = genAI.getGenerativeModel({ model: "gemini-3-flash" });
        const systemPrompt = `You are a quiz generator for students.
        The student's name is "${studentInfo.userId.name}", they are in "${studentInfo.grade} class", 
        their age is "${studentInfo.age}", and they belong to the "${studentInfo.board}" board of education.
        Generate a quiz with 5 questions on the topic "${topicName}" from the subject "${subjectName}".
        Each question should have 4 multiple-choice options (A, B, C, D) and indicate the correct answer.
        Return the quiz in this JSON format:
        {
            "questions": [
                {
                    "question": "Question text here?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctAnswer": "A"
                }
            ]
        }
        `;

        const result = await AImodel.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();
        const quizData = JSON.parse(text);
        // Save the quiz result to the database
        const savedQuiz = await QuizResult.create({
            studentId: req.user.id,
            subjectName,
            topicName,
            quizHistory: quizData
        });

        //store the marks based on the quizData and the student's answers (this part is simplified and would require additional logic to compare answers)
        res.status(201).json({ message: "Quiz Generated", quiz: savedQuiz });
    } catch (error) {
        console.error("Error occurred while generating quiz:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}