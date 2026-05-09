"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AddressFields, assembleAddress, parseAustralianAddress, type AustralianAddress } from "@/components/address-fields"
import { api } from "@/lib/api/client"
import { useHomeState } from "@/lib/useHomeState"
import type { Location } from "@/lib/api/types"

interface Props {
  existing?: Location
  onDone: (location?: Location) => void
  prefillAddress?: string
}

export function LocationForm({ existing, onDone, prefillAddress }: Props) {
  const homeState = useHomeState()
  const [name, setName] = useState(existing?.name ?? "")
  const [address, setAddress] = useState<AustralianAddress>(() =>
    parseAustralianAddress(existing?.address ?? prefillAddress ?? "")
  )

  const isNew = !existing
  useEffect(() => {
    if (isNew && homeState) {
      setAddress(prev => prev.state ? prev : { ...prev, state: homeState })
    }
  }, [homeState, isNew])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const assembled = assembleAddress(address)
      const result = existing
        ? await api.locations.update(existing.id, { name, address: assembled })
        : await api.locations.create({ name, address: assembled })
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
        <p className="text-sm font-medium">Address</p>
        <AddressFields value={address} onChange={setAddress} disabled={loading} idPrefix="loc" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : existing ? "Save changes" : "Add location"}</Button>
        <Button type="button" variant="outline" onClick={() => onDone()}>Cancel</Button>
      </div>
    </form>
  )
}
