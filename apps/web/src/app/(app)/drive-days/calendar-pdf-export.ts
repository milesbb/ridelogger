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

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}...` : s
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

function groupLegsByDate(legs: ExportLeg[]): Map<string, ExportLeg[]> {
  const map = new Map<string, ExportLeg[]>()
  for (const leg of legs) {
    const existing = map.get(leg.drive_date)
    if (existing) { existing.push(leg) } else { map.set(leg.drive_date, [leg]) }
  }
  return map
}

async function drawCalendarPage(
  doc: JsPDF,
  year: number,
  month: number,
  from: string,
  to: string,
  legsByDate: Map<string, ExportLeg[]>,
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

      const dayLegs = legsByDate.get(cell.isoDate) ?? []
      const uniqueLegs = dedupLegs(dayLegs)
      const shown = uniqueLegs.slice(0, 2)
      const extra = uniqueLegs.length - 2

      doc.setFont("helvetica", "normal")
      doc.setFontSize(5.5)
      doc.setTextColor(30, 64, 175)

      for (let li = 0; li < shown.length; li++) {
        const label = truncate(pdfSafe(shown[li].label), 32)
        doc.text(label, x + 1.5, y + 8 + li * 4.5)
      }

      if (extra > 0) {
        doc.setFontSize(5)
        doc.setTextColor(100, 100, 100)
        doc.text(`+${extra} more`, x + 1.5, y + 8 + shown.length * 4.5)
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
  const legsByDate = groupLegsByDate(legs)

  for (let pageIdx = 0; pageIdx < months.length; pageIdx++) {
    if (pageIdx > 0) doc.addPage()
    const { year, month } = months[pageIdx]
    await drawCalendarPage(doc, year, month, from, to, legsByDate)
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
  const legsByDate = groupLegsByDate(legs)

  for (const { year, month } of months) {
    doc.addPage()
    await drawCalendarPage(doc, year, month, from, to, legsByDate)
  }

  doc.save(`${filename}.pdf`)
}

function dedupLegs(legs: ExportLeg[]): ExportLeg[] {
  const seen = new Set<string>()
  return legs.filter((leg) => {
    if (seen.has(leg.drive_day_id)) return false
    seen.add(leg.drive_day_id)
    return true
  })
}
