import { Router, Request, Response, NextFunction } from "express"
import { z } from "zod"
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth"
import * as svc from "../service/settings"
import { validateBody } from "../utils/validate"

const router = Router()
router.use(requireAuth)

const settingsUpdateSchema = z.object({
  homeAddress: z.string().min(1).max(255),
})

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.get((req as AuthenticatedRequest).userId))
  } catch (err) { next(err) }
})

router.put("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { homeAddress } = validateBody(settingsUpdateSchema, req.body)
    res.json(await svc.upsert((req as AuthenticatedRequest).userId, { homeAddress }))
  } catch (err) { next(err) }
})

export default router
