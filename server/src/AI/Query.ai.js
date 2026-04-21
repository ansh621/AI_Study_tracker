const { GoogleGenerativeAI } = require("@google/generative-ai");
const studentModel = require("../DB/Model/student.user")

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function askQuery(req,res){
    try {
        const { studentId, prompt } = req.body;
        const studentInfo = await studentModel.findById({studentId}).populate('userId', 'name');
        const artistModle = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });        
        const AImodel = genAI.getGenerativeModel({ model: "gemini-3-flash" });

        const brainPrompt = `
            Student Profile: Name: ${studentInfo.userId.name}, Grade: ${studentInfo.grade}, Board: ${studentInfo.board}, Age: ${studentInfo.age}.
            Student Question: "${prompt}"

            Task: 
            1. Provide a helpful, age-appropriate explanation.
            2. Decide if a visual diagram would help. If yes, write a detailed 'imagePrompt' for an illustrator.
            
            Return this JSON format:
            {
                "answer": "Your detailed explanation here...",
                "needsImage": true,
                "imagePrompt": "A professional 2D educational diagram showing [topic] with clear labels..."
            }
        `;

        const textResult = await AImodel.generateContent(brainPrompt);
        const { answer, needsImage, imagePrompt } = JSON.parse(textResult.response.text());
        let finalImageUrl = null;
        if (needsImage) {
            const imageResult = await artistModle.generateContent(imagePrompt);
            finalImageUrl = imageResult.response.candidates[0].content.parts[0].text;
        }

        res.status(200).json({
            studentName: studentInfo.userId.name,
            explanation: answer,
            imageUrl: finalImageUrl,
            aiThoughtProcess: imagePrompt
        });

        
    } catch (error) {
        console.error("Error occurred while asking query:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

