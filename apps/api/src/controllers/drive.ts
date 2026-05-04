import { Router, Request, Response, NextFunction } from "express"
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth"
import { calculateDriveDay } from "../service/drive"
import { Errors } from "../utils/errorTypes"

const router = Router()
router.use(requireAuth)

router.post("/calculate", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { segments } = req.body
    if (!Array.isArray(segments)) throw Errors.BadRequest("segments must be an array")
    const userId = (req as AuthenticatedRequest).userId
    res.json(await calculateDriveDay(userId, segments))
  } catch (err) { next(err) }
})

export default router
