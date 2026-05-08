"use client"

import { useEffect, useState } from "react"
import { Trash2, CalendarDays } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExportButtons } from "@/components/export-buttons"
import { api } from "@/lib/api/client"
import type { DriveDaySummary, DriveDayDetail, SavedLeg } from "@/lib/api/types"
import type { ExportColumn, ExportRow } from "@/lib/export-utils"

interface Props {
  summary: DriveDaySummary
  onClose: () => void
  onDeleted: (id: string) => void
}

const COLUMNS: ExportColumn[] = [
  { header: "Leg", accessor: "label", align: "left" },
  { header: "km", accessor: "distanceKm", align: "right" },
  { header: "min", accessor: "durationMin", align: "right" },
]

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatTime(t: string | null): string | null {
  if (!t) return null
  const [h, m] = t.split(":")
  const hour = Number(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function buildExportRows(legs: SavedLeg[]): ExportRow[] {
  const rows: ExportRow[] = legs.map((l) => ({
    label: l.label,
    distanceKm: l.distance_km,
    durationMin: l.duration_min,
  }))
  if (legs.length > 1) {
    rows.push({
      label: "Total",
      distanceKm: Math.round(legs.reduce((s, l) => s + l.distance_km, 0) * 10) / 10,
      durationMin: legs.reduce((s, l) => s + l.duration_min, 0),
    })
  }
  return rows
}

function legToResult(leg: SavedLeg) {
  return {
    label: leg.label,
    distanceKm: leg.distance_km,
    durationMin: leg.duration_min,
    passengerLeg: leg.is_passenger_leg,
  }
}

export function DriveDayDetailModal({ summary, onClose, onDeleted }: Props) {
  const router = useRouter()
  const [detail, setDetail] = useState<DriveDayDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [showNonPassenger, setShowNonPassenger] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api.drive.getDay(summary.id)
      .then(setDetail)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [summary.id])

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.drive.deleteDay(summary.id)
      onDeleted(summary.id)
      onClose()
    } catch (err) {
      setConfirmDelete(false)
      setDeleting(false)
      alert(err instanceof Error ? err.message : "Delete failed")
    }
  }

  const visibleLegs = detail
    ? (showNonPassenger ? detail.legs : detail.legs.filter((l) => l.is_passenger_leg))
    : []
  const results = visibleLegs.map(legToResult)
  const successful = visibleLegs.filter((l) => !l.is_passenger_leg || l.distance_km > 0)
  const totalKm = Math.round(visibleLegs.reduce((s, l) => s + l.distance_km, 0) * 10) / 10
  const totalMin = visibleLegs.reduce((s, l) => s + l.duration_min, 0)
  const exportFilename = `drive-day-${summary.date}`
  const exportTitle = `Drive Day — ${formatDate(summary.date)}`

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            {formatDate(summary.date)}
            {summary.start_time && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">{formatTime(summary.start_time)}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>}
        {loadError && <p className="text-sm text-destructive">{loadError}</p>}

        {detail && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showNonPassenger}
                  onChange={(e) => setShowNonPassenger(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                />
                Include non-passenger drives
              </label>
              <ExportButtons
                filename={exportFilename}
                columns={COLUMNS}
                rows={buildExportRows(visibleLegs)}
                title={exportTitle}
              />
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium">Leg</th>
                    <th className="text-right px-4 py-2 font-medium">km</th>
                    <th className="text-right px-4 py-2 font-medium">min</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-2 text-muted-foreground">{r.label}</td>
                      <td className="px-4 py-2 text-right font-mono">{r.distanceKm}</td>
                      <td className="px-4 py-2 text-right font-mono">{r.durationMin}</td>
                    </tr>
                  ))}
                </tbody>
                {successful.length > 1 && (
                  <tfoot>
                    <tr className="bg-muted/50 font-medium">
                      <td className="px-4 py-2">Total</td>
                      <td className="px-4 py-2 text-right font-mono">{totalKm}</td>
                      <td className="px-4 py-2 text-right font-mono">{totalMin}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="pt-2 border-t space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/drive?from=${summary.id}`)}
              >
                <CalendarDays className="h-4 w-4 mr-1.5" />
                Repeat this drive day
              </Button>
              {!confirmDelete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete drive day
                </Button>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm text-destructive">Delete this drive day permanently?</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                      Cancel
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                      {deleting ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
