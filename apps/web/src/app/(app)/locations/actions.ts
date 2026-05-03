"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createRoutingService } from "@ridelogger/routing"

async function geocodeAddress(address: string) {
  const routing = await createRoutingService(
    (process.env.ROUTING_PROVIDER as "ors" | "google") ?? "ors",
  )
  return routing.geocode(address)
}

export async function createLocation(data: { name: string; address: string }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  let lat: number | null = null
  let lon: number | null = null
  try {
    const coords = await geocodeAddress(data.address)
    lat = coords.lat
    lon = coords.lon
  } catch {
    return { error: "Could not geocode that address. Please check it and try again." }
  }

  const { error } = await supabase.from("locations").insert({
    user_id: user.id,
    name: data.name,
    address: data.address,
    lat,
    lon,
  })

  if (error) return { error: error.message }
  revalidatePath("/locations")
  return { error: null }
}

export async function updateLocation(id: string, data: { name: string; address: string }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  let lat: number | null = null
  let lon: number | null = null
  try {
    const coords = await geocodeAddress(data.address)
    lat = coords.lat
    lon = coords.lon
  } catch {
    return { error: "Could not geocode that address. Please check it and try again." }
  }

  const { error } = await supabase
    .from("locations")
    .update({ name: data.name, address: data.address, lat, lon })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/locations")
  return { error: null }
}

export async function deleteLocation(id: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/locations")
  return { error: null }
}
