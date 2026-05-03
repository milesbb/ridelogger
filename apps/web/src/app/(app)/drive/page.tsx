import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DrivePlanner } from "./drive-planner"

export default async function DrivePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: settings } = await supabase
    .from("app_settings")
    .select("id")
    .eq("user_id", user!.id)
    .maybeSingle()

  if (!settings) redirect("/settings")

  const [{ data: passengers }, { data: locations }] = await Promise.all([
    supabase.from("passengers").select("*").eq("user_id", user!.id).order("name"),
    supabase.from("locations").select("*").eq("user_id", user!.id).order("name"),
  ])

  return <DrivePlanner passengers={passengers ?? []} locations={locations ?? []} />
}
