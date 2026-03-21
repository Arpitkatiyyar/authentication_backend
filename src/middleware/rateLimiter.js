import rateLimit,{ ipKeyGenerator } from "express-rate-limit";
import slowDown from "express-slow-down";

export const loginLimiter=rateLimit({
    windowMs:60*1000,
    max:5,
    message:{
        success:false,
        message: "Too many wrong login attempts."
    },
    standardHeaders:true,
    legacyHeaders:false,


    keyGenerator:(req)=>{
        return ipKeyGenerator(req) +"-"+(req.body.email || "unknown")
    }
});

export const loginSlowdown=slowDown({
    windowMs:15*60*1000,
    delayAfter:3,
    delayMs:()=>500,
      validate: {
    delayMs: false,
  },
})