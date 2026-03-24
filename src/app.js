import express from 'express'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth.routes.js'
import cors from 'cors';
const app=express()

app.use(express.json())
app.use(cookieParser())
app.set("trust proxy", 1);
app.use(cors({
  origin: "http://localhost:5173", // explicitly allow your frontend
  credentials: true                // allow cookies/authorization headers
}));

app.use("/api/auth",authRouter)

export default app;