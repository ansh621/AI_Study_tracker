const studentModel = require('../DB/Model/student.user')

async function feedStudentInfo(req,res){
    try{
        const {age,grade,board, userId} = req.body;
        const studentdata  = await studentModel.create({
            age,grade,board, userId
        })
        res.status(201).json({
            message: "Student info saved successfully",
            data: studentdata
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
module.exports = feedStudentInfo;