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
import clsx from "clsx";
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
        <main className="flex-1 px-4 md:px-8 pt-4 md:pt-6 pb-6 md:pb-8 flex flex-col gap-6 relative">
          <div className="flex items-center justify-center py-20 px-6 text-white/50 text-[0.95rem]">
            Cargando…
          </div>
        </main>
      </>
    );
  }

  if (notFound || !detail) {
    return (
      <>
        <Header title="Liga no encontrada" subtitle="" />
        <main className="flex-1 px-4 md:px-8 pt-4 md:pt-6 pb-6 md:pb-8 flex flex-col gap-6 relative">
          <div className="flex flex-col items-center gap-4 py-20 px-6 text-center">
            <p className="text-[1.2rem] font-bold text-white/70">Liga no encontrada.</p>
            <Link href="/leagues" className="text-[0.9rem] text-primary no-underline font-semibold">
              Volver a ligas
            </Link>
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
      <main className="flex-1 px-4 md:px-8 pt-4 md:pt-6 pb-6 md:pb-8 flex flex-col gap-6 relative">
        {/* Header card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 md:px-8 py-5 md:py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[1.6rem] font-extrabold text-white leading-[1.1]">
              {detail.name}
            </h1>
            <div className="flex items-center gap-2.5">
              <span className="text-[0.7rem] font-bold uppercase text-white/40 tracking-[0.05em]">Código:</span>
              <button
                className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-1.5 font-mono text-[0.9rem] font-bold text-primary cursor-pointer transition-colors duration-200 hover:bg-primary/[0.08]"
                onClick={handleCopyCode}
                title="Copiar código"
              >
                {detail.inviteCode}
                <Copy className="w-3.5 h-3.5 text-white/50" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {isOwner ? (
              <>
                <button
                  className="px-5 py-2.5 bg-primary border-none rounded-lg text-black text-[0.9rem] font-bold cursor-pointer transition-opacity duration-200 flex items-center gap-2 hover:opacity-90"
                  onClick={handleCopyInvite}
                >
                  <LinkIcon className="w-4 h-4" />
                  Copiar link de invitación
                </button>
                <button
                  className="px-5 py-2.5 bg-transparent border border-[rgba(213,2,4,0.4)] rounded-lg text-[#ff6b6b] text-[0.9rem] font-semibold cursor-pointer transition-colors duration-200 flex items-center gap-2 hover:bg-[rgba(213,2,4,0.08)]"
                  onClick={() => setShowConfirmDelete(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar liga
                </button>
              </>
            ) : (
              <button
                className="px-5 py-2.5 bg-transparent border border-white/[0.15] rounded-lg text-white/70 text-[0.9rem] font-semibold cursor-pointer transition-colors duration-200 flex items-center gap-2 hover:bg-white/[0.08]"
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
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
          <div className="px-4 md:px-6 py-5 border-b border-white/[0.05]">
            <h2 className="text-[1.05rem] font-bold text-white">Clasificación</h2>
          </div>

          <div className="overflow-x-auto">
          <div className="min-w-[360px]">
          <div className="grid [grid-template-columns:64px_1fr_120px] px-4 md:px-6 py-2.5 text-[0.65rem] font-bold text-white/35 uppercase tracking-[0.05em] border-b border-white/[0.04]">
            <div>POS</div>
            <div>PARTICIPANTE</div>
            <div style={{ textAlign: 'right' }}>PUNTOS</div>
          </div>

          {leaderboard.map((entry) => {
            const rank = entry.rank;
            const posColor =
              rank === 1 ? 'text-[#FFCC00]' :
              rank === 2 ? 'text-[#C0C0C0]' :
              rank === 3 ? 'text-[#CD7F32]' : 'text-white/80';
            const isCurrentUser = entry.id === user?.id;
            const memberRole = detail.members.find((m) => m.id === entry.id)?.role;

            return (
              <div
                key={entry.id}
                className={clsx(
                  "grid [grid-template-columns:64px_1fr_120px] px-4 md:px-6 py-3.5 items-center border-b border-white/[0.02] last:border-b-0 transition-colors duration-[150ms] hover:bg-white/[0.03]",
                  isCurrentUser ? "bg-primary/[0.05] hover:bg-primary/[0.08]" : ""
                )}
              >
                <div className={clsx("font-display text-[1.2rem] font-extrabold", posColor)}>
                  {rank}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-[0.75rem] font-semibold overflow-hidden shrink-0">
                    {entry.avatar ? (
                      <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(entry.name)
                    )}
                  </div>
                  <span className="text-[0.95rem] font-semibold text-white">{entry.name}</span>
                  {memberRole === 'owner' && (
                    <span className="text-[0.6rem] font-bold bg-[rgba(255,204,0,0.15)] text-[#FFCC00] border border-[rgba(255,204,0,0.3)] px-[7px] py-[2px] rounded uppercase tracking-[0.04em]">
                      Owner
                    </span>
                  )}
                  {isCurrentUser && (
                    <span className="text-[0.6rem] font-bold bg-primary text-black px-[7px] py-[2px] rounded uppercase tracking-[0.04em]">
                      TÚ
                    </span>
                  )}
                </div>
                <div className="font-display text-[1.1rem] font-bold text-white text-right">
                  {entry.totalPoints.toLocaleString('es-AR')}
                </div>
              </div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="px-6 py-8 text-white/40 text-center text-[0.9rem]">
              Sin datos de clasificación todavía.
            </div>
          )}
          </div>
          </div>
        </div>

        {/* Confirm delete dialog */}
        {showConfirmDelete && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-6"
            onClick={(e) => { if (e.target === e.currentTarget) setShowConfirmDelete(false); }}
          >
            <div className="bg-[#111217] border border-[rgba(213,2,4,0.3)] rounded-2xl p-8 w-full max-w-[400px] flex flex-col gap-4">
              <h2 className="text-[1.1rem] font-extrabold text-white">Eliminar liga</h2>
              <p className="text-[0.9rem] text-white/60 leading-[1.5]">
                ¿Estás seguro que querés eliminar <strong>{detail.name}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-end mt-2">
                <button
                  className="px-5 py-2.5 bg-transparent border border-white/[0.15] rounded-lg text-white/70 text-[0.9rem] font-semibold cursor-pointer transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:not-disabled:bg-white/[0.08]"
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  className="px-5 py-2.5 bg-transparent border border-[rgba(213,2,4,0.4)] rounded-lg text-[#ff6b6b] text-[0.9rem] font-semibold cursor-pointer transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:not-disabled:bg-[rgba(213,2,4,0.08)]"
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
            className={clsx(
              "fixed z-[300] flex items-start gap-3.5 p-4 rounded-[10px] shadow-[0_22px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset] overflow-hidden",
              "md:top-7 md:right-7 md:w-[min(420px,calc(100vw-56px))]",
              "max-md:bottom-4 max-md:left-4 max-md:right-4 max-md:w-auto",
              toast.tone === 'success'
                ? "bg-[#111a12] border border-[rgba(0,206,23,0.32)] text-[#f1fff5] toast-bar-success"
                : "bg-[#1e1112] border border-[rgba(213,2,4,0.36)] text-[#fff0f0] toast-bar-error"
            )}
          >
            <span className="shrink-0 mt-0.5">
              {toast.tone === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-[0.9rem] font-bold">{toast.title}</span>
              <span className="text-[0.8rem] opacity-85">{toast.message}</span>
            </span>
          </div>
        )}
      </main>
    </>
  );
}
