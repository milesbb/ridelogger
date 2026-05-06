export type ExportCellValue = string | number | null | undefined

export interface ExportColumn {
  header: string
  accessor: string
  align?: "left" | "right"
}

export type ExportRow = Record<string, ExportCellValue>

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
): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF()
  let startY = 14
  if (title) {
    doc.setFontSize(14)
    doc.text(title, 14, 16)
    startY = 24
  }

  const columnStyles: Record<number, { halign: "left" | "right" }> = {}
  columns.forEach((c, i) => {
    if (c.align === "right") columnStyles[i] = { halign: "right" }
  })

  autoTable(doc, {
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(row[c.accessor] ?? ""))),
    startY,
    columnStyles,
  })

  doc.save(`${filename}.pdf`)
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
