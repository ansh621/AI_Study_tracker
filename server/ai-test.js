require('dotenv').config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testAI() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        const result = await model.generateContent(
            "Say System Online"
        );

        console.log(result.response.text());

    } catch (err) {
        console.error(err);
    }
}

testAI();