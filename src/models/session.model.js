import mongoose from "mongoose";

const sessionSchema=mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:[true,"user is required"]
    },
    refreshTokenHash:{
        type:String,
        required:[true,"refreshtoken hash is required"]
    },
    ip:{
        type:String,
        required:[true,"ip hash is required"]
    },
    userAgent:{
        type:String,
        required:[true,"userAgent hash is required"]
    },
    revoked:{
        type:Boolean,
        default:false
    }
},{
    timestamps:true
})

const sessionModel=mongoose.model("sessions",sessionSchema)
export default sessionModel