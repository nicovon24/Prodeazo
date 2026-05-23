import type { InputHTMLAttributes, ReactNode } from 'react'

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: ReactNode
  action?: ReactNode
  hasError?: boolean
}

export function AuthInput({ label, icon, action, hasError, className = '', ...props }: AuthInputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-foreground/90">{label}</span>
      <span className="relative block">
        <input
          {...props}
          className={`h-12 w-full rounded-[10px] border bg-white/5 px-4 pr-12 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/35 ${hasError ? 'border-[#fca5a5]' : 'border-white/15 focus:border-primary'} ${className}`}
        />
        {action ? (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">{action}</span>
        ) : (
          icon && <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-foreground">{icon}</span>
        )}
      </span>
    </label>
  )
}

export function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.04H12v3.86h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.35z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.23-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.9a6.01 6.01 0 0 1 0-3.8V7.51H3.06a10 10 0 0 0 0 8.98L6.4 13.9z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.79.51 3.83 1.5l2.86-2.86C16.96 3.01 14.7 2 12 2a10 10 0 0 0-8.94 5.51L6.4 10.1C7.19 7.74 9.4 5.98 12 5.98z"
      />
    </svg>
  )
}

interface ErrorListProps {
  errors: string[]
}

export function ErrorList({ errors }: ErrorListProps) {
  if (errors.length === 0) return null

  return (
    <div className="rounded-[10px] border border-white/15 bg-black/60 px-4 py-3 text-[13px] leading-5 text-[#fca5a5]">
      {errors.length === 1 ? (
        <p>{errors[0]}</p>
      ) : (
        <ul className="list-disc space-y-1 pl-4">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
