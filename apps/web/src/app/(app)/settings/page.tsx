"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api/client"
import type { AppSettings } from "@/lib/api/types"
import { SettingsForm } from "./settings-form"
import { ChangePasswordForm } from "./change-password-form"
import { DeleteAccountSection } from "./delete-account-section"
import { DriveLogPreferenceForm } from "./drive-log-preference-form"
import { ThemePreferenceForm } from "./theme-preference-form"
import { PrivacyLink } from "@/components/privacy-link"

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
          Manage your home address, password, and account.
        </p>
      </div>
      <SettingsForm existing={settings} />
      <hr className="border-border" />
      <ThemePreferenceForm />
      <hr className="border-border" />
      <DriveLogPreferenceForm />
      <hr className="border-border" />
      <ChangePasswordForm />
      <hr className="border-border" />
      <DeleteAccountSection />
      <hr className="border-border" />
      <p className="text-sm text-muted-foreground">
        Read our <PrivacyLink /> to learn how your data is stored and protected.
      </p>
      <p className="text-sm text-muted-foreground">
        More from{" "}
        <a
          href="https://github.com/milesbb"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Miles Bailey-Braendgaard
        </a>
      </p>
    </div>
  )
}
