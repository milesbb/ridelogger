"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api/client"
import type { AppSettings } from "@/lib/api/types"

interface Props {
  existing: AppSettings | null
}

export function SettingsForm({ existing }: Props) {
  const router = useRouter()
  const [address, setAddress] = useState(existing?.home_address ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await api.settings.save(address)
      router.push("/drive")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <label htmlFor="home-address" className="text-sm font-medium">Your home address</label>
        <Input
          id="home-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Example St, Suburb VIC 3000"
          required
        />
        <p className="text-xs text-muted-foreground">Enter a full street address including suburb and state.</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
    </form>
  )
}
