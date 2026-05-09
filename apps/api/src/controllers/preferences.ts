import { Router, Request, Response, NextFunction } from "express"
import { z } from "zod"
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth"
import * as svc from "../service/preferences"
import { validateBody } from "../utils/validate"

const router = Router()
router.use(requireAuth)

const preferencesUpdateSchema = z.object({
  driveLogCalendarDefault: z.boolean(),
})

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.get((req as AuthenticatedRequest).userId))
  } catch (err) { next(err) }
})

router.patch("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { driveLogCalendarDefault } = validateBody(preferencesUpdateSchema, req.body)
    res.json(await svc.update((req as AuthenticatedRequest).userId, {
      drive_log_calendar_default: driveLogCalendarDefault,
    }))
  } catch (err) { next(err) }
})

export default router
