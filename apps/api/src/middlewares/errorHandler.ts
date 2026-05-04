import { Request, Response, NextFunction } from "express"
import { AppError } from "../utils/errorTypes"

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const appErr = err as AppError
  const status = appErr.httpStatus ?? 500
  const message = appErr.message ?? "Internal server error"
  const errorKey = appErr.errorKey ?? "Internal"

  if (status >= 500) console.error(err)

  res.status(status).json({ message, errorKey })
}
