import express, { Request, Response, NextFunction } from "express"
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

// @vendia/serverless-express sets req.body as a Buffer; Node.js 20 stream is unreadable by body-parser by then
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (Buffer.isBuffer(req.body)) {
    try {
      req.body = JSON.parse(req.body.toString("utf8"))
    } catch {
      req.body = {}
    }
    ;(req as { _body?: boolean })._body = true
  }
  next()
})
app.use(express.json())

app.use("/v1", router)

app.use(errorHandler)

export default app
