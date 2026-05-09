import { Router, Request, Response, NextFunction } from "express"
import { z } from "zod"
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth"
import { calculateDriveDay, saveDriveDay, listDriveDays, getSimilarDays, getDriveDay, deleteDriveDay, exportDriveDays, getPassengerDropoffs } from "../service/drive"
import { Errors } from "../utils/errorTypes"
import { validateBody } from "../utils/validate"

const router = Router()
router.use(requireAuth)

const driveLegInputSchema = z.object({
  fromLocationId: z.string().uuid(),
  toLocationId: z.string().uuid(),
  label: z.string().min(1).max(200),
  passengerLeg: z.boolean().optional(),
})

const saveLegInputSchema = z.object({
  fromLocationId: z.string().uuid(),
  toLocationId: z.string().uuid(),
  passengerId: z.string().uuid().nullable(),
  label: z.string().min(1).max(200),
  distanceKm: z.number().nonnegative(),
  durationMin: z.number().nonnegative(),
  isPassengerLeg: z.boolean(),
})

const calculateSchema = z.object({
  legs: z.array(driveLegInputSchema).min(1).max(50),
})

const saveSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
  legs: z.array(saveLegInputSchema).min(1).max(50),
})

router.post("/calculate", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { legs } = validateBody(calculateSchema, req.body)
    const userId = (req as AuthenticatedRequest).userId
    res.json(await calculateDriveDay(userId, legs))
  } catch (err) { next(err) }
})

router.post("/save", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, startTime, legs } = validateBody(saveSchema, req.body)
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
