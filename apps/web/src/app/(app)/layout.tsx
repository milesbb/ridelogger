"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  function navClass(href: string): string {
    const active = href === "/drive" ? pathname === "/drive" : pathname.startsWith(href)
    return cn(
      "transition-colors",
      active
        ? "text-foreground font-medium underline underline-offset-4"
        : "text-muted-foreground hover:text-foreground"
    )
  }

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

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background sticky top-0 z-10">
        <nav className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/drive" className="flex items-center gap-2 font-semibold text-base">
            <img src="/icon.svg" alt="" aria-hidden="true" className="h-7 w-7" />
            RideLogger
          </Link>

          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden p-1 -mr-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/drive" className={navClass("/drive")}>
              New Drive Day
            </Link>
            <Link href="/drive-days" className={navClass("/drive-days")}>
              Drive Log
            </Link>
            <Link href="/passengers" className={navClass("/passengers")}>
              Passengers
            </Link>
            <Link href="/locations" className={navClass("/locations")}>
              Locations
            </Link>
            <Link href="/settings" className={navClass("/settings")}>
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

        {menuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="max-w-2xl mx-auto px-4 py-1 flex flex-col text-sm">
              <Link href="/drive" onClick={closeMenu} className={cn("py-3 border-b", navClass("/drive"))}>
                New Drive Day
              </Link>
              <Link href="/drive-days" onClick={closeMenu} className={cn("py-3 border-b", navClass("/drive-days"))}>
                Drive Log
              </Link>
              <Link href="/passengers" onClick={closeMenu} className={cn("py-3 border-b", navClass("/passengers"))}>
                Passengers
              </Link>
              <Link href="/locations" onClick={closeMenu} className={cn("py-3 border-b", navClass("/locations"))}>
                Locations
              </Link>
              <Link href="/settings" onClick={closeMenu} className={cn("py-3 border-b", navClass("/settings"))}>
                Settings
              </Link>
              <button
                onClick={() => { closeMenu(); logout(); }}
                className="py-3 text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">{children}</main>
      <footer className="border-t mt-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          More from{" "}
          <a
            href="https://github.com/milesbb"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Miles Bailey-Braendgaard
          </a>
        </div>
      </footer>
    </div>
  )
}
