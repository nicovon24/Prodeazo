"use client";

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { AuthInput, ErrorList } from '../../../components/AuthControls'
import { AuthShell } from '../../../components/AuthShell'
import { forgotPassword } from '../../../api/auth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type PageState = 'idle' | 'loading' | 'sent'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [pageState, setPageState] = useState<PageState>('idle')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors: string[] = []
    if (!email.trim()) nextErrors.push('Ingresá tu email.')
    if (email.trim() && !EMAIL_PATTERN.test(email.trim())) nextErrors.push('Ingresá un email válido.')
    setErrors(nextErrors)
    if (nextErrors.length > 0) return

    setPageState('loading')
    try {
      await forgotPassword(email.trim())
      setPageState('sent')
    } catch {
      setErrors(['No pudimos procesar tu solicitud. Intentá de nuevo.'])
      setPageState('idle')
    }
  }

  if (pageState === 'sent') {
    return (
      <AuthShell
        title="Revisá tu email"
        description="Si el email está registrado, te enviamos un link para continuar."
        footer={
          <Link href="/login" className="font-bold text-primary transition-colors hover:text-primary/70 hover:underline">
            Volver al inicio de sesión
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <p className="text-center text-sm text-foreground/60">
            Enviamos el link a <strong className="text-foreground">{email}</strong>.<br />
            Revisá tu bandeja de entrada y carpeta de spam.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="¿Olvidaste tu contraseña?"
      description="Ingresá tu email y te enviamos un link para restablecerla."
      footer={
        <>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-bold text-primary transition-colors hover:text-primary/70 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio de sesión
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
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="h-5 w-5" aria-hidden />}
          hasError={errors.some((err) => err.toLowerCase().includes('email'))}
        />

        <ErrorList errors={errors} />

        <button
          type="submit"
          disabled={pageState === 'loading' || !email.trim()}
          className="h-12 w-full cursor-pointer select-none rounded-[10px] bg-primary px-5 font-display text-base font-bold tracking-tight text-black transition-all enabled:hover:brightness-95 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pageState === 'loading' ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>
    </AuthShell>
  )
}
