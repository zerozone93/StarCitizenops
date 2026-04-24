"use client"
import { useSession } from "next-auth/react"

interface PermissionGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
}

export function PermissionGate({ children, fallback, requireAuth = true }: PermissionGateProps) {
  const { data: session, status } = useSession()

  if (status === "loading") return null
  if (requireAuth && !session) return <>{fallback}</>
  return <>{children}</>
}
