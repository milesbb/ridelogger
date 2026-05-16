// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { setToken, clearToken, api } from './client'

function ok(body: unknown, status = 200) {
  return Promise.resolve({
    ok: true,
    status,
    json: async () => body,
  })
}

function fail(status: number, body: unknown = { message: 'Error' }) {
  return Promise.resolve({
    ok: false,
    status,
    json: async () => body,
  })
}

beforeEach(() => {
  mockFetch.mockReset()
  sessionStorage.clear()
})

describe('setToken / clearToken', () => {
  it('stores and removes the token from sessionStorage', () => {
    setToken('tok-123')
    expect(sessionStorage.getItem('accessToken')).toBe('tok-123')
    clearToken()
    expect(sessionStorage.getItem('accessToken')).toBeNull()
  })
})

describe('api.auth.login', () => {
  it('posts credentials and returns accessToken', async () => {
    mockFetch.mockResolvedValueOnce(ok({ accessToken: 'acc-tok' }))

    const result = await api.auth.login('jo', 'secret')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toMatch('/v1/auth/login')
    expect(JSON.parse(opts.body)).toMatchObject({ emailOrUsername: 'jo', password: 'secret' })
    expect(result.accessToken).toBe('acc-tok')
  })

  it('throws the server message when credentials are invalid (401 + InvalidCredentials errorKey)', async () => {
    mockFetch.mockResolvedValueOnce(
      fail(401, { message: 'Invalid email or password', errorKey: 'InvalidCredentials' }),
    )

    await expect(api.auth.login('jo', 'wrong')).rejects.toThrow('Invalid email or password')
    // Must not attempt a token refresh — only one fetch call
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('throws when the server returns a non-401 error', async () => {
    mockFetch.mockResolvedValueOnce(fail(422, { message: 'Invalid credentials' }))

    await expect(api.auth.login('jo', 'wrong')).rejects.toThrow('Invalid credentials')
  })
})

describe('api.auth.register', () => {
  it('posts registration data and returns accessToken', async () => {
    mockFetch.mockResolvedValueOnce(ok({ accessToken: 'acc-tok' }))

    const result = await api.auth.register('jo@example.com', 'jo', 'secret')

    const [, opts] = mockFetch.mock.calls[0]
    expect(JSON.parse(opts.body)).toMatchObject({ email: 'jo@example.com', username: 'jo' })
    expect(result.accessToken).toBe('acc-tok')
  })
})

describe('apiFetch auto-refresh', () => {
  it('retries with a new token after a 401', async () => {
    setToken('expired-tok')
    // First call returns 401, refresh succeeds, second call succeeds
    mockFetch
      .mockResolvedValueOnce(fail(401))
      .mockResolvedValueOnce(ok({ accessToken: 'new-tok' }))   // refresh
      .mockResolvedValueOnce(ok({ data: 'ok' }))               // retry

    await api.passengers.list()

    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(sessionStorage.getItem('accessToken')).toBe('new-tok')
  })

  it('clears token and throws when refresh also fails', async () => {
    setToken('expired-tok')
    Object.defineProperty(window, 'location', { value: { href: '' }, writable: true })

    mockFetch
      .mockResolvedValueOnce(fail(401))
      .mockResolvedValueOnce(fail(401))  // refresh fails

    await expect(api.passengers.list()).rejects.toThrow('Session expired')
    expect(sessionStorage.getItem('accessToken')).toBeNull()
  })
})

describe('api.passengers', () => {
  it('list sends GET /v1/passengers', async () => {
    mockFetch.mockResolvedValueOnce(ok([]))
    await api.passengers.list()
    expect(mockFetch.mock.calls[0][0]).toMatch('/v1/passengers')
  })

  it('create sends POST with passenger data', async () => {
    mockFetch.mockResolvedValueOnce(ok({ id: 'p-1' }))
    await api.passengers.create({ name: 'Alice', homeAddress: '1 Main St', notes: '' })
    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body).name).toBe('Alice')
  })

  it('delete sends DELETE to the correct URL', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => undefined })
    await api.passengers.delete('p-1')
    expect(mockFetch.mock.calls[0][0]).toMatch('/v1/passengers/p-1')
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
  })
})

describe('api.locations', () => {
  it('list sends GET /v1/locations', async () => {
    mockFetch.mockResolvedValueOnce(ok([]))
    await api.locations.list()
    expect(mockFetch.mock.calls[0][0]).toMatch('/v1/locations')
  })

  it('create sends POST with location data', async () => {
    mockFetch.mockResolvedValueOnce(ok({ id: 'l-1' }))
    await api.locations.create({ name: 'Hospital', address: '1 Health Ave' })
    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body).name).toBe('Hospital')
  })
})

describe('api.settings', () => {
  it('get sends GET /v1/settings', async () => {
    mockFetch.mockResolvedValueOnce(ok(null))
    await api.settings.get()
    expect(mockFetch.mock.calls[0][0]).toMatch('/v1/settings')
  })

  it('save sends PUT with homeAddress', async () => {
    mockFetch.mockResolvedValueOnce(ok({ id: 's-1' }))
    await api.settings.save('10 Home Rd')
    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.method).toBe('PUT')
    expect(JSON.parse(opts.body).homeAddress).toBe('10 Home Rd')
  })
})
