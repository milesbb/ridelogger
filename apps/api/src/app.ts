// Express app — wrapped by lambda.ts for production
import express, { Request, Response, NextFunction } from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import rateLimit from "express-rate-limit"
import router from "./controllers"
import { errorHandler } from "./middlewares/errorHandler"
import logger from "./utils/logging"

const app = express()

app.set('trust proxy', 1)

app.use(helmet())

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  res.on('finish', () => {
    logger.info('request', { method: req.method, url: req.url, status: res.statusCode, ms: Date.now() - start })
  })
  next()
})

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000"

app.use(
  cors({
    origin: [frontendUrl, "https://ridelogger.au", "https://www.ridelogger.au"],
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

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later." },
})
app.use("/v1/auth/login", authRateLimit)
app.use("/v1/auth/register", authRateLimit)

app.use(cookieParser())

// In Lambda (Node.js 20) the request stream is never readable; parse the pre-set Buffer directly
const isLambda = !!process.env.LAMBDA_TASK_ROOT
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (Buffer.isBuffer(req.body)) {
    try {
      req.body = JSON.parse(req.body.toString("utf8"))
    } catch {
      req.body = {}
    }
  }
  if (isLambda) {
    ;(req as { _body?: boolean })._body = true
  }
  next()
})
app.use(express.json({ limit: "16kb" }))

app.use("/v1", router)

app.use(errorHandler)

export default app
