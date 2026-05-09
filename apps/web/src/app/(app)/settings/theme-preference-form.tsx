"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api/client"
import { useTheme } from "@/context/ThemeContext"

export function ThemePreferenceForm() {
  const { theme, setTheme } = useTheme()
  const [error, setError] = useState("")

  useEffect(() => {
    api.preferences.get()
      .then((p) => {
        if (p.theme !== theme) setTheme(p.theme)
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelect(next: 'light' | 'dark'): Promise<void> {
    setTheme(next)
    setError("")
    try {
      await api.preferences.saveTheme(next)
    } catch {
      setError("Failed to save theme preference")
    }
  }

  return (
    <div className="space-y-2 max-w-md">
      <p className="text-sm font-medium">Theme</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleSelect('light')}
          aria-pressed={theme === 'light'}
          className={[
            "flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors min-w-[80px]",
            theme === 'light' ? "border-primary" : "border-border hover:border-muted-foreground",
          ].join(" ")}
        >
          <div
            className="rounded w-12 h-8 border overflow-hidden"
            style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
          >
            <div className="mt-1.5 mx-1.5 h-1.5 rounded-sm" style={{ backgroundColor: "#1e293b" }} />
            <div className="mt-1 mx-1.5 h-1.5 rounded-sm w-2/3" style={{ backgroundColor: "#94a3b8" }} />
          </div>
          <span className="text-xs font-medium">Light</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect('dark')}
          aria-pressed={theme === 'dark'}
          className={[
            "flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors min-w-[80px]",
            theme === 'dark' ? "border-primary" : "border-border hover:border-muted-foreground",
          ].join(" ")}
        >
          <div
            className="rounded w-12 h-8 border overflow-hidden"
            style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
          >
            <div className="mt-1.5 mx-1.5 h-1.5 rounded-sm" style={{ backgroundColor: "#f1f5f9" }} />
            <div className="mt-1 mx-1.5 h-1.5 rounded-sm w-2/3" style={{ backgroundColor: "#64748b" }} />
          </div>
          <span className="text-xs font-medium">Dark</span>
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
