"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api/client"
import type { Passenger, Location, AppSettings, DriveDayDetail } from "@/lib/api/types"
import { DrivePlanner } from "./drive-planner"

export default function DrivePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromDayId = searchParams.get("from")

  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [initialDayDetail, setInitialDayDetail] = useState<DriveDayDetail | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const baseData = Promise.all([
      api.settings.get(),
      api.passengers.list(),
      api.locations.list(),
    ])

    const allData = fromDayId
      ? Promise.all([baseData, api.drive.getDay(fromDayId)])
      : Promise.all([baseData, Promise.resolve(undefined)])

    allData.then(([[s, p, l], detail]) => {
      if (!s) { router.replace("/settings"); return }
      setSettings(s)
      setPassengers(p)
      setLocations(l)
      if (detail) setInitialDayDetail(detail)
      setLoading(false)
    })
  }, [router, fromDayId])

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
  if (!settings) return null
  return (
    <DrivePlanner
      passengers={passengers}
      locations={locations}
      settings={settings}
      onLocationsChange={setLocations}
      onPassengersChange={setPassengers}
      initialDayDetail={initialDayDetail}
    />
  )
}
