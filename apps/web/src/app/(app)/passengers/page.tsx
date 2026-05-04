"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api/client"
import type { Passenger } from "@/lib/api/types"
import { PassengersList } from "./passengers-list"

export default function PassengersPage() {
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      setPassengers(await api.passengers.list())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
  return <PassengersList passengers={passengers} onRefresh={load} />
}
