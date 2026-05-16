import type { jsPDF as JsPDF } from "jspdf"

export type ExportCellValue = string | number | null | undefined

export interface ExportColumn {
  header: string
  accessor: string
  align?: "left" | "right"
}

export type ExportRow = Record<string, ExportCellValue>

interface PdfOptions {
  dateRange?: { from: string; to: string }
  landscape?: boolean
}

export function exportToCsv(filename: string, columns: ExportColumn[], rows: ExportRow[]): void {
  const headers = columns.map((c) => csvEscape(c.header)).join(",")
  const body = rows
    .map((row) => columns.map((c) => csvEscape(String(row[c.accessor] ?? ""))).join(","))
    .join("\n")
  downloadBlob(new Blob([`${headers}\n${body}`], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`)
}

export async function exportToExcel(filename: string, columns: ExportColumn[], rows: ExportRow[]): Promise<void> {
  const XLSX = await import("xlsx")
  const data = [
    columns.map((c) => c.header),
    ...rows.map((row) => columns.map((c) => row[c.accessor] ?? "")),
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export async function exportToPdf(
  filename: string,
  columns: ExportColumn[],
  rows: ExportRow[],
  title?: string,
  options?: PdfOptions,
): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = options?.landscape
    ? new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
    : new jsPDF()

  const startY = await addPdfBrandHeader(doc, title, options?.dateRange?.from, options?.dateRange?.to)

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

  doc.save(`${filename}.pdf`)
}

let _logoCache: string | null | undefined = undefined

export async function loadLogoDataUrl(): Promise<string | null> {
  if (_logoCache !== undefined) return _logoCache
  try {
    const res = await fetch("/favicon-96x96.png")
    const blob = await res.blob()
    _logoCache = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    _logoCache = null
  }
  return _logoCache
}

export function formatLocaleDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function pdfSafe(value: string): string {
  return value.replace(/→/g, "->").replace(/←/g, "<-").replace(/…/g, "...")
}

export async function addPdfBrandHeader(
  doc: JsPDF,
  title: string | undefined,
  from: string | undefined,
  to: string | undefined,
  margin = 14,
): Promise<number> {
  const pageW = doc.internal.pageSize.getWidth()
  const logoSize = 9
  const logoY = 9

  const logo = await loadLogoDataUrl()
  if (logo) {
    doc.addImage(logo, "PNG", margin, logoY, logoSize, logoSize)
  }

  const textX = logo ? margin + logoSize + 2.5 : margin
  const textMidY = logoY + logoSize / 2 + 1.5

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("RideLogger", textX, textMidY)

  const exportedOn = new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(130, 130, 130)
  doc.text(`Exported: ${exportedOn}`, pageW - margin, textMidY - 1.5, { align: "right" })
  doc.text("https://ridelogger.au", pageW - margin, textMidY + 2.5, { align: "right" })
  doc.setTextColor(0, 0, 0)

  let y = logoY + logoSize + 4

  if (title) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(title, margin, y)
    y += 5.5
  }

  if (from && to) {
    doc.setFontSize(8.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(80, 80, 80)
    doc.text(`${formatLocaleDate(from)} — ${formatLocaleDate(to)}`, margin, y)
    doc.setTextColor(0, 0, 0)
    y += 5
  }

  doc.setDrawColor(210, 210, 210)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)

  return y + 5
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
