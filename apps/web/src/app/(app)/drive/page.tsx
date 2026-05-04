"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api/client"
import type { Passenger, Location } from "@/lib/api/types"
import { DrivePlanner } from "./drive-planner"

export default function DrivePage() {
  const router = useRouter()
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.settings.get(),
      api.passengers.list(),
      api.locations.list(),
    ]).then(([settings, p, l]) => {
      if (!settings) { router.replace("/settings"); return }
      setPassengers(p)
      setLocations(l)
      setLoading(false)
    })
  }, [router])

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
  return <DrivePlanner passengers={passengers} locations={locations} onLocationsChange={setLocations} />
}
