"use client";

import Link from 'next/link'
import { FormEvent, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { AuthInput, ErrorList } from '../../../components/AuthControls'
import { AuthShell } from '../../../components/AuthShell'
import { ApiError } from '../../../api/client'
import { resetPassword } from '../../../api/auth'

type PageState = 'idle' | 'loading' | 'success' | 'expired'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-background text-foreground/70">Cargando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [pageState, setPageState] = useState<PageState>('idle')

  // No token → redirect
  if (!token) {
    router.replace('/forgot-password')
    return null
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors: string[] = []
    if (password.length < 8) nextErrors.push('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirm) nextErrors.push('Las contraseñas no coinciden.')
    setErrors(nextErrors)
    if (nextErrors.length > 0) return

    setPageState('loading')
    try {
      await resetPassword(token, password)
      setPageState('success')
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setPageState('expired')
      } else {
        setErrors(['No pudimos actualizar la contraseña. Intentá de nuevo.'])
        setPageState('idle')
      }
    }
  }

  if (pageState === 'success') {
    return (
      <AuthShell
        title="¡Contraseña actualizada!"
        description="Ya podés iniciar sesión con tu nueva contraseña."
        footer={null}
      >
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="h-12 w-full cursor-pointer select-none rounded-[10px] bg-primary px-5 font-display text-base font-bold tracking-tight text-black transition-all hover:brightness-95 active:scale-[0.99]"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </AuthShell>
    )
  }

  if (pageState === 'expired') {
    return (
      <AuthShell
        title="Link vencido"
        description="Este link ya venció o fue usado. Pedí uno nuevo."
        footer={null}
      >
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <Link
            href="/forgot-password"
            className="h-12 w-full flex items-center justify-center select-none rounded-[10px] bg-primary px-5 font-display text-base font-bold tracking-tight text-black transition-all hover:brightness-95 active:scale-[0.99]"
          >
            Pedir un link nuevo
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Creá tu nueva contraseña"
      description="Elegí una contraseña segura de al menos 8 caracteres."
      footer={null}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="Nueva contraseña"
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hasError={errors.some((err) => err.toLowerCase().includes('contraseña') && !err.includes('coincid'))}
          action={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="cursor-pointer rounded-[10px] p-1 text-foreground transition-colors hover:text-primary"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
            </button>
          }
        />

        <AuthInput
          label="Confirmar contraseña"
          type={showConfirm ? 'text' : 'password'}
          name="confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          hasError={errors.some((err) => err.includes('coincid'))}
          action={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="cursor-pointer rounded-[10px] p-1 text-foreground transition-colors hover:text-primary"
              aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showConfirm ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
            </button>
          }
        />

        <ErrorList errors={errors} />

        <button
          type="submit"
          disabled={pageState === 'loading' || !password || !confirm}
          className="h-12 w-full cursor-pointer select-none rounded-[10px] bg-primary px-5 font-display text-base font-bold tracking-tight text-black transition-all enabled:hover:brightness-95 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pageState === 'loading' ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </AuthShell>
  )
}
