import { Router, Request, Response, NextFunction } from "express"
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth"
import { calculateDriveDay, saveDriveDay, listDriveDays, getDriveDay, deleteDriveDay } from "../service/drive"
import { Errors } from "../utils/errorTypes"

const router = Router()
router.use(requireAuth)

router.post("/calculate", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { legs } = req.body
    if (!Array.isArray(legs)) throw Errors.BadRequest("legs must be an array")
    const userId = (req as AuthenticatedRequest).userId
    res.json(await calculateDriveDay(userId, legs))
  } catch (err) { next(err) }
})

router.post("/save", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, startTime, legs } = req.body
    if (typeof date !== "string" || !date) throw Errors.BadRequest("date is required")
    if (!Array.isArray(legs)) throw Errors.BadRequest("legs must be an array")
    const userId = (req as AuthenticatedRequest).userId
    const result = await saveDriveDay(userId, { date, startTime: startTime ?? null, legs })
    res.status(201).json(result)
  } catch (err) { next(err) }
})

router.get("/days", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    res.json(await listDriveDays(userId))
  } catch (err) { next(err) }
})

router.get("/days/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    res.json(await getDriveDay(req.params.id, userId))
  } catch (err) { next(err) }
})

router.delete("/days/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    await deleteDriveDay(req.params.id, userId)
    res.status(204).send()
  } catch (err) { next(err) }
})

export default router
