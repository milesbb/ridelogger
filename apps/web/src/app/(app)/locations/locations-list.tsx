"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LocationForm } from "./location-form"
import { api } from "@/lib/api/client"
import { PrivacyLink } from "@/components/privacy-link"
import type { Location } from "@/lib/api/types"

interface Props {
  locations: Location[]
  onRefresh: () => void
}

export function LocationsList({ locations, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("Remove this location?")) return
    setDeletingId(id)
    setDeleteError(null)
    try {
      await api.locations.delete(id)
      onRefresh()
    } catch (err) {
      setDeleteError({ id, message: err instanceof Error ? err.message : "Delete failed" })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Locations</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add location</DialogTitle>
              <p className="text-xs text-muted-foreground">Address data is protected — <PrivacyLink /></p>
            </DialogHeader>
            <LocationForm onDone={() => { setAddOpen(false); onRefresh() }} />
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground">
        Saved destinations for drive planning — <PrivacyLink />
      </p>

      {locations.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No locations yet. Add one to get started.</p>
      ) : (
        <ul className="space-y-2">
          {locations.map((loc) => (
            <li key={loc.id} className="border rounded-lg px-4 py-3 space-y-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{loc.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{loc.address}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Dialog open={editingId === loc.id} onOpenChange={(open) => setEditingId(open ? loc.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit location</DialogTitle>
                        <p className="text-xs text-muted-foreground">Address data is protected — <PrivacyLink /></p>
                      </DialogHeader>
                      <LocationForm existing={loc} onDone={() => { setEditingId(null); onRefresh() }} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" aria-label="Delete" disabled={deletingId === loc.id} onClick={() => handleDelete(loc.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {deleteError?.id === loc.id && (
                <p className="text-xs text-destructive">{deleteError.message}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
