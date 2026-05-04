import { Router, Request, Response, NextFunction } from "express"
import { loginUser, refreshUserToken, logoutUser, registerUser } from "../service/auth"
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth"
import { Errors } from "../utils/errorTypes"

const router = Router()

const COOKIE_NAME = "refreshToken"
const USER_ID_COOKIE = "userId"

function cookieOpts(maxAge: number) {
  const prod = process.env.NODE_ENV === "production"
  return {
    httpOnly: true,
    secure: prod,
    sameSite: (prod ? "none" : "lax") as "none" | "lax",
    maxAge,
  }
}

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body
    if (!email || !password) throw Errors.BadRequest("email and password required")

    const { accessToken, refreshToken } = await loginUser(email, password)

    // Store userId in a non-httpOnly cookie so the refresh endpoint can read it
    // (httpOnly prevents JS access but server can still read it)
    const userId = (await import("../data/users")).getUserByEmail(email.toLowerCase())
      .then(u => u!.id)

    res.cookie(COOKIE_NAME, refreshToken, cookieOpts(THIRTY_DAYS))
    res.cookie(USER_ID_COOKIE, await userId, { ...cookieOpts(THIRTY_DAYS), httpOnly: false })
    res.json({ accessToken })
  } catch (err) {
    next(err)
  }
})

router.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies[COOKIE_NAME]
    const userId = req.cookies[USER_ID_COOKIE]
    if (!refreshToken || !userId) throw Errors.Unauthorized()

    const accessToken = await refreshUserToken(refreshToken, userId)
    res.json({ accessToken })
  } catch (err) {
    next(err)
  }
})

router.post("/logout", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    await logoutUser(userId)
    res.clearCookie(COOKIE_NAME)
    res.clearCookie(USER_ID_COOKIE)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// No sign-up UI — use this endpoint programmatically to create accounts
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, secret } = req.body
    if (secret !== process.env.REGISTER_SECRET) throw Errors.Unauthorized()
    if (!email || !password) throw Errors.BadRequest("email and password required")

    const { accessToken, refreshToken } = await registerUser(email, password)
    const userId = (await import("../data/users")).getUserByEmail(email.toLowerCase())
      .then(u => u!.id)

    res.cookie(COOKIE_NAME, refreshToken, cookieOpts(THIRTY_DAYS))
    res.cookie(USER_ID_COOKIE, await userId, { ...cookieOpts(THIRTY_DAYS), httpOnly: false })
    res.status(201).json({ accessToken })
  } catch (err) {
    next(err)
  }
})

export default router
