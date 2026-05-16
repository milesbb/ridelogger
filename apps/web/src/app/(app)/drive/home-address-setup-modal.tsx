"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AddressFields, assembleAddress, type AustralianAddress } from "@/components/address-fields"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import type { AppSettings } from "@/lib/api/types"

interface Props {
  onComplete: (settings: AppSettings) => void
}

export function HomeAddressSetupModal({ onComplete }: Props) {
  const [address, setAddress] = useState<AustralianAddress>({ street: "", suburb: "", state: "", postcode: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const settings = await api.settings.save(assembleAddress(address))
      onComplete(settings)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open>
      <DialogContent
        hideCloseButton
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Set your home address</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Your home address is the starting and ending point for your drives. You&apos;ll need it to
          plan a drive day.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AddressFields value={address} onChange={setAddress} disabled={loading} idPrefix="setup-home" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving…" : "Save and start planning"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
