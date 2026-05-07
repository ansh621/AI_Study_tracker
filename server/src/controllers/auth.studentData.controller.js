const studentModel = require("../DB/Model/student.user");
const jwt = require("jsonwebtoken");
async function studentData(req, res) {
  try {
    const token = req.cookies.Token; // Assuming your cookie is named 'Token'
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { age, grade, board, gender } = req.body;
    const studentdata = await studentModel.create({
      age,
      grade,
      board,
      gender,
      userId,
    });
    res.status(201).json({
      message: "Student info saved successfully",
      data: studentdata,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
module.exports = { studentData };
