export function col<T>(row: Record<string, unknown>, key: string): T {
  if (!(key in row)) throw new Error(`Missing column: ${key}`)
  return row[key] as T
}

export function optCol<T>(row: Record<string, unknown>, key: string): T | null {
  return (row[key] ?? null) as T | null
}
