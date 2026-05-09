"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api/client"
import type { Location } from "@/lib/api/types"

interface Props {
  existing?: Location
  onDone: (location?: Location) => void
  prefillAddress?: string
}

export function LocationForm({ existing, onDone, prefillAddress }: Props) {
  const [name, setName] = useState(existing?.name ?? "")
  const [address, setAddress] = useState(existing?.address ?? prefillAddress ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = existing
        ? await api.locations.update(existing.id, { name, address })
        : await api.locations.create({ name, address })
      onDone(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="loc-name" className="text-sm font-medium">Name</label>
        <Input id="loc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="St Vincent's Hospital" required maxLength={100} />
      </div>
      <div className="space-y-2">
        <label htmlFor="loc-address" className="text-sm font-medium">Address</label>
        <Input id="loc-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="41 Victoria Parade, Fitzroy VIC 3065" required maxLength={255} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : existing ? "Save changes" : "Add location"}</Button>
        <Button type="button" variant="outline" onClick={() => onDone()}>Cancel</Button>
      </div>
    </form>
  )
}
