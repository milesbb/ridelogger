import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { axe } from "vitest-axe"
import { DriveLogExport } from "./drive-log-export"

vi.mock("@/lib/api/client", () => ({
  api: {
    drive: { exportDays: vi.fn().mockResolvedValue([]) },
  },
}))

vi.mock("@/lib/export-utils", () => ({
  exportToCsv: vi.fn(),
  exportToExcel: vi.fn().mockResolvedValue(undefined),
  exportToPdf: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("./calendar-pdf-export", () => ({
  exportToCalendarPdf: vi.fn().mockResolvedValue(undefined),
  exportToListAndCalendarPdf: vi.fn().mockResolvedValue(undefined),
}))

const DEFAULT_PROPS = { defaultFrom: "2026-05-01", defaultTo: "2026-05-31" }

beforeEach(() => {
  vi.clearAllMocks()
})

describe("DriveLogExport — rendering", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<DriveLogExport {...DEFAULT_PROPS} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it("renders the from and to date inputs with default values", () => {
    render(<DriveLogExport {...DEFAULT_PROPS} />)
    const inputs = screen.getAllByDisplayValue(/2026-05/)
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })

  it("renders format radio buttons for PDF, CSV, and Excel", () => {
    render(<DriveLogExport {...DEFAULT_PROPS} />)
    expect(screen.getByRole("radio", { name: /pdf/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /csv/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /excel/i })).toBeInTheDocument()
  })

  it("defaults to PDF format selected", () => {
    render(<DriveLogExport {...DEFAULT_PROPS} />)
    expect(screen.getByRole("radio", { name: /pdf/i })).toBeChecked()
  })

  it("shows PDF layout options when PDF is selected", () => {
    render(<DriveLogExport {...DEFAULT_PROPS} />)
    expect(screen.getByRole("radio", { name: /^list$/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /^calendar$/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /list and calendar/i })).toBeInTheDocument()
  })

  it("hides PDF layout options when CSV is selected", () => {
    render(<DriveLogExport {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole("radio", { name: /csv/i }))
    expect(screen.queryByRole("radio", { name: /list and calendar/i })).not.toBeInTheDocument()
  })

  it("hides PDF layout options when Excel is selected", () => {
    render(<DriveLogExport {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole("radio", { name: /excel/i }))
    expect(screen.queryByRole("radio", { name: /^list$/i })).not.toBeInTheDocument()
  })

  it("renders a single Export button", () => {
    render(<DriveLogExport {...DEFAULT_PROPS} />)
    expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument()
  })
})

describe("DriveLogExport — export behaviour", () => {
  it("calls exportToCsv when CSV is selected and Export is clicked", async () => {
    const { exportToCsv } = await import("@/lib/export-utils")
    render(<DriveLogExport {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole("radio", { name: /csv/i }))
    fireEvent.click(screen.getByRole("button", { name: /export/i }))
    await waitFor(() => expect(exportToCsv).toHaveBeenCalledOnce())
  })

  it("calls exportToExcel when Excel is selected and Export is clicked", async () => {
    const { exportToExcel } = await import("@/lib/export-utils")
    render(<DriveLogExport {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole("radio", { name: /excel/i }))
    fireEvent.click(screen.getByRole("button", { name: /export/i }))
    await waitFor(() => expect(exportToExcel).toHaveBeenCalledOnce())
  })

  it("calls exportToPdf with landscape option when PDF list layout is selected", async () => {
    const { exportToPdf } = await import("@/lib/export-utils")
    render(<DriveLogExport {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole("radio", { name: /^list$/i }))
    fireEvent.click(screen.getByRole("button", { name: /export/i }))
    await waitFor(() =>
      expect(exportToPdf).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(Array),
        "Drive Log",
        expect.objectContaining({ landscape: true }),
      ),
    )
  })

  it("calls exportToCalendarPdf when calendar layout is selected", async () => {
    const { exportToCalendarPdf } = await import("./calendar-pdf-export")
    render(<DriveLogExport {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole("radio", { name: /^calendar$/i }))
    fireEvent.click(screen.getByRole("button", { name: /export/i }))
    await waitFor(() => expect(exportToCalendarPdf).toHaveBeenCalledOnce())
  })

  it("calls exportToListAndCalendarPdf when list and calendar layout is selected", async () => {
    const { exportToListAndCalendarPdf } = await import("./calendar-pdf-export")
    render(<DriveLogExport {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole("radio", { name: /list and calendar/i }))
    fireEvent.click(screen.getByRole("button", { name: /export/i }))
    await waitFor(() => expect(exportToListAndCalendarPdf).toHaveBeenCalledOnce())
  })

  it("shows an error message when the API call fails", async () => {
    const { api } = await import("@/lib/api/client")
    vi.mocked(api.drive.exportDays).mockRejectedValueOnce(new Error("Network error"))
    render(<DriveLogExport {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole("button", { name: /export/i }))
    await waitFor(() => expect(screen.getByText("Network error")).toBeInTheDocument())
  })

  it("disables the Export button while loading", async () => {
    const { api } = await import("@/lib/api/client")
    let resolve: () => void
    vi.mocked(api.drive.exportDays).mockReturnValueOnce(
      new Promise<never>((res) => { resolve = () => res([] as never) }),
    )
    render(<DriveLogExport {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole("button", { name: /export/i }))
    expect(screen.getByRole("button", { name: /exporting/i })).toBeDisabled()
    resolve!()
  })
})
