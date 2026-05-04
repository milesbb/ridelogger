import { Router, Request, Response, NextFunction } from "express"
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth"
import * as svc from "../service/passengers"

const router = Router()
router.use(requireAuth)

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    res.json(await svc.list(userId))
  } catch (err) { next(err) }
})

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    const { name, homeAddress, notes } = req.body
    res.status(201).json(await svc.create(userId, { name, homeAddress, notes: notes ?? "" }))
  } catch (err) { next(err) }
})

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    const { name, homeAddress, notes } = req.body
    res.json(await svc.update(req.params.id, userId, { name, homeAddress, notes: notes ?? "" }))
  } catch (err) { next(err) }
})

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    await svc.remove(req.params.id, userId)
    res.status(204).send()
  } catch (err) { next(err) }
})

export default router
