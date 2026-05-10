import type { Passenger, Location, AppSettings, UserPreferences, DriveLegInput, DriveLegResult, SaveDriveDayInput, DriveDaySummary, DriveDayDetail, ExportLeg } from "./types"

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
    if (res.status >= 500) throw new Error("Something went wrong. Please try again.")
    const err = await res.json().catch(() => ({ message: "Request failed" }))
    throw new Error(err.message ?? "Request failed")
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    login: (emailOrUsername: string, password: string) =>
      apiFetch<{ accessToken: string }>("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ emailOrUsername, password }),
      }),
    register: (email: string, username: string, password: string) =>
      apiFetch<{ accessToken: string }>("/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, username, password }),
      }),
    logout: (token: string | null) =>
      fetch(`${API_URL}/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {}),
    refresh: tryRefresh,
    changePassword: (currentPassword: string, newPassword: string) =>
      apiFetch<void>("/v1/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    deleteAccount: (password: string) =>
      apiFetch<void>("/v1/auth/account", { method: "DELETE", body: JSON.stringify({ password }) }),
  },
  passengers: {
    list: () => apiFetch<Passenger[]>("/v1/passengers"),
    create: (data: { name: string; homeAddress: string }) =>
      apiFetch<Passenger>("/v1/passengers", { method: "POST", body: JSON.stringify(data) }),
    update: (
      id: string,
      data: {
        name: string
        homeUpdate:
          | { type: "none" }
          | { type: "edit"; address: string }
          | { type: "switch"; locationId: string }
      },
    ) => apiFetch<Passenger>(`/v1/passengers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string, deleteHomeLocation = false) =>
      apiFetch<void>(`/v1/passengers/${id}?deleteHomeLocation=${deleteHomeLocation}`, { method: "DELETE" }),
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
  preferences: {
    get: () => apiFetch<UserPreferences>("/v1/preferences"),
    save: (driveLogCalendarDefault: boolean) =>
      apiFetch<UserPreferences>("/v1/preferences", {
        method: "PATCH",
        body: JSON.stringify({ driveLogCalendarDefault }),
      }),
    saveTheme: (theme: 'light' | 'dark') =>
      apiFetch<UserPreferences>("/v1/preferences", {
        method: "PATCH",
        body: JSON.stringify({ theme }),
      }),
  },
  drive: {
    calculate: (legs: DriveLegInput[]) =>
      apiFetch<DriveLegResult[]>("/v1/drive/calculate", {
        method: "POST",
        body: JSON.stringify({ legs }),
      }),
    save: (input: SaveDriveDayInput) =>
      apiFetch<{ id: string }>("/v1/drive/save", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    listDays: () => apiFetch<DriveDaySummary[]>("/v1/drive/days"),
    listSimilarDays: (date: string) =>
      apiFetch<DriveDaySummary[]>(`/v1/drive/days/similar?date=${encodeURIComponent(date)}`),
    exportDays: (from: string, to: string) =>
      apiFetch<ExportLeg[]>(`/v1/drive/days/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
    getDay: (id: string) => apiFetch<DriveDayDetail>(`/v1/drive/days/${id}`),
    deleteDay: (id: string) => apiFetch<void>(`/v1/drive/days/${id}`, { method: "DELETE" }),
    getPassengerDropoffs: (passengerId: string) =>
      apiFetch<Location[]>(`/v1/drive/passengers/${encodeURIComponent(passengerId)}/dropoffs`),
  },
}
