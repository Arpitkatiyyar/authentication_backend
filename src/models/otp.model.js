import mongoose from "mongoose";

const otpSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "email is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "username is required"],
    },
    otpHash: {
      type: String,
      required: true,
    },
    createdAt: { 
      type: Date, 
      default: Date.now,
      expires: 300 
    }
  },
  {
    timestamps: true,
  },
);

const otpModel=mongoose.model("otps",otpSchema)

export default otpModel
