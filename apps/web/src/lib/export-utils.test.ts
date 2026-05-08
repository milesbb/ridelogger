// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportToCsv } from './export-utils'
import type { ExportColumn, ExportRow } from './export-utils'

const columns: ExportColumn[] = [
  { header: 'Name', accessor: 'name' },
  { header: 'Distance (km)', accessor: 'distance', align: 'right' },
]

const rows: ExportRow[] = [
  { name: 'Alice Smith', distance: 12.4 },
  { name: 'Bob, Jr', distance: 5 },
]

let lastBlob: Blob | null = null
let lastFilename: string | null = null

beforeEach(() => {
  lastBlob = null
  lastFilename = null
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    lastBlob = blob as Blob
    return 'blob:fake'
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

  const originalCreateElement = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = originalCreateElement(tag)
    if (tag === 'a') {
      Object.defineProperty(el, 'click', { value: vi.fn(), writable: true })
      Object.defineProperty(el, 'download', {
        get() { return lastFilename ?? '' },
        set(v) { lastFilename = v },
        configurable: true,
      })
    }
    return el
  })
})

describe('exportToCsv — CSV content', () => {
  it('includes a header row with column names', async () => {
    exportToCsv('report', columns, rows)
    const text = await lastBlob!.text()
    expect(text.split('\n')[0]).toBe('Name,Distance (km)')
  })

  it('includes one data row per input row', async () => {
    exportToCsv('report', columns, rows)
    const lines = (await lastBlob!.text()).split('\n')
    expect(lines).toHaveLength(3) // header + 2 rows
  })

  it('renders numeric values as strings in the correct column', async () => {
    exportToCsv('report', columns, rows)
    const lines = (await lastBlob!.text()).split('\n')
    expect(lines[1]).toBe('Alice Smith,12.4')
  })

  it('uses empty string for null and undefined cell values', async () => {
    const sparseRows: ExportRow[] = [{ name: 'Alice', distance: null }]
    exportToCsv('report', columns, sparseRows)
    const lines = (await lastBlob!.text()).split('\n')
    expect(lines[1]).toBe('Alice,')
  })

  it('sets the correct MIME type on the blob', () => {
    exportToCsv('report', columns, rows)
    expect(lastBlob!.type).toContain('text/csv')
  })
})

describe('exportToCsv — CSV escaping', () => {
  it('wraps a cell containing a comma in double quotes', async () => {
    exportToCsv('report', columns, [{ name: 'Bob, Jr', distance: 5 }])
    const lines = (await lastBlob!.text()).split('\n')
    expect(lines[1]).toContain('"Bob, Jr"')
  })

  it('wraps a cell containing a double quote and escapes internal quotes', async () => {
    exportToCsv('report', columns, [{ name: 'Say "hi"', distance: 1 }])
    const lines = (await lastBlob!.text()).split('\n')
    expect(lines[1]).toContain('"Say ""hi"""')
  })

  it('wraps a cell containing a newline in double quotes', async () => {
    exportToCsv('report', columns, [{ name: 'Line1\nLine2', distance: 1 }])
    const lines = (await lastBlob!.text()).split('\n')
    expect(lines[1].startsWith('"Line1')).toBe(true)
  })

  it('does not quote plain values', async () => {
    exportToCsv('report', columns, [{ name: 'Alice Smith', distance: 12 }])
    const lines = (await lastBlob!.text()).split('\n')
    expect(lines[1]).toBe('Alice Smith,12')
  })
})

describe('exportToCsv — filename', () => {
  it('appends .csv to the provided filename', () => {
    exportToCsv('my-report', columns, rows)
    expect(lastFilename).toBe('my-report.csv')
  })
})
