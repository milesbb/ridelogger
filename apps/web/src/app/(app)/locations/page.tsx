import { createClient } from "@/lib/supabase/server"
import { LocationsList } from "./locations-list"

export default async function LocationsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .eq("user_id", user!.id)
    .order("name")

  return <LocationsList locations={locations ?? []} />
}
