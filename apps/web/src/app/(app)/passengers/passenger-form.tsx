"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createPassenger, updatePassenger } from "./actions"
import type { Passenger } from "@/lib/supabase/types"

interface Props {
  existing?: Passenger
  onDone: () => void
}

export function PassengerForm({ existing, onDone }: Props) {
  const [name, setName] = useState(existing?.name ?? "")
  const [homeAddress, setHomeAddress] = useState(existing?.home_address ?? "")
  const [notes, setNotes] = useState(existing?.notes ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const result = existing
      ? await updatePassenger(existing.id, { name, homeAddress, notes })
      : await createPassenger({ name, homeAddress, notes })
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      onDone()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mary Smith"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="home-address" className="text-sm font-medium">
          Home address
        </label>
        <Input
          id="home-address"
          value={homeAddress}
          onChange={(e) => setHomeAddress(e.target.value)}
          placeholder="123 Main St, Suburb VIC 3000"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any relevant notes"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : existing ? "Save changes" : "Add passenger"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
