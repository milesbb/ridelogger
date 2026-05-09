import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddressFields, assembleAddress, parseAustralianAddress, type AustralianAddress } from './address-fields'

const emptyAddress: AustralianAddress = { street: '', suburb: '', state: '', postcode: '' }

describe('assembleAddress', () => {
  it('assembles a well-formed address string', () => {
    expect(assembleAddress({ street: '41 Victoria Parade', suburb: 'Fitzroy', state: 'VIC', postcode: '3065' }))
      .toBe('41 Victoria Parade, Fitzroy VIC 3065')
  })

  it('assembles with a multi-word suburb', () => {
    expect(assembleAddress({ street: '1 Main St', suburb: 'Port Melbourne', state: 'VIC', postcode: '3207' }))
      .toBe('1 Main St, Port Melbourne VIC 3207')
  })
})

describe('parseAustralianAddress', () => {
  it('parses a standard address', () => {
    expect(parseAustralianAddress('41 Victoria Parade, Fitzroy VIC 3065')).toEqual({
      street: '41 Victoria Parade',
      suburb: 'Fitzroy',
      state: 'VIC',
      postcode: '3065',
    })
  })

  it('parses an address with a multi-word suburb', () => {
    expect(parseAustralianAddress('1 Main St, Port Melbourne VIC 3207')).toEqual({
      street: '1 Main St',
      suburb: 'Port Melbourne',
      state: 'VIC',
      postcode: '3207',
    })
  })

  it('parses addresses for all states', () => {
    const states = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']
    for (const state of states) {
      const result = parseAustralianAddress(`1 Test St, Suburb ${state} 1234`)
      expect(result.state).toBe(state)
    }
  })

  it('falls back gracefully for unparseable strings', () => {
    expect(parseAustralianAddress('not an address')).toEqual({
      street: 'not an address',
      suburb: '',
      state: '',
      postcode: '',
    })
  })

  it('falls back gracefully for empty string', () => {
    expect(parseAustralianAddress('')).toEqual({ street: '', suburb: '', state: '', postcode: '' })
  })
})

describe('AddressFields component', () => {
  it('renders all four labelled fields', () => {
    render(<AddressFields value={emptyAddress} onChange={vi.fn()} />)
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/suburb/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument()
  })

  it('calls onChange with updated street when user types', () => {
    const onChange = vi.fn()
    render(<AddressFields value={emptyAddress} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '99 Test Rd' } })
    expect(onChange).toHaveBeenCalledWith({ ...emptyAddress, street: '99 Test Rd' })
  })

  it('calls onChange with updated suburb when user types', () => {
    const onChange = vi.fn()
    render(<AddressFields value={emptyAddress} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/suburb/i), { target: { value: 'Carlton' } })
    expect(onChange).toHaveBeenCalledWith({ ...emptyAddress, suburb: 'Carlton' })
  })

  it('calls onChange with updated state when user selects', () => {
    const onChange = vi.fn()
    render(<AddressFields value={emptyAddress} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/state/i), { target: { value: 'QLD' } })
    expect(onChange).toHaveBeenCalledWith({ ...emptyAddress, state: 'QLD' })
  })

  it('calls onChange with updated postcode when user types', () => {
    const onChange = vi.fn()
    render(<AddressFields value={emptyAddress} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/postcode/i), { target: { value: '3000' } })
    expect(onChange).toHaveBeenCalledWith({ ...emptyAddress, postcode: '3000' })
  })

  it('shows postcode error when postcode is non-empty and not 4 digits', () => {
    render(<AddressFields value={{ ...emptyAddress, postcode: '30' }} onChange={vi.fn()} />)
    expect(screen.getByText(/postcode must be 4 digits/i)).toBeInTheDocument()
  })

  it('does not show postcode error when postcode is empty', () => {
    render(<AddressFields value={emptyAddress} onChange={vi.fn()} />)
    expect(screen.queryByText(/postcode must be 4 digits/i)).not.toBeInTheDocument()
  })

  it('does not show postcode error for a valid 4-digit postcode', () => {
    render(<AddressFields value={{ ...emptyAddress, postcode: '3065' }} onChange={vi.fn()} />)
    expect(screen.queryByText(/postcode must be 4 digits/i)).not.toBeInTheDocument()
  })

  it('disables all fields when disabled prop is true', () => {
    render(<AddressFields value={emptyAddress} onChange={vi.fn()} disabled />)
    expect(screen.getByLabelText(/street address/i)).toBeDisabled()
    expect(screen.getByLabelText(/suburb/i)).toBeDisabled()
    expect(screen.getByLabelText(/state/i)).toBeDisabled()
    expect(screen.getByLabelText(/postcode/i)).toBeDisabled()
  })

  it('uses idPrefix to avoid id collisions', () => {
    render(<AddressFields value={emptyAddress} onChange={vi.fn()} idPrefix="test-prefix" />)
    expect(document.getElementById('test-prefix-street')).toBeInTheDocument()
    expect(document.getElementById('test-prefix-suburb')).toBeInTheDocument()
  })
})
