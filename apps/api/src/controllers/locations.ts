import { Router, Request, Response, NextFunction } from "express"
import { z } from "zod"
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth"
import * as svc from "../service/locations"
import { validateBody } from "../utils/validate"

const router = Router()
router.use(requireAuth)

const locationSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1).max(255),
})

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.list((req as AuthenticatedRequest).userId))
  } catch (err) { next(err) }
})

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address } = validateBody(locationSchema, req.body)
    res.status(201).json(await svc.create((req as AuthenticatedRequest).userId, { name, address }))
  } catch (err) { next(err) }
})

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address } = validateBody(locationSchema, req.body)
    res.json(await svc.update(req.params.id, (req as AuthenticatedRequest).userId, { name, address }))
  } catch (err) { next(err) }
})

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.remove(req.params.id, (req as AuthenticatedRequest).userId)
    res.status(204).send()
  } catch (err) { next(err) }
})

export default router
