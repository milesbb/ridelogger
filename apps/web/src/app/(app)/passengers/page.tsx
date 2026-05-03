import { createClient } from "@/lib/supabase/server"
import { PassengersList } from "./passengers-list"

export default async function PassengersPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: passengers } = await supabase
    .from("passengers")
    .select("*")
    .eq("user_id", user!.id)
    .order("name")

  return <PassengersList passengers={passengers ?? []} />
}
