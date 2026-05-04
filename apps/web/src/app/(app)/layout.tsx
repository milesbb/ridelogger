"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.replace("/login")
    }
  }, [accessToken, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!accessToken) return null

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background sticky top-0 z-10">
        <nav className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/drive" className="font-semibold text-base">
            RideLogger
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/passengers" className="text-muted-foreground hover:text-foreground transition-colors">
              Passengers
            </Link>
            <Link href="/locations" className="text-muted-foreground hover:text-foreground transition-colors">
              Locations
            </Link>
            <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
              Settings
            </Link>
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  )
}
