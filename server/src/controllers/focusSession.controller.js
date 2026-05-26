const { GoogleGenerativeAI } = require("@google/generative-ai");
const FocusSession = require("../DB/Model/focusSession.model");
const StudentSyllabus = require("../DB/Model/syllabus.model");
const StudentInfo = require("../DB/Model/student.user");
const User = require("../DB/Model/model.user");
const { recordStudyActivity } = require("../middleware/activity.streak");

function cleanJson(text) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function getGeminiModel(modelName, responseMimeType) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: responseMimeType ? { responseMimeType } : undefined,
  });
}

async function generateJsonWithFallback(prompt) {
  const models = ["gemini-3.1-flash-lite", "gemini-2.5-flash"];
  let lastError;
  for (const modelName of models) {
    try {
      const model = getGeminiModel(modelName, "application/json");
      return await model.generateContent(prompt);
    } catch (error) {
      lastError = error;
      console.error(`Focus JSON generation failed on ${modelName}:`, error.message);
    }
  }
  throw lastError;
}

function readImagePart(response) {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  const inlinePart = parts.find((part) => part.inlineData?.data);

  if (inlinePart?.inlineData?.data) {
    const mimeType = inlinePart.inlineData.mimeType || "image/png";
    return `data:${mimeType};base64,${inlinePart.inlineData.data}`;
  }

  const textPart = parts.find((part) => part.text);
  return textPart?.text || null;
}

async function listSyllabus(req, res) {
  try {
    const syllabus = await StudentSyllabus.find({ userId: req.user.id }).sort({
      subjectName: 1,
    });

    res.status(200).json({ data: syllabus });
  } catch (error) {
    console.error("List syllabus error:", error);
    res.status(500).json({ message: "Unable to load syllabus" });
  }
}

async function startFocusSession(req, res) {
  try {
    const userId = req.user.id;
    const {
      syllabusId,
      chapterId,
      topicId,
      otherTopic,
      durationMinutes = 25,
    } = req.body;

    const syllabus = await StudentSyllabus.findOne({ _id: syllabusId, userId });

    if (!syllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    const chapter = syllabus.chapters.id(chapterId);

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const chosenTopic = otherTopic?.trim()
      || chapter.topics.id(topicId)?.topicName
      || "";

    if (!chosenTopic) {
      return res.status(400).json({ message: "Please select or enter a topic" });
    }

    const session = await FocusSession.create({
      userId,
      syllabusId,
      chapterId,
      subjectName: syllabus.subjectName,
      chapterTitle: chapter.chapterTitle,
      topicName: chosenTopic,
      isOtherTopic: Boolean(otherTopic?.trim()),
      durationMinutes: Number(durationMinutes) || 25,
      tutorMessages: [
        {
          role: "tutor",
          content: `Hello! I'm your Focus Nest assistant. We're currently in a focus session for "${chosenTopic}". How can I help you clarify this topic today?`,
        },
      ],
    });

    res.status(201).json({ message: "Focus session started", data: session });
  } catch (error) {
    console.error("Start focus session error:", error);
    res.status(500).json({ message: "Unable to start focus session" });
  }
}

async function getFocusSession(req, res) {
  try {
    const session = await FocusSession.findOne({
      _id: req.params.sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ message: "Focus session not found" });
    }

    res.status(200).json({ data: session });
  } catch (error) {
    console.error("Get focus session error:", error);
    res.status(500).json({ message: "Unable to load focus session" });
  }
}

async function endFocusSession(req, res) {
  try {
    const { status = "completed" } = req.body;
    const session = await FocusSession.findOne({
      _id: req.params.sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ message: "Focus session not found" });
    }

    if (session.status === "active") {
      session.status = status === "exited" ? "exited" : "completed";
      session.endedAt = new Date();
      await session.save();
      await recordStudyActivity(req.user.id);
    }

    res.status(200).json({
      message:
        session.status === "exited"
          ? "Focus session ended because you left the page"
          : "Focus session completed",
      data: session,
    });
  } catch (error) {
    console.error("End focus session error:", error);
    res.status(500).json({ message: "Unable to finish focus session" });
  }
}

async function askFocusTutor(req, res) {
  try {
    const { question } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    const session = await FocusSession.findOne({
      _id: req.params.sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ message: "Focus session not found" });
    }

    const [student, user] = await Promise.all([
      StudentInfo.findOne({ userId: req.user.id }).select("grade board age"),
      User.findById(req.user.id).select("name"),
    ]);

    const prompt = `
You are an encouraging AI tutor inside a live focus session.

Student:
- Name: ${user?.name || "Student"}
- Grade: ${student?.grade || "Not provided"}
- Board: ${student?.board || "Not provided"}
- Age: ${student?.age || "Not provided"}

Current focus:
- Subject: ${session.subjectName}
- Chapter: ${session.chapterTitle}
- Topic: ${session.topicName}

Student question: "${question}"

Return ONLY valid JSON:
{
  "answer": "clear age-appropriate answer in 3 to 6 short sentences",
  "needsImage": false,
  "imagePrompt": "only if a diagram, graph, labeled visual, or process image would help"
}
`;

    const result = await generateJsonWithFallback(prompt);
    const parsed = JSON.parse(cleanJson(result.response.text()));
    let imageUrl = null;

    if (parsed.needsImage && parsed.imagePrompt) {
      try {
        const imageModel = getGeminiModel("gemini-2.5-flash-image");
        const imageResult = await imageModel.generateContent(parsed.imagePrompt);
        imageUrl = readImagePart(imageResult.response);
      } catch (imageError) {
        console.error("Tutor image generation error:", imageError);
      }
    }

    session.tutorMessages.push({ role: "student", content: question.trim() });
    session.tutorMessages.push({
      role: "tutor",
      content: parsed.answer || "Let's break that down together.",
      imageUrl,
    });
    await session.save();

    res.status(200).json({
      answer: parsed.answer,
      needsImage: Boolean(parsed.needsImage),
      imageUrl,
      data: session,
    });
  } catch (error) {
    console.error("Ask focus tutor error:", error);
    res.status(500).json({ message: "AI tutor could not answer right now" });
  }
}

async function getFocusSessionSummary(req, res) {
  try {
    const session = await FocusSession.findOne({
      _id: req.params.sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ message: "Focus session not found" });
    }

    const transcript = (session.tutorMessages || [])
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")
      .slice(0, 6000);

    const prompt = `
Create concise revision output from this focus session.

Topic: ${session.topicName}
Transcript:
${transcript || "No transcript"}

Return ONLY JSON:
{
  "summary": "4 to 6 sentences",
  "keyPoints": ["point", "point", "point"],
  "nextSteps": ["step", "step"]
}
`;
    const result = await generateJsonWithFallback(prompt);
    const parsed = JSON.parse(cleanJson(result.response.text()));
    res.status(200).json({ data: parsed });
  } catch (error) {
    console.error("Focus summary error:", error);
    res.status(500).json({ message: "Unable to generate summary now" });
  }
}

module.exports = {
  listSyllabus,
  startFocusSession,
  getFocusSession,
  endFocusSession,
  askFocusTutor,
  getFocusSessionSummary,
};
