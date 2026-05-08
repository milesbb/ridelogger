"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import type { ExportLeg } from "@/lib/api/types"
import type { ExportColumn, ExportRow } from "@/lib/export-utils"
import { exportToCsv, exportToExcel, exportToPdf } from "@/lib/export-utils"

interface Props {
  defaultFrom: string
  defaultTo: string
}

const COLUMNS: ExportColumn[] = [
  { header: "Date", accessor: "date", align: "left" },
  { header: "Leg", accessor: "label", align: "left" },
  { header: "km", accessor: "distanceKm", align: "right" },
  { header: "min", accessor: "durationMin", align: "right" },
]

function buildRows(legs: ExportLeg[], showLocationNames: boolean): ExportRow[] {
  return legs.map((leg) => ({
    date: leg.drive_date,
    label:
      showLocationNames && leg.from_location_name && leg.to_location_name
        ? `${leg.label} (${leg.from_location_name} → ${leg.to_location_name})`
        : leg.label,
    distanceKm: leg.distance_km,
    durationMin: leg.duration_min,
  }))
}

export function DriveLogExport({ defaultFrom, defaultTo }: Props) {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [includePersonal, setIncludePersonal] = useState(false)
  const [showLocationNames, setShowLocationNames] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function fetchLegs(): Promise<ExportLeg[] | null> {
    setLoading(true)
    setError("")
    try {
      const legs = await api.drive.exportDays(from, to)
      return includePersonal ? legs : legs.filter((l) => l.is_passenger_leg)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed")
      return null
    } finally {
      setLoading(false)
    }
  }

  const filename = `drive-log-${from}-to-${to}`
  const title = `Drive Log — ${from} to ${to}`

  async function handleCsv() {
    const legs = await fetchLegs()
    if (!legs) return
    exportToCsv(filename, COLUMNS, buildRows(legs, showLocationNames))
  }

  async function handleExcel() {
    const legs = await fetchLegs()
    if (!legs) return
    await exportToExcel(filename, COLUMNS, buildRows(legs, showLocationNames))
  }

  async function handlePdf() {
    const legs = await fetchLegs()
    if (!legs) return
    await exportToPdf(filename, COLUMNS, buildRows(legs, showLocationNames), title)
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium">Export drive log</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => { if (e.target.value) setFrom(e.target.value) }}
            className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => { if (e.target.value) setTo(e.target.value) }}
            className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includePersonal}
            onChange={(e) => setIncludePersonal(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
          />
          Include personal drives
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showLocationNames}
            onChange={(e) => setShowLocationNames(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
          />
          Show location names
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleCsv} disabled={loading || !from || !to}>
          CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleExcel} disabled={loading || !from || !to}>
          Excel
        </Button>
        <Button variant="outline" size="sm" onClick={handlePdf} disabled={loading || !from || !to}>
          PDF
        </Button>
      </div>
    </div>
  )
}
