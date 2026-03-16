import mongoose from "mongoose";
import config from "../config/config.js";

async function dbConnect() {
    try{
        await mongoose.connect(config.MONGO_URI)
        console.log("DB connected successfully")
    }
    catch{
        console.error("DB not connected")
        console.log(config.MONGO_URI)
    }
}
export default dbConnect