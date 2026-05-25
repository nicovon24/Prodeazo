"use client";

import { useState } from "react";
import { Link2, Copy, Check, RefreshCw } from "lucide-react";
import { generateInvite } from "../api/mini-leagues";
import { ApiError } from "../api/client";
import styles from "./InvitePanel.module.css";

interface Props {
  leagueId: string
}

function formatExpiry(isoDate: string) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

export function InvitePanel({ leagueId }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteUrl = token
    ? `${window.location.origin}/join?token=${token}`
    : null;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await generateInvite(leagueId);
      setToken(res.token);
      setExpiresAt(res.expiresAt);
      setCopied(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo generar el link.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Link2 className="w-5 h-5" />
        <span className={styles.title}>Invitar amigos</span>
      </div>

      {!token ? (
        <div className={styles.empty}>
          <p className={styles.desc}>Generá un link de invitación para compartir con tus amigos. Expira en 7 días.</p>
          <button
            type="button"
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generando..." : "Generar link de invitación"}
          </button>
        </div>
      ) : (
        <div className={styles.linkBox}>
          <div className={styles.urlRow}>
            <span className={styles.url}>{inviteUrl}</span>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopy}
              aria-label="Copiar link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {expiresAt && (
            <span className={styles.expiry}>Expira el {formatExpiry(expiresAt)}</span>
          )}
          <button
            type="button"
            className={styles.renewBtn}
            onClick={handleGenerate}
            disabled={loading}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {loading ? "Renovando..." : "Renovar link"}
          </button>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
