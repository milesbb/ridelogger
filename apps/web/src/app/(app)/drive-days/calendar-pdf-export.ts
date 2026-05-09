import { buildCalendarGrid, formatMonthLabel } from "./calendar-utils"
import type { ExportLeg } from "@/lib/api/types"

const PAGE_W = 297
const PAGE_H = 210
const ML = 10
const MT = 12
const COL_W = (PAGE_W - ML * 2) / 7
const DOW_H = 7
const TITLE_H = 12
const GRID_TOP = MT + TITLE_H + DOW_H
const ROW_H = (PAGE_H - GRID_TOP - 8) / 6

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const WEEKEND_FILL: [number, number, number] = [249, 250, 251]
const BORDER_COLOUR: [number, number, number] = [229, 231, 235]

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s
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

export async function exportToCalendarPdf(
  filename: string,
  from: string,
  to: string,
  legs: ExportLeg[],
): Promise<void> {
  const { jsPDF } = await import("jspdf")
  await import("jspdf-autotable")

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const months = getMonthsInRange(from, to)
  const legsByDate = groupLegsByDate(legs)

  for (let pageIdx = 0; pageIdx < months.length; pageIdx++) {
    if (pageIdx > 0) doc.addPage()

    const { year, month } = months[pageIdx]

    doc.setFontSize(13)
    doc.setFont("helvetica", "bold")
    doc.text(formatMonthLabel(year, month), PAGE_W / 2, MT + 4, { align: "center" })

    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    for (let col = 0; col < 7; col++) {
      const x = ML + col * COL_W + COL_W / 2
      const y = MT + TITLE_H + DOW_H / 2 + 1.5
      doc.text(DOW_LABELS[col], x, y, { align: "center" })
    }
    doc.setTextColor(0, 0, 0)

    const grid = buildCalendarGrid(year, month)

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const cell = grid[row][col]
        const x = ML + col * COL_W
        const y = GRID_TOP + row * ROW_H

        if (cell.isWeekend) {
          doc.setFillColor(...WEEKEND_FILL)
          doc.rect(x, y, COL_W, ROW_H, "F")
        }

        doc.setDrawColor(...BORDER_COLOUR)
        doc.rect(x, y, COL_W, ROW_H, "S")

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
          const label = truncate(shown[li].label, 32)
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
