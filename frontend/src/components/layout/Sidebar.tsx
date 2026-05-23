"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  CheckCircle,
  BarChart3,
  Users,
  BookOpen,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { label: "Inicio", href: "/home", icon: Home },
  { label: "Fixture", href: "/fixture", icon: CalendarDays },
  { label: "Predicciones", href: "/predictions", icon: CheckCircle },
  { label: "Rankings", href: "/rankings", icon: BarChart3 },
  { label: "Ligas", href: "/leagues", icon: Users },
  { label: "Reglas", href: "/rules", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoArea}>
        <img
          src="/logo-mundial-2026.svg"
          alt="Prodeazo"
          className={styles.logoImage}
        />
        <span className={styles.logoText}>
          <span className={styles.logoTitle}>Prodeazo</span>
          <span className={styles.logoSubtitle}>FIFA 2026™</span>
        </span>
      </div>

      {/* Main navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(styles.navLink, isActive && styles.navLinkActive)}
            >
              <Icon className={styles.navIcon} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <Link
          href="/settings"
          className={clsx(
            styles.navLink,
            pathname === "/settings" && styles.navLinkActive
          )}
        >
          <Settings className={styles.navIcon} />
          Configuración
        </Link>

        <div className={styles.footerLinks}>
          <a href="#" className={styles.footerLink}>
            Términos y Condiciones
          </a>
          <a href="#" className={styles.footerLink}>
            Política de Privacidad
          </a>
        </div>
      </div>
    </aside>
  );
}
