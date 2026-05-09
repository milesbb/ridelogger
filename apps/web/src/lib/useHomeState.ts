import { useState, useEffect } from "react"
import { api } from "@/lib/api/client"
import { parseAustralianAddress } from "@/components/address-fields"

export function useHomeState(): string {
  const [homeState, setHomeState] = useState("")

  useEffect(() => {
    api.settings.get()
      .then((settings) => {
        if (settings?.home_address) {
          const { state } = parseAustralianAddress(settings.home_address)
          if (state) setHomeState(state)
        }
      })
      .catch(() => {})
  }, [])

  return homeState
}
