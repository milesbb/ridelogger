import { Router, Request, Response, NextFunction } from "express"
import { z } from "zod"
import { loginUser, refreshUserToken, logoutUser, registerUser, changePassword, deleteAccount } from "../service/auth"
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth"
import { Errors } from "../utils/errorTypes"
import { validateBody } from "../utils/validate"

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

function setAuthCookies(res: Response, refreshToken: string, userId: string) {
  res.cookie(COOKIE_NAME, refreshToken, cookieOpts(THIRTY_DAYS))
  res.cookie(USER_ID_COOKIE, userId, { ...cookieOpts(THIRTY_DAYS), httpOnly: false })
}

const loginSchema = z.object({
  emailOrUsername: z.string().min(1).max(254),
  password: z.string().min(1).max(128),
})

const registerSchema = z.object({
  email: z.string().email().max(254),
  username: z.string().min(2).max(50),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128)
    .regex(/[A-Z]/, "New password must contain an uppercase letter")
    .regex(/[0-9]/, "New password must contain a number")
    .regex(/[^A-Za-z0-9]/, "New password must contain a special character"),
})

const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128),
})

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailOrUsername, password } = validateBody(loginSchema, req.body)
    const { accessToken, refreshToken, userId } = await loginUser(emailOrUsername, password)
    setAuthCookies(res, refreshToken, userId)
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

router.post("/change-password", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    const { currentPassword, newPassword } = validateBody(changePasswordSchema, req.body)
    await changePassword(userId, currentPassword, newPassword)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.delete("/account", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    const { password } = validateBody(deleteAccountSchema, req.body)
    await deleteAccount(userId, password)
    res.clearCookie(COOKIE_NAME)
    res.clearCookie(USER_ID_COOKIE)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, username, password } = validateBody(registerSchema, req.body)
    const { accessToken, refreshToken, userId } = await registerUser(email, username, password)
    setAuthCookies(res, refreshToken, userId)
    res.status(201).json({ accessToken })
  } catch (err) {
    next(err)
  }
})

export default router
