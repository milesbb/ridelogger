"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createRoutingService } from "@ridelogger/routing"

async function geocodeAddress(address: string) {
  const routing = await createRoutingService(
    (process.env.ROUTING_PROVIDER as "ors" | "google") ?? "ors",
  )
  const coords = await routing.geocode(address)
  return coords
}

export async function createPassenger(data: { name: string; homeAddress: string; notes: string }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  let home_lat: number | null = null
  let home_lon: number | null = null
  try {
    const coords = await geocodeAddress(data.homeAddress)
    home_lat = coords.lat
    home_lon = coords.lon
  } catch {
    return { error: "Could not geocode that address. Please check it and try again." }
  }

  const { error } = await supabase.from("passengers").insert({
    user_id: user.id,
    name: data.name,
    home_address: data.homeAddress,
    home_lat,
    home_lon,
    notes: data.notes || null,
  })

  if (error) return { error: error.message }
  revalidatePath("/passengers")
  return { error: null }
}

export async function updatePassenger(
  id: string,
  data: { name: string; homeAddress: string; notes: string },
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  let home_lat: number | null = null
  let home_lon: number | null = null
  try {
    const coords = await geocodeAddress(data.homeAddress)
    home_lat = coords.lat
    home_lon = coords.lon
  } catch {
    return { error: "Could not geocode that address. Please check it and try again." }
  }

  const { error } = await supabase
    .from("passengers")
    .update({
      name: data.name,
      home_address: data.homeAddress,
      home_lat,
      home_lon,
      notes: data.notes || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/passengers")
  return { error: null }
}

export async function deletePassenger(id: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("passengers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/passengers")
  return { error: null }
}
