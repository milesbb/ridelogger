import { describe, it, expect } from 'vitest'
import { col, optCol } from './utils'

describe('col', () => {
  it('returns value for an existing key', () => {
    expect(col({ id: 'abc' }, 'id')).toBe('abc')
  })

  it('works with numeric and null values', () => {
    expect(col({ count: 0 }, 'count')).toBe(0)
    expect(col({ val: null }, 'val')).toBeNull()
  })

  it('throws when key is absent', () => {
    expect(() => col({}, 'missing')).toThrow('Missing column: missing')
  })
})

describe('optCol', () => {
  it('returns value when key exists', () => {
    expect(optCol({ name: 'Alice' }, 'name')).toBe('Alice')
  })

  it('returns null when key is absent', () => {
    expect(optCol({}, 'notes')).toBeNull()
  })

  it('returns null when value is null', () => {
    expect(optCol({ notes: null }, 'notes')).toBeNull()
  })

  it('returns null when value is undefined', () => {
    expect(optCol({ notes: undefined }, 'notes')).toBeNull()
  })
})
