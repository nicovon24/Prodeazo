"use client";

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { Eye, EyeOff, Mail, UserRound, ArrowLeft, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthInput, ErrorList, GoogleIcon } from '../../../components/AuthControls'
import { AuthShell } from '../../../components/AuthShell'
import { ApiError, apiUrl } from '../../../api/client'
import { useAuth } from '../../../hooks/useAuth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getRegisterErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'CONFLICT') return 'Ese email ya está registrado.'
    if (error.code === 'VALIDATION_ERROR') return 'Revisá los datos para crear tu cuenta.'
    return error.message
  }
  return 'No pudimos crear la cuenta. Intentá de nuevo.'
}

export default function Register() {
  const router = useRouter()
  const { user, loading, register } = useAuth()
  
  // Form state
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const isStep1Valid = name.trim().length >= 2 && EMAIL_PATTERN.test(email.trim())
  const isStep2Valid = password.length > 0 && confirmPassword.length > 0

  useEffect(() => {
    if (!loading && user) router.replace('/home')
  }, [loading, router, user])


  const validateStep1 = () => {
    const nextErrors: string[] = []
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) nextErrors.push('Ingresá tu nombre completo.')
    else if (trimmedName.length < 2) nextErrors.push('El nombre completo debe tener al menos 2 caracteres.')
    else if (trimmedName.length > 80) nextErrors.push('El nombre completo no puede superar los 80 caracteres.')

    if (!trimmedEmail) nextErrors.push('Ingresá tu email.')
    else if (!EMAIL_PATTERN.test(trimmedEmail)) nextErrors.push('Ingresá un email válido.')
    else if (trimmedEmail.length > 254) nextErrors.push('El email es demasiado largo.')

    setErrors(nextErrors)
    return nextErrors.length === 0
  }

  const validateStep2 = () => {
    const nextErrors: string[] = []
    if (!password) nextErrors.push('Ingresá una contraseña.')
    else if (password.length < 8) nextErrors.push('La contraseña debe tener al menos 8 caracteres.')
    else if (password.length > 72) nextErrors.push('La contraseña no puede superar los 72 caracteres.')
    else if (/\s/.test(password)) nextErrors.push('La contraseña no puede contener espacios.')
    else if (!/[a-z]/.test(password)) nextErrors.push('La contraseña debe incluir una letra minúscula.')
    else if (!/[A-Z]/.test(password)) nextErrors.push('La contraseña debe incluir una letra mayúscula.')
    else if (!/\d/.test(password)) nextErrors.push('La contraseña debe incluir un número.')

    if (!confirmPassword) nextErrors.push('Repetí tu contraseña.')
    else if (password !== confirmPassword) nextErrors.push('Las contraseñas no coinciden.')

    setErrors(nextErrors)
    return nextErrors.length === 0
  }

  const handleNext = () => {
    if (validateStep1()) {
      setDirection(1)
      setStep(2)
      setErrors([])
    }
  }

  const handleBack = () => {
    setDirection(-1)
    setStep(1)
    setErrors([])
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateStep2()) return

    setSubmitting(true)
    try {
      await register(name.trim(), email.trim(), password)
      router.replace('/home')
    } catch (err) {

      setErrors([getRegisterErrorMessage(err)])
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || user) {
    return <div className="flex min-h-dvh items-center justify-center bg-background text-foreground/70">Cargando...</div>
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  }

  return (
    <AuthShell
      title={step === 1 ? "Creá tu cuenta" : "Definí tu acceso"}
      description={step === 1 ? "Sumate a Prodeazo y viví el Mundial como nunca antes." : "Elegí una contraseña segura para tu cuenta."}
      footer={
        <>
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-bold text-primary transition-colors hover:text-primary/70 hover:underline">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
          >
            {step === 1 ? (
              <form 
                onSubmit={(e) => { e.preventDefault(); handleNext(); }} 
                className="space-y-4"
              >
                <AuthInput
                  label="Nombre completo"
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre y apellido"
                  icon={<UserRound className="h-5 w-5" aria-hidden />}
                  hasError={errors.some(err => err.toLowerCase().includes('nombre'))}
                />

                <AuthInput
                  label="Email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  icon={<Mail className="h-5 w-5" aria-hidden />}
                  hasError={errors.some(err => err.toLowerCase().includes('email'))}
                />

                <ErrorList errors={errors} />

                <button
                  type="submit"
                  disabled={!isStep1Valid}
                  className="group flex h-12 w-full cursor-pointer select-none items-center justify-center gap-2 rounded-[10px] bg-primary px-5 font-display text-base font-bold tracking-tight text-black transition-all enabled:hover:brightness-95 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continuar
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:enabled:translate-x-1" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <AuthInput
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  hasError={errors.some(err => err.toLowerCase().includes('contraseña') && !err.toLowerCase().includes('coinciden'))}
                  action={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="cursor-pointer rounded-[10px] p-1 text-foreground transition-colors hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />

                <AuthInput
                  label="Confirmar contraseña"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir contraseña"
                  hasError={errors.some(err => err.toLowerCase().includes('coinciden') || (err.toLowerCase().includes('repetí') && !confirmPassword))}
                  action={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="cursor-pointer rounded-[10px] p-1 text-foreground transition-colors hover:text-primary"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />

                <ErrorList errors={errors} />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex h-12 flex-1 cursor-pointer select-none items-center justify-center gap-2 rounded-[10px] border border-white/20 bg-transparent px-5 font-display text-sm font-bold tracking-tight text-foreground transition-all enabled:hover:bg-white/5 enabled:active:scale-[0.99]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !isStep2Valid}
                    className="h-12 flex-[2] cursor-pointer select-none rounded-[10px] bg-primary px-5 font-display text-base font-bold tracking-tight text-black transition-all enabled:hover:brightness-95 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? 'Creando...' : 'Crear cuenta'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

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
        Registrarme con Google
      </a>
    </AuthShell>
  )
}
