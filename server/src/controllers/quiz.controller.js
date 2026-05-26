const { GoogleGenerativeAI } = require("@google/generative-ai");
const QuizAttempt = require("../DB/Model/quiz.user");
const StudentInfo = require("../DB/Model/student.user");
const User = require("../DB/Model/model.user");
const StudentSyllabus = require("../DB/Model/syllabus.model");

function cleanJson(text) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function normalizeGeneratedQuestions(rawQuestions) {
  return (Array.isArray(rawQuestions) ? rawQuestions : []).slice(0, 15).map((item) => {
    const options = Array.isArray(item.options) ? item.options.slice(0, 4) : [];
    return {
      question: String(item.question || "Untitled question").trim(),
      options: options.map((option) => String(option).trim()),
      correctAnswer: String(item.correctAnswer || "").trim().toUpperCase(),
    };
  }).filter((question) => question.options.length === 4 && ["A", "B", "C", "D"].includes(question.correctAnswer));
}

async function generateWithFallback(prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const models = ["gemini-3.1-flash-lite", "gemini-2.5-flash"];
  let lastError;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" },
      });
      return await model.generateContent(prompt);
    } catch (error) {
      lastError = error;
      console.error(`Quiz generation failed on ${modelName}:`, error.message);
    }
  }

  throw lastError;
}

async function generateQuiz(req, res) {
  try {
    const { syllabusId, chapterId, topicId } = req.body;

    if (!syllabusId || !chapterId || !topicId) {
      return res.status(400).json({ message: "syllabusId, chapterId and topicId are required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "GEMINI_API_KEY is missing" });
    }

    const syllabus = await StudentSyllabus.findOne({ _id: syllabusId, userId: req.user.id });
    if (!syllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }
    const chapter = syllabus.chapters.id(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }
    const topic = chapter.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    if (!chapter.isExpanded || !chapter.topics?.length) {
      return res.status(400).json({ message: "Please generate chapter topics first from focus/quiz setup" });
    }

    const [studentInfo, user] = await Promise.all([
      StudentInfo.findOne({ userId: req.user.id }).select("grade board age"),
      User.findById(req.user.id).select("name"),
    ]);

    const prompt = `
Generate a 10 to 15-question MCQ quiz.

Student context:
- Name: ${user?.name || "Student"}
- Grade: ${studentInfo?.grade || "Not provided"}
- Board: ${studentInfo?.board || "Not provided"}
- Age: ${studentInfo?.age || "Not provided"}

Syllabus context:
- Subject: ${syllabus.subjectName}
- Chapter: ${chapter.chapterTitle}
- Topic: ${topic.topicName}

Return ONLY JSON in this shape:
{
  "questions": [
    {
      "question": "text",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": "A"
    }
  ]
}
`;

    const result = await generateWithFallback(prompt);
    const parsed = JSON.parse(cleanJson(result.response.text()));
    const questions = normalizeGeneratedQuestions(parsed?.questions);

    if (questions.length < 10) {
      return res.status(502).json({ message: "AI returned too few valid quiz questions. Please try again." });
    }

    res.status(201).json({
      message: "Quiz generated successfully",
      data: {
        syllabusId,
        chapterId,
        topicId,
        subjectName: syllabus.subjectName,
        chapterTitle: chapter.chapterTitle,
        topicName: topic.topicName,
        questions,
      },
    });
  } catch (error) {
    console.error("Generate quiz error:", error);
    res.status(500).json({ message: "Unable to generate quiz right now" });
  }
}

async function submitQuizAttempt(req, res) {
  try {
    const {
      syllabusId,
      chapterId,
      topicId,
      subjectName,
      chapterTitle,
      topicName,
      questions,
      answers,
    } = req.body;

    if (!subjectName || !chapterTitle || !topicName || !Array.isArray(questions) || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Invalid quiz payload" });
    }

    const sanitizedQuestions = normalizeGeneratedQuestions(questions);
    if (!sanitizedQuestions.length || answers.length !== sanitizedQuestions.length) {
      return res.status(400).json({ message: "Questions and answers mismatch" });
    }

    let marksObtained = 0;
    const normalizedAnswers = answers.map((answer) => String(answer || "").trim().toUpperCase());
    sanitizedQuestions.forEach((question, index) => {
      if (normalizedAnswers[index] === question.correctAnswer) {
        marksObtained += 1;
      }
    });

    const syllabus = await StudentSyllabus.findOne({ _id: syllabusId, userId: req.user.id });
    if (!syllabus) {
      return res.status(404).json({ message: "Syllabus not found for completion update" });
    }
    const chapter = syllabus.chapters.id(chapterId);
    const topic = chapter?.topics?.id(topicId);

    const attempt = await QuizAttempt.create({
      studentId: req.user.id,
      syllabusId,
      chapterId,
      topicId,
      subjectName: String(subjectName).trim(),
      chapterTitle: String(chapterTitle).trim(),
      topicName: String(topicName).trim(),
      questions: sanitizedQuestions,
      answers: normalizedAnswers,
      marksObtained,
      maxMarks: sanitizedQuestions.length,
    });

    const percentage = sanitizedQuestions.length
      ? Math.round((marksObtained / sanitizedQuestions.length) * 100)
      : 0;
    if (topic && percentage >= 70) {
      topic.isCompleted = true;
      chapter.isCompleted = chapter.topics.length > 0 && chapter.topics.every((entry) => entry.isCompleted);
      await syllabus.save();
    }

    res.status(201).json({
      message: "Quiz submitted successfully",
      data: {
        id: attempt._id,
        marksObtained: attempt.marksObtained,
        maxMarks: attempt.maxMarks,
        percentage,
        topicMarkedCompleted: Boolean(topic?.isCompleted && percentage >= 70),
      },
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    res.status(500).json({ message: "Unable to submit quiz attempt" });
  }
}

module.exports = {
  generateQuiz,
  submitQuizAttempt,
};
