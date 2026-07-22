"use client"

import { useEffect, useState } from "react"

import { getBranding, type TenantBranding } from "@/services/branding-service"

export function useBranding() {
  const [branding, setBranding] = useState<TenantBranding | null>(null)

  useEffect(() => {
    let active = true
    getBranding().then((b) => {
      if (active) setBranding(b)
    })
    return () => {
      active = false
    }
  }, [])

  return branding
}
