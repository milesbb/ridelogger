"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api/client"
import type { AppSettings } from "@/lib/api/types"
import { SettingsForm } from "./settings-form"

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.settings.get().then((s) => { setSettings(s); setLoading(false) })
  }, [])

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set your home address — used as the starting point for drive calculations.
        </p>
      </div>
      <SettingsForm existing={settings} />
    </div>
  )
}
