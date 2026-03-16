import app from "./src/app.js";
import dbConnect from "./src/db/db.js";

dbConnect()

app.listen(3000,()=>{
    console.log("server running at port 3000")
})