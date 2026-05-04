import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errorTypes'
import logger from '../utils/logging'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const appErr = err as AppError
  const status = appErr.httpStatus ?? 500
  const message = appErr.message ?? 'Internal server error'
  const errorKey = appErr.errorKey ?? 'Internal'

  if (status >= 500) {
    logger.error('unhandled error', { err, method: req.method, path: req.path })
  }

  res.status(status).json({ message, errorKey })
}
