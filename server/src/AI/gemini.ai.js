const { GoogleGenerativeAI } = require("@google/generative-ai");
const Task = require("../DB/Model/task.model");
const studentModel = require("../DB/Model/student.user")


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateAIPlan(req, res) {
    try {
        const { studentId, prompt } = req.body; 
        const studentInfo = await studentModel.findById({studentId}).populate('userId', 'name');
        const AImodel = genAI.getGenerativeModel({ model: "gemini-3-flash" });

        // This "System Prompt" forces the AI to give us data we can actually save
        const systemPrompt = `You are a study assistant.
        You have consider these situations ,
        the student name is "${studentInfo.userId.name}" the student is in "${studentInfo.grade} class , 
        student's age is "${studentInfo.age}" so you have to give answers accordingly and
        student belong to "${studentInfo.board}" board of education 
        The student says: "${prompt}". 
        Create a list of 3 study tasks. Return ONLY a JSON array in this format: 
        [{"title": "task name", "description": "details"}]`;

        const result = await AImodel.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();
        
        // Parse the AI's string back into a real Javascript Array
        const tasksData = JSON.parse(text);

        // Save them to the database
        const savedTasks = await Task.insertMany(
            tasksData.map(task => ({ ...task, studentId }))
        );

        res.status(201).json({ message: "AI Plan Generated", tasks: savedTasks });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "AI failed to generate tasks" });
    }
}