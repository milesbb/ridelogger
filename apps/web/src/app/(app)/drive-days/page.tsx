"use client"

import { useEffect, useState } from "react"
import { DriveDaysList } from "./drive-days-list"
import { api } from "@/lib/api/client"
import type { DriveDaySummary, UserPreferences } from "@/lib/api/types"

export default function DriveDaysPage() {
  const [days, setDays] = useState<DriveDaySummary[]>([])
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([api.drive.listDays(), api.preferences.get()])
      .then(([d, p]) => { setDays(d); setPrefs(p) })
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
      defaultCalendar={prefs?.drive_log_calendar_default ?? false}
      onDayDeleted={(id) => setDays((prev) => prev.filter((d) => d.id !== id))}
    />
  )
}
