"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { api, setToken, clearToken } from "@/lib/api/client"

interface AuthContextType {
  accessToken: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem("accessToken")
    if (stored) {
      setAccessToken(stored)
      setIsLoading(false)
    } else {
      api.auth.refresh().then((token) => {
        if (token) setAccessToken(token)
        setIsLoading(false)
      })
    }
  }, [])

  async function login(email: string, password: string) {
    const { accessToken: token } = await api.auth.login(email, password)
    setToken(token)
    setAccessToken(token)
  }

  async function logout() {
    const token = accessToken
    setAccessToken(null)
    clearToken()
    await api.auth.logout(token)
    window.location.href = "/login"
  }

  return (
    <AuthContext.Provider value={{ accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
