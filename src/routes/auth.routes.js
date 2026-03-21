import { Router } from "express";
import * as authController from "../controllers/auth.controller.js"
import { loginLimiter,loginSlowdown } from "../middleware/rateLimiter.js";
const authRouter=Router()

authRouter.post("/register",authController.register)

authRouter.post("/login",loginLimiter,loginSlowdown,authController.login)

authRouter.get("/get-me",authController.getMe)

authRouter.post("/refresh-token",authController.refreshToken)

authRouter.post("/logout",authController.logout)

authRouter.post("/logout-all",authController.logoutAll)

authRouter.post("/verify-email",authController.verifyEmail)

authRouter.post("/resend-otp",authController.resendOtp)

export default authRouter