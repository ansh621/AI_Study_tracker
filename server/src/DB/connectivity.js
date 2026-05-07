const { default: mongoose } = require("mongoose");
require('dotenv').config();
async function connectDB(){
    await mongoose.connect(process.env.MONGOURI);
    console.log("DB connected sucessfully");
}

module.exports = connectDB;