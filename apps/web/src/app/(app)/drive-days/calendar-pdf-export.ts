import type { jsPDF as JsPDF } from "jspdf"
import { buildCalendarGrid, formatMonthLabel } from "./calendar-utils"
import type { ExportLeg } from "@/lib/api/types"
import type { ExportColumn, ExportRow } from "@/lib/export-utils"
import { addPdfBrandHeader, pdfSafe } from "@/lib/export-utils"

const PAGE_W = 297
const PAGE_H = 210
const ML = 10
const COL_W = (PAGE_W - ML * 2) / 7

const HEADER_MARGIN = 14
const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const WEEKEND_FILL: [number, number, number] = [249, 250, 251]
const BORDER_COLOUR: [number, number, number] = [229, 231, 235]

function formatPassengers(names: string[] | undefined): string {
  if (!names || names.length === 0) return "No passengers"
  const MAX_CHARS = 26
  let result = names[0]
  let shown = 1
  for (let i = 1; i < names.length; i++) {
    const candidate = `${result}, ${names[i]}`
    if (candidate.length > MAX_CHARS) break
    result = candidate
    shown = i + 1
  }
  const remaining = names.length - shown
  if (remaining > 0) return `${result} and ${remaining} more passengers...`
  return result
}

interface DayEntry {
  drive_day_id: string
  passenger_names: string[]
}

export function getMonthsInRange(from: string, to: string): Array<{ year: number; month: number }> {
  const [fy, fm] = from.split("-").map(Number)
  const [ty, tm] = to.split("-").map(Number)
  const result: Array<{ year: number; month: number }> = []
  let y = fy
  let m = fm
  while (y < ty || (y === ty && m <= tm)) {
    result.push({ year: y, month: m - 1 })
    m++
    if (m > 12) { m = 1; y++ }
  }
  return result
}

function groupDaysByDate(legs: ExportLeg[]): Map<string, DayEntry[]> {
  const map = new Map<string, DayEntry[]>()
  const seen = new Map<string, DayEntry>()
  for (const leg of legs) {
    if (!seen.has(leg.drive_day_id)) {
      const entry: DayEntry = { drive_day_id: leg.drive_day_id, passenger_names: leg.passenger_names ?? [] }
      seen.set(leg.drive_day_id, entry)
      const existing = map.get(leg.drive_date)
      if (existing) { existing.push(entry) } else { map.set(leg.drive_date, [entry]) }
    }
  }
  return map
}

async function drawCalendarPage(
  doc: JsPDF,
  year: number,
  month: number,
  from: string,
  to: string,
  daysByDate: Map<string, DayEntry[]>,
): Promise<void> {
  const headerEndY = await addPdfBrandHeader(doc, undefined, from, to, HEADER_MARGIN)

  const monthLabelY = headerEndY + 5
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text(formatMonthLabel(year, month), PAGE_W / 2, monthLabelY, { align: "center" })

  const dowY = monthLabelY + 6
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  for (let col = 0; col < 7; col++) {
    const x = ML + col * COL_W + COL_W / 2
    doc.text(DOW_LABELS[col], x, dowY, { align: "center" })
  }
  doc.setTextColor(0, 0, 0)

  const gridTop = dowY + 5
  const rowH = (PAGE_H - gridTop - 5) / 6
  const grid = buildCalendarGrid(year, month)

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const cell = grid[row][col]
      const x = ML + col * COL_W
      const y = gridTop + row * rowH

      if (cell.isWeekend) {
        doc.setFillColor(...WEEKEND_FILL)
        doc.rect(x, y, COL_W, rowH, "F")
      }

      doc.setDrawColor(...BORDER_COLOUR)
      doc.rect(x, y, COL_W, rowH, "S")

      if (!cell.isCurrentMonth) continue

      doc.setFontSize(7)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(80, 80, 80)
      doc.text(String(cell.dayOfMonth), x + 1.5, y + 4)

      if (!cell.isoDate) continue

      const days = daysByDate.get(cell.isoDate) ?? []
      const shown = days.slice(0, 2)
      const extra = days.length - 2
      const BOX_H = 4.5
      const BOX_GAP = 1.2

      for (let di = 0; di < shown.length; di++) {
        const bx = x + 1.5
        const by = y + 6 + di * (BOX_H + BOX_GAP)
        const bw = COL_W - 3

        doc.setFillColor(219, 234, 254)
        doc.setDrawColor(147, 197, 253)
        doc.setLineWidth(0.2)
        doc.rect(bx, by, bw, BOX_H, "FD")

        doc.setFont("helvetica", "normal")
        doc.setFontSize(5)
        doc.setTextColor(30, 64, 175)
        doc.text(formatPassengers(shown[di].passenger_names), bx + 1, by + BOX_H / 2 + 0.8)
      }

      if (extra > 0) {
        doc.setFontSize(4.5)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        doc.text(`+${extra} more days`, x + 1.5, y + 6 + shown.length * (BOX_H + BOX_GAP) + 2)
      }

      doc.setTextColor(0, 0, 0)
    }
  }
}

export async function exportToCalendarPdf(
  filename: string,
  from: string,
  to: string,
  legs: ExportLeg[],
): Promise<void> {
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const months = getMonthsInRange(from, to)
  const daysByDate = groupDaysByDate(legs)

  for (let pageIdx = 0; pageIdx < months.length; pageIdx++) {
    if (pageIdx > 0) doc.addPage()
    const { year, month } = months[pageIdx]
    await drawCalendarPage(doc, year, month, from, to, daysByDate)
  }

  doc.save(`${filename}.pdf`)
}

export async function exportToListAndCalendarPdf(
  filename: string,
  from: string,
  to: string,
  legs: ExportLeg[],
  columns: ExportColumn[],
  rows: ExportRow[],
): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

  const startY = await addPdfBrandHeader(doc, "Drive Log", from, to, HEADER_MARGIN)

  const columnStyles: Record<number, { halign: "left" | "right" }> = {}
  columns.forEach((c, i) => {
    if (c.align === "right") columnStyles[i] = { halign: "right" }
  })

  autoTable(doc, {
    head: [columns.map((c) => pdfSafe(c.header))],
    body: rows.map((row) => columns.map((c) => pdfSafe(String(row[c.accessor] ?? "")))),
    startY,
    columnStyles,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  const months = getMonthsInRange(from, to)
  const daysByDate = groupDaysByDate(legs)

  for (const { year, month } of months) {
    doc.addPage()
    await drawCalendarPage(doc, year, month, from, to, daysByDate)
  }

  doc.save(`${filename}.pdf`)
}

