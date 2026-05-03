"use server"

import { createClient } from "@/lib/supabase/server"
import { createRoutingService } from "@ridelogger/routing"

export async function saveSettings({ homeAddress }: { homeAddress: string }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  let home_lat: number | null = null
  let home_lon: number | null = null

  try {
    const routing = await createRoutingService(
      (process.env.ROUTING_PROVIDER as "ors" | "google") ?? "ors",
    )
    const coords = await routing.geocode(homeAddress)
    home_lat = coords.lat
    home_lon = coords.lon
  } catch {
    return { error: "Could not geocode that address. Please check it and try again." }
  }

  const { error } = await supabase.from("app_settings").upsert(
    {
      user_id: user.id,
      home_address: homeAddress,
      home_lat,
      home_lon,
    },
    { onConflict: "user_id" },
  )

  if (error) return { error: error.message }
  return { error: null }
}
