"use client";

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { Eye, EyeOff, Mail } from 'lucide-react'
import { AuthInput, ErrorList, GoogleIcon } from '../../../components/AuthControls'
import { AuthShell } from '../../../components/AuthShell'
import { ApiError, apiUrl } from '../../../api/client'
import { useAuth } from '../../../hooks/useAuth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getLoginErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'UNAUTHORIZED') return 'El email o la contraseña no son correctos.'
    if (error.code === 'VALIDATION_ERROR') return 'Revisá el email y la contraseña.'
    return error.message
  }

  return 'No pudimos iniciar sesión. Intentá de nuevo.'
}

export default function Login() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, login } = useAuth()
  const hasInviteRedirect = searchParams.get('redirect')?.startsWith('/join') ?? false
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function getPostLoginRedirect(): string {
    const params = new URLSearchParams(window.location.search)
    const redirectParam = params.get('redirect')
    if (redirectParam) return redirectParam
    const pendingToken = sessionStorage.getItem('pendingInviteToken')
    if (pendingToken) return `/join?token=${pendingToken}`
    return '/home'
  }

  useEffect(() => {
    if (!loading && user) router.replace(getPostLoginRedirect())
  }, [loading, router, user])


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: string[] = []

    if (!email.trim()) nextErrors.push('Ingresá tu email.')
    if (email.trim() && !EMAIL_PATTERN.test(email.trim())) nextErrors.push('Ingresá un email válido.')
    if (!password) nextErrors.push('Ingresá tu contraseña.')

    setErrors(nextErrors)
    if (nextErrors.length > 0) {
      return
    }

    setSubmitting(true)
    try {
      await login(email.trim(), password)
      router.replace(getPostLoginRedirect())
    } catch (err) {

      setErrors([getLoginErrorMessage(err)])
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || user) {
    return <div className="flex min-h-dvh items-center justify-center bg-background text-foreground/70">Cargando...</div>
  }

  return (
    <AuthShell
      title="Bienvenido de vuelta"
      description={hasInviteRedirect ? "Iniciá sesión para unirte a la liga." : "Iniciá sesión para ver tu Prodeazo."}
      footer={
        <>
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="font-bold text-primary transition-colors hover:text-primary/70 hover:underline">
            Crear cuenta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          icon={<Mail className="h-5 w-5" aria-hidden />}
          hasError={errors.some(err => err.toLowerCase().includes('email'))}
        />

        <AuthInput
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hasError={errors.some(err => err.toLowerCase().includes('contraseña'))}
          action={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="cursor-pointer rounded-[10px] p-1 text-foreground transition-colors hover:text-primary"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
            </button>
          }
        />

        <div className="-mt-2 flex justify-end">
          <button
            type="button"
            className="cursor-pointer text-sm font-bold text-primary transition-colors hover:text-primary/70 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <ErrorList errors={errors} />

        <button
          type="submit"
          disabled={submitting || !email.trim() || !password}
          className="h-12 w-full cursor-pointer select-none rounded-[10px] bg-primary px-5 font-display text-base font-bold tracking-tight text-black transition-all enabled:hover:brightness-95 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-foreground/45">
        <span className="h-px flex-1 bg-white/10" />
        o
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <a
        href={apiUrl('/api/auth/google')}
        className="flex h-12 w-full select-none items-center justify-center gap-3 rounded-[10px] border border-white/20 bg-black px-5 font-display text-sm font-bold tracking-tight text-foreground transition-colors hover:border-primary"
      >
        <GoogleIcon />
        Continuar con Google
      </a>
    </AuthShell>
  )
}
