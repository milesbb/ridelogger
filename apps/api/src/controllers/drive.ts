import { Router, Request, Response, NextFunction } from "express"
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth"
import { calculateDriveDay, saveDriveDay, listDriveDays, getSimilarDays, getDriveDay, deleteDriveDay, exportDriveDays, getPassengerDropoffs } from "../service/drive"
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

router.get("/days/similar", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw Errors.BadRequest("date query param is required (YYYY-MM-DD)")
    }
    const userId = (req as AuthenticatedRequest).userId
    res.json(await getSimilarDays(userId, date))
  } catch (err) { next(err) }
})

router.get("/days/export", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query
    if (typeof from !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      throw Errors.BadRequest("from query param is required (YYYY-MM-DD)")
    }
    if (typeof to !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      throw Errors.BadRequest("to query param is required (YYYY-MM-DD)")
    }
    const userId = (req as AuthenticatedRequest).userId
    res.json(await exportDriveDays(userId, from, to))
  } catch (err) { next(err) }
})

router.get("/passengers/:passengerId/dropoffs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    res.json(await getPassengerDropoffs(userId, req.params.passengerId))
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
