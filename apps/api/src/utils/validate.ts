import { z } from 'zod'
import { Errors } from './errorTypes'

export function validateBody<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) throw Errors.BadRequest(result.error.issues[0].message)
  return result.data
}
