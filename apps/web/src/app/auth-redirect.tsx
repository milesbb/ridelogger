"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export function AuthRedirect() {
  const { accessToken, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && accessToken) {
      router.replace("/drive")
    }
  }, [accessToken, isLoading, router])

  return null
}
