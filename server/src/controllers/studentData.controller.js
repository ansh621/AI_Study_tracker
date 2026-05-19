const studentModel = require("../DB/Model/student.user");

async function studentData(req, res) {
  try {
    // req.user.id was placed here by the 'protect' middleware
    const userId = req.user.id; 
    const { age, grade, board, gender } = req.body;

    const studentdata = await studentModel.findOneAndUpdate(
      { userId },
      { age, grade, board, gender },
      { returnDocument: "after", upsert: true }
    );

    res.status(201).json({ message: "Info saved", data: studentdata });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function StudentSubjects(req, res) {
  try {
    const userId = req.user.id;
    const { subjects } = req.body;

    const studentInfo = await studentModel.findOneAndUpdate(
      { userId },
      { subjects },
      { returnDocument: 'after', upsert: true }
    );

    if (!studentInfo) return res.status(404).json({ message: "Profile not found" });

    res.status(200).json({ message: "Subjects updated", data: studentInfo });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = { studentData, StudentSubjects };