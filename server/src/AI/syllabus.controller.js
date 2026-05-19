const StudentSyllabus = require("../DB/Model/syllabus.model");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/*
|--------------------------------------------------------------------------
| GENERATE SUBJECTS DURING SIGNUP
|--------------------------------------------------------------------------
| This controller:
| 1. Takes selected subjects
| 2. Generates ONLY chapter lists
| 3. Saves lightweight syllabus structure
|--------------------------------------------------------------------------
*/

async function generateInitialSyllabus(req, res) {

    try {

        const { subjects, classLevel, board } = req.body;

        const userId = req.user.id;

        // Validation
        if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {

            return res.status(400).json({
                success: false,
                message: "Subjects array is required"
            });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        // Create subject list for prompt
        const formattedSubjects = subjects.map(sub => `- ${sub}`).join("\n");

        const prompt = `
Generate chapter lists for these subjects.

Subjects:
${formattedSubjects}

Class Level: ${classLevel}
Board: ${board}

Return ONLY valid JSON in this exact format:

{
  "subjects": [
    {
      "subjectName": "Mathematics",
      "chapters": [
        {
          "chapterTitle": "Algebra"
        }
      ]
    }
  ]
}

Rules:
- Generate ONLY chapter titles
- Do NOT generate topics
- Do NOT generate subtopics
- Keep chapter names concise
`;

        const result = await model.generateContent(prompt);

        const response = await result.response;

        const text = response.text();

        let parsedData;

        try {

            parsedData = JSON.parse(text);

        } catch (error) {

            console.error("JSON Parse Error:", error);

            return res.status(500).json({
                success: false,
                message: "AI returned invalid JSON"
            });
        }

        const savedSubjects = [];

        // Save each subject separately
        for (const subject of parsedData.subjects) {

            // Prevent duplicate syllabus
            const existing = await StudentSyllabus.findOne({
                userId,
                subjectName: subject.subjectName
            });

            if (existing) {
                savedSubjects.push(existing);
                continue;
            }

            const chapters = subject.chapters.map((chapter) => ({
                chapterTitle: chapter.chapterTitle,

                isCompleted: false,

                isExpanded: false,

                topics: []
            }));

            const syllabus = await StudentSyllabus.create({
                userId,

                subjectName: subject.subjectName,

                classLevel,

                board,

                chapters
            });

            savedSubjects.push(syllabus);
        }

        return res.status(201).json({
            success: true,
            message: "Initial syllabus generated successfully",
            data: savedSubjects
        });

    } catch (error) {

        console.error("Generate Initial Syllabus Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate syllabus"
        });
    }
}

/*
|--------------------------------------------------------------------------
| EXPAND CHAPTER
|--------------------------------------------------------------------------
| Generates topics only when user opens chapter
|--------------------------------------------------------------------------
*/

async function expandChapterTopics(req, res) {

    try {

        const { syllabusId, chapterId } = req.body;

        const userId = req.user.id;

        const syllabus = await StudentSyllabus.findOne({
            _id: syllabusId,
            userId
        });

        if (!syllabus) {

            return res.status(404).json({
                success: false,
                message: "Syllabus not found"
            });
        }

        const chapter = syllabus.chapters.id(chapterId);

        if (!chapter) {

            return res.status(404).json({
                success: false,
                message: "Chapter not found"
            });
        }

        // Already generated
        if (chapter.isExpanded) {

            return res.status(200).json({
                success: true,
                message: "Chapter already expanded",
                data: chapter
            });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const prompt = `
Generate detailed topics for this chapter.

Subject: ${syllabus.subjectName}
Chapter: ${chapter.chapterTitle}
Grade: ${syllabus.grade}
Board: ${syllabus.board}

Return ONLY valid JSON in this format:

{
  "topics": [
    {
      "topicName": "Topic Name"
    }
  ]
}

Rules:
- Generate ONLY topics
- Do NOT generate subtopics
- Keep names concise
`;

        const result = await model.generateContent(prompt);

        const response = await result.response;

        const text = response.text();

        let parsedData;

        try {

            parsedData = JSON.parse(text);

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: "AI returned invalid JSON"
            });
        }

        chapter.topics = parsedData.topics.map((topic) => ({
            topicName: topic.topicName,

            isCompleted: false,

            isExpanded: false,

            subtopics: [],

            resources: {}
        }));

        chapter.isExpanded = true;

        await syllabus.save();

        return res.status(200).json({
            success: true,
            message: "Topics generated successfully",
            data: chapter
        });

    } catch (error) {

        console.error("Expand Chapter Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to expand chapter"
        });
    }
}

/*
|--------------------------------------------------------------------------
| EXPAND TOPIC
|--------------------------------------------------------------------------
| Generates subtopics only when topic is opened
|--------------------------------------------------------------------------
*/

async function expandTopicSubtopics(req, res) {

    try {

        const { syllabusId, chapterId, topicId } = req.body;

        const userId = req.user.id;

        const syllabus = await StudentSyllabus.findOne({
            _id: syllabusId,
            userId
        });

        if (!syllabus) {

            return res.status(404).json({
                success: false,
                message: "Syllabus not found"
            });
        }

        const chapter = syllabus.chapters.id(chapterId);

        if (!chapter) {

            return res.status(404).json({
                success: false,
                message: "Chapter not found"
            });
        }

        const topic = chapter.topics.id(topicId);

        if (!topic) {

            return res.status(404).json({
                success: false,
                message: "Topic not found"
            });
        }

        // Already expanded
        if (topic.isExpanded) {

            return res.status(200).json({
                success: true,
                message: "Topic already expanded",
                data: topic
            });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const prompt = `
Generate detailed subtopics for this topic.

Subject: ${syllabus.subjectName}
Chapter: ${chapter.chapterTitle}
Topic: ${topic.topicName}

Return ONLY valid JSON in this format:

{
  "subtopics": [
    {
      "subtopicName": "Subtopic Name"
    }
  ]
}

Rules:
- Generate concise subtopics
- No explanations
`;

        const result = await model.generateContent(prompt);

        const response = await result.response;

        const text = response.text();

        let parsedData;

        try {

            parsedData = JSON.parse(text);

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: "AI returned invalid JSON"
            });
        }

        topic.subtopics = parsedData.subtopics.map((subtopic) => ({
            subtopicName: subtopic.subtopicName,
            isCompleted: false
        }));

        topic.isExpanded = true;

        await syllabus.save();

        return res.status(200).json({
            success: true,
            message: "Subtopics generated successfully",
            data: topic
        });

    } catch (error) {

        console.error("Expand Topic Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to expand topic"
        });
    }
}

module.exports = {
    generateInitialSyllabus,
    expandChapterTopics,
    expandTopicSubtopics
};