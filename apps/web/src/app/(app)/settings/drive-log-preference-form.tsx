"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"

export function DriveLogPreferenceForm() {
  const [calendarDefault, setCalendarDefault] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    api.preferences.get()
      .then((p) => setCalendarDefault(p.drive_log_calendar_default))
      .catch(() => setError("Failed to load preferences"))
      .finally(() => setLoading(false))
  }, [])

  async function handleChange(value: boolean) {
    setCalendarDefault(value)
    setError("")
    try {
      await api.preferences.save(value)
    } catch {
      setError("Failed to save preference")
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-2 max-w-md">
      <p className="text-sm font-medium">Default drive log view</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={calendarDefault ? "outline" : "default"}
          size="sm"
          onClick={() => handleChange(false)}
        >
          List
        </Button>
        <Button
          type="button"
          variant={calendarDefault ? "default" : "outline"}
          size="sm"
          onClick={() => handleChange(true)}
        >
          Calendar
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
