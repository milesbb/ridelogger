"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import type { ExportLeg } from "@/lib/api/types"
import type { ExportColumn, ExportRow } from "@/lib/export-utils"
import { exportToCsv, exportToExcel, exportToPdf } from "@/lib/export-utils"
import { exportToCalendarPdf, exportToListAndCalendarPdf } from "./calendar-pdf-export"

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

type Format = "pdf" | "csv" | "excel"
type PdfLayout = "list" | "calendar" | "both"

const FORMAT_LABELS: Record<Format, string> = { pdf: "PDF", csv: "CSV", excel: "Excel" }
const PDF_LAYOUT_OPTIONS: { value: PdfLayout; label: string }[] = [
  { value: "list", label: "List" },
  { value: "calendar", label: "Calendar" },
  { value: "both", label: "List and calendar" },
]

export function DriveLogExport({ defaultFrom, defaultTo }: Props) {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [includePersonal, setIncludePersonal] = useState(false)
  const [showLocationNames, setShowLocationNames] = useState(true)
  const [format, setFormat] = useState<Format>("pdf")
  const [pdfLayout, setPdfLayout] = useState<PdfLayout>("list")
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

  async function handleExport() {
    const legs = await fetchLegs()
    if (!legs) return

    if (format === "csv") {
      exportToCsv(filename, COLUMNS, buildRows(legs, showLocationNames))
      return
    }
    if (format === "excel") {
      await exportToExcel(filename, COLUMNS, buildRows(legs, showLocationNames))
      return
    }

    const rows = buildRows(legs, showLocationNames)
    if (pdfLayout === "calendar") {
      await exportToCalendarPdf(filename, from, to, legs)
    } else if (pdfLayout === "both") {
      await exportToListAndCalendarPdf(filename, from, to, legs, COLUMNS, rows)
    } else {
      await exportToPdf(filename, COLUMNS, rows, "Drive Log", {
        dateRange: { from, to },
        landscape: true,
      })
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium">Export drive log</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-1">
          <label htmlFor="drive-log-from" className="text-xs text-muted-foreground">From</label>
          <input
            id="drive-log-from"
            type="date"
            value={from}
            onChange={(e) => { if (e.target.value) setFrom(e.target.value) }}
            className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label htmlFor="drive-log-to" className="text-xs text-muted-foreground">To</label>
          <input
            id="drive-log-to"
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
      <fieldset className="space-y-1.5 border-0 p-0 m-0">
        <legend className="text-xs text-muted-foreground pb-1">Format</legend>
        <div className="flex flex-wrap gap-4">
          {(Object.keys(FORMAT_LABELS) as Format[]).map((f) => (
            <label key={f} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
              <input
                type="radio"
                name="drive-log-format"
                value={f}
                checked={format === f}
                onChange={() => setFormat(f)}
                className="accent-primary cursor-pointer"
              />
              {FORMAT_LABELS[f]}
            </label>
          ))}
        </div>
      </fieldset>
      {format === "pdf" && (
        <fieldset className="space-y-1.5 border-0 p-0 m-0">
          <legend className="text-xs text-muted-foreground pb-1">PDF layout</legend>
          <div className="flex flex-wrap gap-4">
            {PDF_LAYOUT_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  name="drive-log-pdf-layout"
                  value={value}
                  checked={pdfLayout === value}
                  onChange={() => setPdfLayout(value)}
                  className="accent-primary cursor-pointer"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button size="sm" onClick={handleExport} disabled={loading || !from || !to}>
        {loading ? "Exporting…" : "Export"}
      </Button>
    </div>
  )
}
