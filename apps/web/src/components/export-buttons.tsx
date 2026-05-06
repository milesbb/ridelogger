"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportToCsv, exportToExcel, exportToPdf } from "@/lib/export-utils"
import type { ExportColumn, ExportRow } from "@/lib/export-utils"

interface Props {
  filename: string
  columns: ExportColumn[]
  rows: ExportRow[]
  title?: string
}

type Format = "csv" | "excel" | "pdf"

export function ExportButtons({ filename, columns, rows, title }: Props) {
  const [loading, setLoading] = useState<Format | null>(null)

  async function handleExport(format: Format) {
    setLoading(format)
    try {
      if (format === "csv") exportToCsv(filename, columns, rows)
      else if (format === "excel") await exportToExcel(filename, columns, rows)
      else await exportToPdf(filename, columns, rows, title)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(["csv", "excel", "pdf"] as const).map((format) => (
        <Button
          key={format}
          variant="outline"
          size="sm"
          onClick={() => handleExport(format)}
          disabled={loading !== null}
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          {loading === format ? "Exporting…" : format.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}
