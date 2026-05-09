import { Router, Request, Response, NextFunction } from "express"
import { z } from "zod"
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth"
import * as svc from "../service/passengers"
import { validateBody } from "../utils/validate"

const router = Router()
router.use(requireAuth)

const createPassengerSchema = z.object({
  name: z.string().min(1).max(100),
  homeAddress: z.string().min(1).max(255),
  notes: z.string().max(1000).optional().default(""),
})

const homeUpdateSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("edit"), address: z.string().min(1).max(255) }),
  z.object({ type: z.literal("switch"), locationId: z.string().uuid() }),
])

const updatePassengerSchema = z.object({
  name: z.string().min(1).max(100),
  notes: z.string().max(1000).optional().default(""),
  homeUpdate: homeUpdateSchema,
})

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    res.json(await svc.list(userId))
  } catch (err) { next(err) }
})

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    const { name, homeAddress, notes } = validateBody(createPassengerSchema, req.body)
    res.status(201).json(await svc.create(userId, { name, homeAddress, notes }))
  } catch (err) { next(err) }
})

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    const { name, notes, homeUpdate } = validateBody(updatePassengerSchema, req.body)
    res.json(await svc.update(req.params.id, userId, { name, notes, homeUpdate }))
  } catch (err) { next(err) }
})

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    const deleteHomeLocation = req.query.deleteHomeLocation === "true"
    await svc.remove(req.params.id, userId, deleteHomeLocation)
    res.status(204).send()
  } catch (err) { next(err) }
})

export default router
