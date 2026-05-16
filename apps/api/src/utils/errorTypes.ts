export interface AppError extends Error {
  httpStatus: number
  errorKey: string
}

function makeError(message: string, httpStatus: number, errorKey: string): AppError {
  const err = new Error(message) as AppError
  err.httpStatus = httpStatus
  err.errorKey = errorKey
  return err
}

export const Errors = {
  Unauthorized: () => makeError("Unauthorized", 401, "Unauthorized"),
  InvalidCredentials: () => makeError("Invalid email or password", 401, "InvalidCredentials"),
  NotFound: (what: string) => makeError(`${what} not found`, 404, "NotFound"),
  Conflict: (msg: string) => makeError(msg, 409, "Conflict"),
  BadRequest: (msg: string) => makeError(msg, 400, "BadRequest"),
  Internal: (msg = "Internal server error") => makeError(msg, 500, "Internal"),
  ServiceUnavailable: (msg = "Service temporarily unavailable") => makeError(msg, 503, "ServiceUnavailable"),
}
