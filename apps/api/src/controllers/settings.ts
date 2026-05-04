import { Router, Request, Response, NextFunction } from "express"
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth"
import * as svc from "../service/settings"

const router = Router()
router.use(requireAuth)

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.get((req as AuthenticatedRequest).userId))
  } catch (err) { next(err) }
})

router.put("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { homeAddress } = req.body
    res.json(await svc.upsert((req as AuthenticatedRequest).userId, { homeAddress }))
  } catch (err) { next(err) }
})

export default router
