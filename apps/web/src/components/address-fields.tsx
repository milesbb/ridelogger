"use client"

import { Input } from "@/components/ui/input"

export interface AustralianAddress {
  street: string
  suburb: string
  state: string
  postcode: string
}

const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"] as const

export function assembleAddress(a: AustralianAddress): string {
  return `${a.street}, ${a.suburb} ${a.state} ${a.postcode}`
}

export function parseAustralianAddress(s: string): AustralianAddress {
  const match = s.match(/^(.+),\s+(.+?)\s+(ACT|NSW|NT|QLD|SA|TAS|VIC|WA)\s+(\d{4})$/)
  if (match) {
    return { street: match[1].trim(), suburb: match[2].trim(), state: match[3], postcode: match[4] }
  }
  return { street: s, suburb: "", state: "", postcode: "" }
}

interface AddressFieldsProps {
  value: AustralianAddress
  onChange: (v: AustralianAddress) => void
  disabled?: boolean
  idPrefix?: string
}

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

export function AddressFields({ value, onChange, disabled = false, idPrefix = "addr" }: AddressFieldsProps) {
  const postcodeError = value.postcode !== "" && !/^\d{4}$/.test(value.postcode)

  function update(field: keyof AustralianAddress, fieldValue: string) {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-street`} className="text-sm font-medium">Street address</label>
        <Input
          id={`${idPrefix}-street`}
          value={value.street}
          onChange={(e) => update("street", e.target.value)}
          placeholder="41 Victoria Parade"
          required
          maxLength={150}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5 sm:col-span-1">
          <label htmlFor={`${idPrefix}-suburb`} className="text-sm font-medium">Suburb</label>
          <Input
            id={`${idPrefix}-suburb`}
            value={value.suburb}
            onChange={(e) => update("suburb", e.target.value)}
            placeholder="Fitzroy"
            required
            maxLength={60}
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${idPrefix}-state`} className="text-sm font-medium">State / Territory</label>
          <select
            id={`${idPrefix}-state`}
            value={value.state}
            onChange={(e) => update("state", e.target.value)}
            required
            disabled={disabled}
            className={SELECT_CLASS}
          >
            <option value="" disabled>Select…</option>
            {AU_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${idPrefix}-postcode`} className="text-sm font-medium">Postcode</label>
          <Input
            id={`${idPrefix}-postcode`}
            value={value.postcode}
            onChange={(e) => update("postcode", e.target.value)}
            placeholder="3065"
            required
            maxLength={4}
            inputMode="numeric"
            disabled={disabled}
          />
          {postcodeError && (
            <p className="text-xs text-destructive">Postcode must be 4 digits</p>
          )}
        </div>
      </div>
    </div>
  )
}
