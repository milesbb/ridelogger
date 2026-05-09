"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AddressFields, assembleAddress, parseAustralianAddress, type AustralianAddress } from "@/components/address-fields"
import { api } from "@/lib/api/client"
import type { AppSettings } from "@/lib/api/types"

interface Props {
  existing: AppSettings | null
}

export function SettingsForm({ existing }: Props) {
  const router = useRouter()
  const [address, setAddress] = useState<AustralianAddress>(() =>
    parseAustralianAddress(existing?.home_address ?? "")
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await api.settings.save(assembleAddress(address))
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
        <p className="text-sm font-medium">Your home address</p>
        <AddressFields value={address} onChange={setAddress} disabled={loading} idPrefix="home" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
    </form>
  )
}
