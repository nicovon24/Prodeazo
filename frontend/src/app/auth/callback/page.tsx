'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { apiFetch } from '@/api/client'

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setTokenAndUser } = useAuthStore()

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      router.replace('/login')
      return
    }

    apiFetch<{ token: string }>(`/api/auth/exchange?code=${code}`)
      .then(({ token }) => {
        setTokenAndUser(token)
        router.replace('/home')
      })
      .catch(() => router.replace('/login'))
  }, [searchParams, router, setTokenAndUser])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Iniciando sesión...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Iniciando sesión...</p>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  )
}
