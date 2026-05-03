"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PassengerForm } from "./passenger-form"
import { deletePassenger } from "./actions"
import type { Passenger } from "@/lib/supabase/types"

interface Props {
  passengers: Passenger[]
}

export function PassengersList({ passengers }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("Remove this passenger?")) return
    setDeletingId(id)
    await deletePassenger(id)
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Passengers</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add passenger</DialogTitle>
            </DialogHeader>
            <PassengerForm onDone={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {passengers.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No passengers yet. Add one to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {passengers.map((p) => (
            <li key={p.id} className="border rounded-lg px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground truncate">{p.home_address}</p>
                {p.notes && <p className="text-xs text-muted-foreground mt-0.5">{p.notes}</p>}
              </div>

              <div className="flex gap-1 shrink-0">
                <Dialog
                  open={editingId === p.id}
                  onOpenChange={(open) => setEditingId(open ? p.id : null)}
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit passenger</DialogTitle>
                    </DialogHeader>
                    <PassengerForm existing={p} onDone={() => setEditingId(null)} />
                  </DialogContent>
                </Dialog>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  disabled={deletingId === p.id}
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
