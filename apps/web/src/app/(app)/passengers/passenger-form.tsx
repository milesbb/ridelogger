"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AddressFields, assembleAddress, parseAustralianAddress, type AustralianAddress } from "@/components/address-fields"
import { api } from "@/lib/api/client"
import type { Passenger, Location } from "@/lib/api/types"

interface Props {
  existing?: Passenger
  onDone: () => void
}

type HomeEditMode = "none" | "edit" | "switch"

export function PassengerForm({ existing, onDone }: Props) {
  const [name, setName] = useState(existing?.name ?? "")
  const [notes, setNotes] = useState(existing?.notes ?? "")
  const [homeEditMode, setHomeEditMode] = useState<HomeEditMode>("none")
  const [editAddress, setEditAddress] = useState<AustralianAddress>(() =>
    parseAustralianAddress(existing?.home_address ?? "")
  )
  const [switchLocationId, setSwitchLocationId] = useState<string | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSwitchClick() {
    setHomeEditMode("switch")
    if (locations.length === 0) {
      setLoadingLocations(true)
      try {
        const locs = await api.locations.list()
        setLocations(locs)
      } finally {
        setLoadingLocations(false)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      if (existing) {
        const homeUpdate =
          homeEditMode === "edit"
            ? { type: "edit" as const, address: assembleAddress(editAddress) }
            : homeEditMode === "switch" && switchLocationId
              ? { type: "switch" as const, locationId: switchLocationId }
              : { type: "none" as const }
        await api.passengers.update(existing.id, { name, notes, homeUpdate })
      } else {
        await api.passengers.create({ name, homeAddress: assembleAddress(editAddress), notes })
      }
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Name</label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mary Smith" required maxLength={100} />
      </div>

      {existing ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Home address</p>
          {homeEditMode === "none" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">{existing.home_address}</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditAddress(parseAustralianAddress(existing.home_address))
                    setHomeEditMode("edit")
                  }}
                >
                  Edit address
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleSwitchClick}>
                  Use a saved location
                </Button>
              </div>
            </div>
          )}
          {homeEditMode === "edit" && (
            <div className="space-y-2">
              <AddressFields value={editAddress} onChange={setEditAddress} idPrefix="passenger-edit" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditAddress(parseAustralianAddress(existing.home_address))
                  setHomeEditMode("none")
                }}
              >
                Cancel
              </Button>
            </div>
          )}
          {homeEditMode === "switch" && (
            <div className="space-y-1">
              {loadingLocations ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : locations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved locations yet.</p>
              ) : (
                <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setSwitchLocationId(loc.id)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-accent transition-colors ${switchLocationId === loc.id ? "bg-primary/10" : ""}`}
                    >
                      <p className="text-sm font-medium">{loc.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{loc.address}</p>
                    </button>
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setHomeEditMode("none"); setSwitchLocationId(null) }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">Home address</p>
          <AddressFields value={editAddress} onChange={setEditAddress} idPrefix="passenger-new" />
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any relevant notes" maxLength={1000} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading || (homeEditMode === "switch" && !switchLocationId)}>
          {loading ? "Saving…" : existing ? "Save changes" : "Add passenger"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  )
}
