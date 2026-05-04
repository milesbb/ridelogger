import { Request, Response, NextFunction } from "express"
import { verifyAccessToken } from "../service/auth"
import { Errors } from "../utils/errorTypes"

export interface AuthenticatedRequest extends Request {
  userId: string
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header) return next(Errors.Unauthorized())

  const parts = header.split(" ")
  if (parts.length !== 2 || parts[0] !== "Bearer") return next(Errors.Unauthorized())

  try {
    const payload = verifyAccessToken(parts[1])
    ;(req as AuthenticatedRequest).userId = payload.sub
    next()
  } catch (err) {
    next(err)
  }
}
