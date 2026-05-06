"use client"

import { useEffect, useState } from "react"
import { DriveDaysList } from "./drive-days-list"
import { api } from "@/lib/api/client"
import type { DriveDaySummary } from "@/lib/api/types"

export default function DriveDaysPage() {
  const [days, setDays] = useState<DriveDaySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    api.drive.listDays()
      .then(setDays)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  return (
    <DriveDaysList
      days={days}
      onDayDeleted={(id) => setDays((prev) => prev.filter((d) => d.id !== id))}
    />
  )
}
