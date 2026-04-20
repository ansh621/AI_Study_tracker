const app = require("./src/app")
const DBConnnect = require("./src/DB/connectivity")
require("dotenv").config();

const port = app.listen(3000,()=>{
console.log("Server.started");
DBConnnect()
})