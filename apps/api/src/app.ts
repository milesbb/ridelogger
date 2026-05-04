import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import rateLimit from "express-rate-limit"
import router from "./controllers"
import { errorHandler } from "./middlewares/errorHandler"

const app = express()

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000"

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  }),
)

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

app.use(cookieParser())
app.use(express.json())

app.use("/v1", router)

app.use(errorHandler)

export default app
