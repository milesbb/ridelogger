"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PassengerForm } from "./passenger-form"
import { api } from "@/lib/api/client"
import { PrivacyLink } from "@/components/privacy-link"
import type { Passenger } from "@/lib/api/types"

interface Props {
  passengers: Passenger[]
  onRefresh: () => void
}

export function PassengersList({ passengers, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const filtered = passengers.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm("Remove this passenger?")) return
    const deleteHomeLocation = confirm("Also delete their saved home location?")
    setDeletingId(id)
    try {
      await api.passengers.delete(id, deleteHomeLocation)
      onRefresh()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Passengers</h1>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add passenger</DialogTitle>
                <p className="text-xs text-muted-foreground">Passenger data is protected — <PrivacyLink /></p>
              </DialogHeader>
              <PassengerForm onDone={() => { setAddOpen(false); onRefresh() }} />
            </DialogContent>
          </Dialog>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Passenger data is stored securely — <PrivacyLink /></p>
      </div>

      {passengers.length > 0 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search passengers…"
          className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}

      {passengers.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No passengers yet. Add one to get started.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No passengers match &ldquo;{search}&rdquo;.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => (
            <li key={p.id} className="border rounded-lg px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground truncate">{p.home_address}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Dialog open={editingId === p.id} onOpenChange={(open) => setEditingId(open ? p.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit passenger</DialogTitle>
                      <p className="text-xs text-muted-foreground">Passenger data is protected — <PrivacyLink /></p>
                    </DialogHeader>
                    <PassengerForm existing={p} onDone={() => { setEditingId(null); onRefresh() }} />
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" aria-label="Delete" disabled={deletingId === p.id} onClick={() => handleDelete(p.id)}>
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
