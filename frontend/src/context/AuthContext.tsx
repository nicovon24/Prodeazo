"use client"

import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../store/useAuthStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const fetchMe = useAuthStore((s) => s.fetchMe)
  useEffect(() => { fetchMe() }, [fetchMe])
  return <>{children}</>
}
