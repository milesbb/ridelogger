import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function RootPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: settings } = await supabase
    .from("app_settings")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!settings) {
    redirect("/settings")
  }

  redirect("/drive")
}
