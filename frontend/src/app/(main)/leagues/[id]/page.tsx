"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Copy,
  LogOut,
  Trash2,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Header } from "../../../../components/layout/Header";
import { useAuth } from "../../../../hooks/useAuth";
import {
  getLeagueDetail,
  getLeagueLeaderboard,
  generateInvite,
  leaveLeague,
  deleteLeague,
  type LeagueDetail,
  type LeagueLeaderboardEntry,
} from "../../../../api/mini-leagues";
import { ApiError } from "../../../../api/client";
import styles from "./league.module.css";

type ToastTone = "success" | "error";
interface ToastState { tone: ToastTone; title: string; message: string }

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default function LeagueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const leagueId = Array.isArray(params.id) ? params.id[0] : params.id as string;

  const [detail, setDetail] = useState<LeagueDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeagueLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(tone: ToastTone, title: string, message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ tone, title, message });
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }

  useEffect(() => {
    if (!leagueId) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([getLeagueDetail(leagueId), getLeagueLeaderboard(leagueId)])
      .then(([det, lb]) => {
        if (!cancelled) {
          setDetail(det);
          setLeaderboard(lb.results);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err instanceof ApiError && (err.status === 403 || err.status === 401)) {
            router.replace('/leagues');
          } else if (err instanceof ApiError && err.status === 404) {
            setNotFound(true);
          } else {
            setNotFound(true);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [leagueId, router]);

  // Close confirm on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowConfirmDelete(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const currentUserMember = detail?.members.find((m) => m.id === user?.id);
  const isOwner = currentUserMember?.role === 'owner';

  async function handleCopyInvite() {
    if (!detail) return;
    try {
      const resp = await generateInvite(leagueId);
      const inviteUrl = `${window.location.origin}/join?token=${resp.token}`;
      await navigator.clipboard.writeText(inviteUrl);
      showToast("success", "Link copiado", "El link de invitación fue copiado al portapapeles.");
    } catch {
      // Fallback: copy the invite code
      try {
        await navigator.clipboard.writeText(detail.inviteCode);
        showToast("success", "Código copiado", `Código: ${detail.inviteCode}`);
      } catch {
        showToast("error", "Error", "No se pudo copiar al portapapeles.");
      }
    }
  }

  async function handleCopyCode() {
    if (!detail) return;
    try {
      await navigator.clipboard.writeText(detail.inviteCode);
      showToast("success", "Código copiado", `Código: ${detail.inviteCode}`);
    } catch {
      showToast("error", "Error", "No se pudo copiar el código.");
    }
  }

  async function handleLeave() {
    setActionLoading(true);
    try {
      await leaveLeague(leagueId);
      router.push('/leagues');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo abandonar la liga.";
      showToast("error", "Error", msg);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    setActionLoading(true);
    try {
      await deleteLeague(leagueId);
      router.push('/leagues');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo eliminar la liga.";
      showToast("error", "Error", msg);
      setShowConfirmDelete(false);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Liga" subtitle="Cargando…" />
        <main className={styles.main}>
          <div className={styles.loadingState}>Cargando…</div>
        </main>
      </>
    );
  }

  if (notFound || !detail) {
    return (
      <>
        <Header title="Liga no encontrada" subtitle="" />
        <main className={styles.main}>
          <div className={styles.notFound}>
            <p className={styles.notFoundTitle}>Liga no encontrada.</p>
            <Link href="/leagues" className={styles.notFoundLink}>Volver a ligas</Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        title={detail.name}
        subtitle="Clasificación y detalles de la liga."
      />
      <main className={styles.main}>
        {/* Header card */}
        <div className={styles.leagueHeader}>
          <div className={styles.leagueTitleGroup}>
            <h1 className={styles.leagueName}>{detail.name}</h1>
            <div className={styles.inviteRow}>
              <span className={styles.inviteLabel}>Código:</span>
              <button
                className={styles.inviteChip}
                onClick={handleCopyCode}
                title="Copiar código"
              >
                {detail.inviteCode}
                <Copy className={styles.inviteChipIcon} />
              </button>
            </div>
          </div>

          <div className={styles.actionsSection}>
            {isOwner ? (
              <>
                <button className={styles.btnPrimary} onClick={handleCopyInvite}>
                  <LinkIcon className="w-4 h-4" />
                  Copiar link de invitación
                </button>
                <button
                  className={styles.btnDanger}
                  onClick={() => setShowConfirmDelete(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar liga
                </button>
              </>
            ) : (
              <button
                className={styles.btnSecondary}
                onClick={handleLeave}
                disabled={actionLoading}
              >
                <LogOut className="w-4 h-4" />
                {actionLoading ? 'Saliendo…' : 'Abandonar liga'}
              </button>
            )}
          </div>
        </div>

        {/* Ranking table */}
        <div className={styles.rankingSection}>
          <div className={styles.rankingHeader}>
            <h2 className={styles.rankingTitle}>Clasificación</h2>
          </div>

          <div className={styles.tableHead}>
            <div>POS</div>
            <div>PARTICIPANTE</div>
            <div style={{ textAlign: 'right' }}>PUNTOS</div>
          </div>

          {leaderboard.map((entry) => {
            const rank = entry.rank;
            const posClass =
              rank === 1 ? styles.colRank1 :
              rank === 2 ? styles.colRank2 :
              rank === 3 ? styles.colRank3 : '';
            const isCurrentUser = entry.id === user?.id;
            const memberRole = detail.members.find((m) => m.id === entry.id)?.role;

            return (
              <div
                key={entry.id}
                className={`${styles.tableRow} ${isCurrentUser ? styles.rowHighlight : ''}`}
              >
                <div className={`${styles.colRank} ${posClass}`}>{rank}</div>
                <div className={styles.colMember}>
                  <div className={styles.avatar}>
                    {entry.avatar ? (
                      <img src={entry.avatar} alt={entry.name} />
                    ) : (
                      getInitials(entry.name)
                    )}
                  </div>
                  <span className={styles.memberName}>{entry.name}</span>
                  {memberRole === 'owner' && (
                    <span className={styles.ownerBadge}>Owner</span>
                  )}
                  {isCurrentUser && (
                    <span className={styles.youBadge}>TÚ</span>
                  )}
                </div>
                <div className={styles.colPoints}>
                  {entry.totalPoints.toLocaleString('es-AR')}
                </div>
              </div>
            );
          })}

          {leaderboard.length === 0 && (
            <div style={{ padding: '32px 24px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: '0.9rem' }}>
              Sin datos de clasificación todavía.
            </div>
          )}
        </div>

        {/* Confirm delete dialog */}
        {showConfirmDelete && (
          <div
            className={styles.confirmOverlay}
            onClick={(e) => { if (e.target === e.currentTarget) setShowConfirmDelete(false); }}
          >
            <div className={styles.confirmCard}>
              <h2 className={styles.confirmTitle}>Eliminar liga</h2>
              <p className={styles.confirmText}>
                ¿Estás seguro que querés eliminar <strong>{detail.name}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className={styles.confirmActions}>
                <button
                  className={styles.btnSecondary}
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  className={styles.btnDanger}
                  onClick={handleDelete}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            className={`${styles.toast} ${toast.tone === 'success' ? styles.toastSuccess : styles.toastError}`}
          >
            <span className={styles.toastIconWrap}>
              {toast.tone === 'success' ? (
                <CheckCircle2 className={styles.toastIcon} />
              ) : (
                <AlertCircle className={styles.toastIcon} />
              )}
            </span>
            <span className={styles.toastContent}>
              <span className={styles.toastTitle}>{toast.title}</span>
              <span className={styles.toastMessage}>{toast.message}</span>
            </span>
          </div>
        )}
      </main>
    </>
  );
}
