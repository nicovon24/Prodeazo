"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HelpCircle,
  Bell,
  ChevronDown,
  UserCircle,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../hooks/useAuth";
import { useTournamentStore } from "../../store/useTournamentStore";
import styles from "./Header.module.css";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth();
  const { tournaments, activeTournamentId, setActiveTournament } = useTournamentStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className={styles.header}>
      {/* Page title */}
      <div className={styles.titleArea}>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>

      {/* Help button */}
      <button className={styles.iconButton} type="button" title="Ayuda">
        <HelpCircle className={styles.iconButtonIcon} />
        <span>Ayuda</span>
      </button>

      {/* Notifications */}
      <button
        className={styles.iconButton}
        type="button"
        title="Notificaciones"
      >
        <Bell className={styles.iconButtonIcon} />
        <span className={styles.badge}>3</span>
      </button>

      {/* User menu */}
      <div className={styles.dropdownWrapper} ref={dropdownRef}>
        <button
          className={styles.userButton}
          onClick={() => setMenuOpen((v) => !v)}
          type="button"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className={styles.avatar}
            />
          ) : (
            <span className={styles.avatarFallback}>{initials}</span>
          )}
          <span className={styles.userName}>{user?.name ?? "Usuario"}</span>
          <ChevronDown
            className={clsx(styles.chevron, menuOpen && styles.chevronOpen)}
          />
        </button>

        {menuOpen && (
          <div className={styles.dropdown}>
            <Link
              href="/settings"
              className={styles.dropdownItem}
              onClick={() => setMenuOpen(false)}
            >
              <UserCircle className={styles.dropdownItemIcon} />
              Ajustes de cuenta
            </Link>
            <button
              className={clsx(styles.dropdownItem, styles.dropdownItemDanger)}
              onClick={handleLogout}
              type="button"
            >
              <LogOut className={styles.dropdownItemIcon} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
