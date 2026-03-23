import userModel from "../models/user.model.js";
import crypto, { generateKey } from "crypto"
import config from "../config/config.js";
import { otpGenrate,getOtpHtml } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";
import sessionModel from "../models/session.model.js";
import {sendEmail} from "../services/email.services.js"
import jwt from "jsonwebtoken" 
import { loginLimiter } from "../middleware/rateLimiter.js";
 

export async function register(req,res) {
    const {username,email,password}=req.body

    const isAlreadyExists=await userModel.findOne({
        $or:[
            {username},
            {email}
        ]
    })

    if(isAlreadyExists){
        return res.status(409).json({
            message:"user already exists",
        })
    }
    
    const hashedPassword=crypto.createHash("sha256").update(password).digest("hex");

    const user= await userModel.create({
        username,
        email,
        password:hashedPassword
    })

    const otp=otpGenrate();
    const html=getOtpHtml(otp);

    const otpHash=crypto.createHash("sha256").update(otp).digest("hex");
    await otpModel.create({
        email,
        user:user._id,
        otpHash
    })

    await sendEmail(email, "OTP Verification", `Your OTP code is ${otp}`, html)

    await 
    res.status(200).json({
        message:"user created",
        user:{
            username:user.username,
            email:user.email,
            verified:user.verified
        }
    })   
}

export async function login(req,res){
    const {email,password}= req.body

    const user = await userModel.findOne({email})
    if(!user){
        return res.status(401).json({
            message:"invalid user or password"
        })
    }

    if(!user.verified){
        return res.status(401).json({
            message:"email not verified."
        })
    }

    const hashedPassword=crypto.createHash("sha256").update(password).digest("hex")
    
    const isPasswordValid=hashedPassword===user.password;
    if(!isPasswordValid){
        return res.status(401).json({
            message:"password is incorrect"
        })
    }

    const refreshToken=jwt.sign({
        id:user._id
    },config.JWT_SECRET,{
        expiresIn:"7d",
    })

    const refreshTokenHash=crypto.createHash("sha256").update(refreshToken).digest("hex");
    const session=await sessionModel.create({
        user:user._id,
        refreshTokenHash,
        ip:req.ip,
        userAgent:req.headers["user-agent"]
    })

    const accessToken=jwt.sign({
        id:user._id,
        sessionId:session._id
    },config.JWT_SECRET,{
        expiresIn:"15m"
    })

    res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        maxAge:7*24*60*60*1000 //7day
    })
    res.status(200).json({
        message:"user logged in succesfully",
        user:{
            username:user.username,
            email:user.email
        },
        accessToken
    })
    req.loginLimiter?.resetKey(req.ip + "-" + req.body.email);
}

export async function getMe(req,res){
    const token=req.headers.authorization?.split(" ")[1]

    if(!token){
        return res.status(401).json({
            message:"authorization token is missing"
        })
    }   

    const decoded=jwt.verify(token,config.JWT_SECRET)

    const user = await userModel.findById(decoded.id)

    res.status(200).json({
        message:"user fetched successfully",
        user: {
            username: user.username,
            email: user.email,
        }
    })
}

export async function refreshToken(req,res){
    const refreshToken=req.cookies.refreshToken
    if(!refreshToken){
        return res.status(401).json({
            message:"Refresh Token not found."
        })
    }
    const decoded=jwt.verify(refreshToken,config.JWT_SECRET);
    
    const refreshTokenHash=crypto.createHash("sha256").update(refreshToken).digest("hex")

    const session=await sessionModel.findOne({
        refreshTokenHash,
        revoked:false
    })

    if(!session){
        res.status(401).json({
            message:"no session found"
        })
    }

    const accessToken = jwt.sign(
      {
        id: decoded.id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    const newRefreshToken=jwt.sign({
        id:decoded.id
    },config.JWT_SECRET,{
        expiresIn:"7d"
    })

    const newRefreshTokenHash=crypto.createHash("sha256").update(newRefreshToken).digest("hex")
    session.refreshTokenHash=newRefreshTokenHash;
    await session.save()

    res.cookie("refreshToken",newRefreshToken,{
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        maxAge:7*24*60*60*1000 //7day
    })

    res.status(200).json({
        message:"refresh token updated",
        accessToken,
        username:decoded.username
    })
    // console.log(decoded.id);
    // console.log(decoded.username)
    // console.log(decoded)

}

export async function logout(req,res){
    const refreshToken=req.cookies.refreshToken;
    if(!refreshToken){
        res.json(400).json({
            message:"no refreshtoken found"
        })
    }

    const refreshTokenHash=crypto.createHash("sha256").update(refreshToken).digest("hex")

    const session=await sessionModel.findOne({
        refreshTokenHash,
        revoked:false
    })

    if(!session){
        res.status(400).json({
            message:"user is not login"
        })
    }
    session.revoked=true;
    await session.save()

    res.clearCookie("refreshToken")
    res.status(200).json({
        message:"user logged out"
    })
}

export async function logoutAll(req,res){
    const refreshToken=req.cookies.refreshToken;

    if(!refreshToken){
        return res.status(400).json({
            message:"no refresh token found"
        })
    }
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)


    await sessionModel.updateMany({
        user:decoded.id,
        revoked:false
    },{
        revoked:true
    })

    res.clearCookie("refreshToken")
    res.status(200).json({
        message:"logout all"
    })
}

export async function verifyEmail(req,res){
    const {email,otp} =req.body

    const otpHash=crypto.createHash("sha256").update(otp).digest("hex")

    const otpDoc= await otpModel.findOne({
        email,
        otpHash
    })

    if(!otpDoc){
        return res.status(400).json({
            message:"Invalid OTP"
        })
    }

    const user = await userModel.findByIdAndUpdate(otpDoc.user, 
        {verified: true,},
        { new: true }
    );

    await otpModel.deleteMany({
        user:otpDoc.user
    })

    res.status(200).json({
        message:"email verified successfully",
        user:{
            username:user.username,
            email:user.email,
            verified:user.verified
        }
    })
}

export async function resendOtp(req,res){
    const {email}=req.body

    const user=await userModel.findOne({
        email
    })
    // console.log(user)

    const otp=otpGenrate();
    const html=getOtpHtml(otp);

    const otpHash=crypto.createHash("sha256").update(otp).digest("hex");
    await otpModel.create({
        email,
        user:user._id,
        otpHash
    })

    await sendEmail(email, "OTP Verification", `Your OTP code is ${otp}`, html)

    res.status(200).json({
        message:"otp resend succesfully"
    })
}

export async function forgetPassword(req,res){
    const {email} = req.body;

    const user=await userModel.findOne({email});

    if(!user){
        return res.status(409).json({
            message:"user didn't exists"
        })
    }

    const otp = otpGenrate();
    const html = getOtpHtml(otp);

    const otpHash=crypto.createHash("sha256").update(otp).digest("hex");
    await otpModel.create({
        email,
        user:user._id,
        otpHash
    })
    await sendEmail(email,"otp for forget password",`your otp is ${otp}`,html)
    
    res.status(200).json({
        message:"otp sent"
    })
    // console.log(password)
}

export async function resetPassword(req,res){
    const {email,otp,password}=req.body;
    const user=await userModel.findOne({email});

    if(!user){
        res.status(403).json({
            message:"no user found"
        })
    }




    const otpHash=crypto.createHash("sha256").update(otp).digest("hex");
    const otpDoc=await otpModel.findOne({
        email,
        otpHash
    })
    if(!otpDoc){
        return res.status(403).json({
            message:"incorrect otp"
        })
    }

    const now = Date.now();
    const age = now - otpDoc.createdAt.getTime();
    if (age > 5*60 * 1000) {
      await otpModel.deleteMany({
        user: otpDoc.user,
      }); // 5 minutes
      return res.status(403).json({
        message: "otp expired",
      });
    }

    const passwordHash=crypto.createHash("sha256").update(password).digest("hex")
    const newUser=await userModel.findOneAndUpdate(
        {email},
        {password:passwordHash},
        { new: true, runValidators: true } 
    )
    await otpModel.deleteMany({
        user:otpDoc.user
    })
    res.status(200).json({
        message:"password updated succesfully"
    })
}