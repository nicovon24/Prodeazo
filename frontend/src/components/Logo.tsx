import Link from 'next/link'

export const LOGO_SRC = '/logo-mundial-2026.svg'

interface LogoProps {
  className?: string
  simplified?: boolean
}

export function Logo({ className = '', simplified = false }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-0 group transition-opacity hover:opacity-80 pl-2 sm:pl-4 md:pl-8 ${className}`}>
      <span className="relative block h-10 w-11 shrink-0 -ml-2 sm:h-14 sm:w-16 sm:-ml-1">
        <img
          src={LOGO_SRC}
          alt=""
          className="h-full w-full object-contain object-left select-none"
        />
      </span>
      <div className={`flex flex-col justify-center leading-none ${simplified ? 'hidden min-[360px]:flex' : 'flex'}`}>
        <span className="font-display text-xs font-bold uppercase tracking-[-0.06em] text-foreground sm:text-base select-none">
          PRODEAZO
        </span>
        <span className="mt-0.5 font-display text-[10px] font-bold tracking-[-0.06em] text-green-normal sm:mt-1 sm:text-xs select-none">
          FIFA 2026™
        </span>
      </div>
    </Link>
  )
}
