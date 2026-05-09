import { Router } from "express"
import authRouter from "./auth"
import passengersRouter from "./passengers"
import locationsRouter from "./locations"
import settingsRouter from "./settings"
import driveRouter from "./drive"
import preferencesRouter from "./preferences"

const router = Router()

router.get("/health", (_, res) => res.json({ ok: true }))
router.use("/auth", authRouter)
router.use("/passengers", passengersRouter)
router.use("/locations", locationsRouter)
router.use("/settings", settingsRouter)
router.use("/drive", driveRouter)
router.use("/preferences", preferencesRouter)

export default router
