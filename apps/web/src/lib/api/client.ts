import type { Passenger, Location, AppSettings, DriveSegmentInput, DriveSegmentResult } from "./types"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem("accessToken")
}

export function setToken(token: string): void {
  sessionStorage.setItem("accessToken", token)
}

export function clearToken(): void {
  sessionStorage.removeItem("accessToken")
}

async function tryRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
    if (!res.ok) return null
    const data = await res.json()
    setToken(data.accessToken)
    return data.accessToken
  } catch {
    return null
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const makeRequest = (t: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(options.headers as Record<string, string> | undefined),
      },
    })

  let res = await makeRequest(token)

  if (res.status === 401) {
    const newToken = await tryRefresh()
    if (!newToken) {
      clearToken()
      window.location.href = "/login"
      throw new Error("Session expired")
    }
    res = await makeRequest(newToken)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }))
    throw new Error(err.message ?? "Request failed")
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ accessToken: string }>("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: (token: string | null) =>
      fetch(`${API_URL}/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {}),
    refresh: tryRefresh,
  },
  passengers: {
    list: () => apiFetch<Passenger[]>("/v1/passengers"),
    create: (data: { name: string; homeAddress: string; notes: string }) =>
      apiFetch<Passenger>("/v1/passengers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { name: string; homeAddress: string; notes: string }) =>
      apiFetch<Passenger>(`/v1/passengers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiFetch<void>(`/v1/passengers/${id}`, { method: "DELETE" }),
  },
  locations: {
    list: () => apiFetch<Location[]>("/v1/locations"),
    create: (data: { name: string; address: string }) =>
      apiFetch<Location>("/v1/locations", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { name: string; address: string }) =>
      apiFetch<Location>(`/v1/locations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiFetch<void>(`/v1/locations/${id}`, { method: "DELETE" }),
  },
  settings: {
    get: () => apiFetch<AppSettings | null>("/v1/settings"),
    save: (homeAddress: string) =>
      apiFetch<AppSettings>("/v1/settings", { method: "PUT", body: JSON.stringify({ homeAddress }) }),
  },
  drive: {
    calculate: (segments: DriveSegmentInput[]) =>
      apiFetch<DriveSegmentResult[]>("/v1/drive/calculate", {
        method: "POST",
        body: JSON.stringify({ segments }),
      }),
  },
}
