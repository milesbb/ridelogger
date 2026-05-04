"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api/client"
import type { Location } from "@/lib/api/types"
import { LocationsList } from "./locations-list"

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      setLocations(await api.locations.list())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
  return <LocationsList locations={locations} onRefresh={load} />
}
