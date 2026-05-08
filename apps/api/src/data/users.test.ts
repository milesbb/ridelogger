import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../utils/connections', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}))

import * as connections from '../utils/connections'
import { updateUserPassword, deleteUser } from './users'

const mockUserRow = {
  id: 'user-1',
  email: 'jo@example.com',
  username: 'jo',
  password_hash: 'new-hash',
  created_at: new Date().toISOString(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('updateUserPassword', () => {
  it('updates the password hash and returns the user', async () => {
    vi.mocked(connections.query).mockResolvedValue([mockUserRow])

    const user = await updateUserPassword('user-1', 'new-hash')

    expect(connections.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users'),
      ['new-hash', 'user-1'],
    )
    expect(user.id).toBe('user-1')
    expect(user.password_hash).toBe('new-hash')
  })
})

describe('deleteUser', () => {
  it('deletes the user row', async () => {
    vi.mocked(connections.query).mockResolvedValue([])

    await deleteUser('user-1')

    expect(connections.query).toHaveBeenCalledWith('DELETE FROM users WHERE id=$1', ['user-1'])
  })
})
