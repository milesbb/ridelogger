import { createClient } from "@/lib/supabase/server"
import { SettingsForm } from "./settings-form"

export default async function SettingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: settings } = await supabase
    .from("app_settings")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set your home address — used as the starting point for drive calculations.
        </p>
      </div>
      <SettingsForm existing={settings} />
    </div>
  )
}
