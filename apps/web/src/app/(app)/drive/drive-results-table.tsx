"use client"

import { useState } from "react"
import { ExportButtons } from "@/components/export-buttons"
import type { DriveLegResult } from "@/lib/api/types"
import type { ExportColumn, ExportRow } from "@/lib/export-utils"
import { filterByPassengerLeg } from "@/lib/drive-utils"

interface Props {
  results: DriveLegResult[]
}

const COLUMNS: ExportColumn[] = [
  { header: "Leg", accessor: "label", align: "left" },
  { header: "km", accessor: "distanceKm", align: "right" },
  { header: "min", accessor: "durationMin", align: "right" },
]

function buildExportRows(results: DriveLegResult[]): ExportRow[] {
  const rows: ExportRow[] = results.map((r) =>
    r.error
      ? { label: r.label, distanceKm: "Error", durationMin: r.error }
      : { label: r.label, distanceKm: r.distanceKm, durationMin: r.durationMin },
  )
  const successful = results.filter((r) => !r.error)
  if (successful.length > 1) {
    rows.push({
      label: "Total",
      distanceKm: Math.round(successful.reduce((s, r) => s + r.distanceKm, 0) * 10) / 10,
      durationMin: successful.reduce((s, r) => s + r.durationMin, 0),
    })
  }
  return rows
}

export function DriveResultsTable({ results }: Props) {
  const [showNonPassenger, setShowNonPassenger] = useState(true)

  const visibleResults = filterByPassengerLeg(results, showNonPassenger)
  const successful = visibleResults.filter((r) => !r.error)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-medium">Results</p>
        <ExportButtons
          filename="drive-day-results"
          columns={COLUMNS}
          rows={buildExportRows(visibleResults)}
          title="Drive Day Results"
        />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={showNonPassenger}
          onChange={(e) => setShowNonPassenger(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
        />
        Include non-passenger drives
      </label>
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
            {visibleResults.map((r, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-2 text-muted-foreground">{r.label}</td>
                {r.error ? (
                  <td colSpan={2} className="px-4 py-2 text-destructive text-xs">{r.error}</td>
                ) : (
                  <>
                    <td className="px-4 py-2 text-right font-mono">{r.distanceKm}</td>
                    <td className="px-4 py-2 text-right font-mono">{r.durationMin}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          {successful.length > 1 && (
            <tfoot>
              <tr className="bg-muted/50 font-medium">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right font-mono">
                  {Math.round(successful.reduce((s, r) => s + r.distanceKm, 0) * 10) / 10}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {successful.reduce((s, r) => s + r.durationMin, 0)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
