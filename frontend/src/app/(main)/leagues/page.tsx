"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Trophy,
  Star,
  Target,
  Plus,
  ArrowRight,
  ShieldHalf,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Header } from "../../../components/layout/Header";
import {
  getMyLeagues,
  createLeague,
  joinByCode,
  joinByToken,
  type MyLeagueRow,
} from "../../../api/mini-leagues";
import { ApiError } from "../../../api/client";
import styles from "./leagues.module.css";

type ToastTone = "success" | "error";
interface ToastState { tone: ToastTone; title: string; message: string }

export default function LeaguesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Mis Ligas");
  const [myLeagues, setMyLeagues] = useState<MyLeagueRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Join modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(tone: ToastTone, title: string, message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ tone, title, message });
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }

  function loadLeagues() {
    let cancelled = false;
    setLoading(true);
    getMyLeagues()
      .then((data) => { if (!cancelled) setMyLeagues(data.results); })
      .catch(() => { if (!cancelled) setMyLeagues([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }

  useEffect(() => {
    const cancel = loadLeagues();
    return cancel;
  }, []);

  // Close modals on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowCreateModal(false);
        setShowJoinModal(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function handleCreate() {
    if (!createName.trim() || createName.trim().length > 50) {
      setCreateError("El nombre debe tener entre 1 y 50 caracteres.");
      return;
    }
    setCreateError("");
    setCreateLoading(true);
    try {
      await createLeague(createName.trim());
      setShowCreateModal(false);
      setCreateName("");
      loadLeagues();
      showToast("success", "Liga creada", "Tu liga fue creada exitosamente.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo crear la liga.";
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  }

  function extractToken(input: string): { token: string } | { error: string } | null {
    try {
      const url = new URL(input)
      const t = url.searchParams.get("token")
      if (t) return { token: t }
      // Valid URL but missing token param — don't fall through to length heuristic
      return { error: "El link no contiene un token de invitación válido." }
    } catch {
      // Not a URL — let the caller decide based on length
      return null
    }
  }

  async function handleJoin() {
    const raw = joinCode.trim();
    if (!raw) {
      setJoinError("Ingresá el código o el link de invitación.");
      return;
    }
    setJoinError("");
    setJoinLoading(true);
    try {
      const extracted = extractToken(raw);
      if (extracted && "error" in extracted) {
        setJoinError(extracted.error);
        setJoinLoading(false);
        return;
      }

      const token = extracted?.token ?? null;
      if (token) {
        // Full URL pasted — join by token
        await joinByToken(token);
      } else if (raw.length > 8) {
        // Raw token (CUID2, no URL wrapper)
        await joinByToken(raw);
      } else {
        // Short invite code (e.g. "ABC12345")
        await joinByCode(raw);
      }
      setShowJoinModal(false);
      setJoinCode("");
      loadLeagues();
      showToast("success", "Te uniste a la liga", "Ahora sos parte de la liga.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setJoinError("Ya sos miembro de esta liga.");
      } else if (err instanceof ApiError && err.status === 410) {
        setJoinError("Este link de invitación venció. Pedile uno nuevo al dueño de la liga.");
      } else if (err instanceof ApiError && err.status === 404) {
        setJoinError("Código o link inválido.");
      } else {
        const msg = err instanceof ApiError ? err.message : "No se pudo unir a la liga.";
        setJoinError(msg);
      }
    } finally {
      setJoinLoading(false);
    }
  }

  return (
    <>
      <Header
        title="Ligas"
        subtitle="Competí contra tus amigos y otros participantes."
      />
      <main className={styles.main}>
        {/* Top Stat Cards */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}><Users className="w-6 h-6" /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Ligas Activas</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>
                  {loading ? '—' : myLeagues.length}
                </span>
                <span className={styles.statSub}>de 5 posibles</span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}><Trophy className="w-6 h-6" /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Posición Promedio</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>—</span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}><Star className="w-6 h-6" /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Puntos en Ligas</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>—</span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}><Target className="w-6 h-6" /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Precisión Promedio</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>—</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'Mis Ligas' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('Mis Ligas')}
          >
            Mis Ligas
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'Explorar Ligas' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('Explorar Ligas')}
          >
            Explorar Ligas
          </button>
        </div>

        {activeTab === 'Mis Ligas' && (
          <div className={styles.splitView}>
            {/* Left Col - My Leagues */}
            <div className={styles.leftCol}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Mis Ligas</h2>

              <div className={styles.myLeaguesList}>
                {loading ? (
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Cargando…</p>
                ) : myLeagues.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Users className={styles.emptyStateIcon} />
                    <p className={styles.emptyStateText}>No tenés ligas todavía.</p>
                    <p className={styles.emptyStateSubtext}>Creá una liga o unite a una con un código.</p>
                  </div>
                ) : (
                  myLeagues.map(({ league, role }) => (
                    <div key={league.id} className={styles.leagueRow}>
                      <div className={styles.leagueHexIcon} style={{ color: "var(--color-primary)" }}>
                        <Users className="w-6 h-6" />
                      </div>
                      <div className={styles.leagueInfo}>
                        <div className={styles.leagueNameRow}>
                          <span className={styles.leagueName}>{league.name}</span>
                          {role === 'owner' && <Trophy className={styles.leagueCrown} />}
                        </div>
                        <span className={styles.leagueMembers}>
                          {role === 'owner' ? 'Propietario' : 'Miembro'}
                        </span>
                      </div>

                      <button
                        className={styles.leagueViewBtn}
                        onClick={() => router.push('/leagues/' + league.id)}
                      >
                        Ver liga
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Col - CTAs */}
            <div className={styles.rightCol}>
              <button
                className={`${styles.actionCard} ${styles.actionCardGreen}`}
                onClick={() => { setCreateName(""); setCreateError(""); setShowCreateModal(true); }}
              >
                <div className={styles.actionContent}>
                  <h3 className={styles.actionTitle}>Crear nueva liga</h3>
                  <p className={styles.actionDesc}>Creá tu propia liga y desafiá a tus amigos.</p>
                </div>
                <div className={styles.actionBtnIcon}><Plus className="w-6 h-6" /></div>
                <Users className={styles.actionBgIcon} />
              </button>

              <button
                className={`${styles.actionCard} ${styles.actionCardBlue}`}
                onClick={() => { setJoinCode(""); setJoinError(""); setShowJoinModal(true); }}
              >
                <div className={styles.actionContent}>
                  <h3 className={styles.actionTitle}>Unirse a una liga</h3>
                  <p className={styles.actionDesc}>¿Tenés un código de liga? Unite y empezá a competir.</p>
                </div>
                <div className={styles.actionBtnIcon}><ArrowRight className="w-6 h-6" /></div>
                <Users className={styles.actionBgIcon} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Explorar Ligas' && (
          <div className={styles.exploreComingSoon}>
            <ShieldHalf className={styles.exploreComingSoonIcon} />
            <h3 className={styles.exploreComingSoonTitle}>Explorar ligas próximamente</h3>
            <p className={styles.exploreComingSoonText}>
              Por ahora podés unirte a ligas privadas usando su código de invitación.
            </p>
            <button
              className={styles.exploreComingSoonBtn}
              onClick={() => { setJoinCode(""); setJoinError(""); setShowJoinModal(true); }}
            >
              Unirse con código
            </button>
          </div>
        )}

        {/* Modal — Crear liga */}
        {showCreateModal && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
          >
            <div className={styles.modalCard}>
              <h2 className={styles.modalTitle}>Crear liga</h2>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Nombre de la liga</label>
                <input
                  className={styles.modalInput}
                  type="text"
                  placeholder="Ej: Amigos del trabajo"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  maxLength={50}
                  autoFocus
                />
                {createError && (
                  <span className={styles.modalError}>{createError}</span>
                )}
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.modalBtnSecondary}
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                >
                  Cancelar
                </button>
                <button
                  className={styles.modalBtnPrimary}
                  onClick={handleCreate}
                  disabled={createLoading}
                >
                  {createLoading ? 'Creando…' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal — Unirse */}
        {showJoinModal && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => { if (e.target === e.currentTarget) setShowJoinModal(false); }}
          >
            <div className={styles.modalCard}>
              <h2 className={styles.modalTitle}>Unirse a una liga</h2>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Código o link de invitación</label>
                <input
                  className={styles.modalInput}
                  type="text"
                  placeholder="Código (ABC12345) o link de invitación"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  autoFocus
                />
                {joinError && (
                  <span className={styles.modalError}>{joinError}</span>
                )}
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.modalBtnSecondary}
                  onClick={() => setShowJoinModal(false)}
                  disabled={joinLoading}
                >
                  Cancelar
                </button>
                <button
                  className={styles.modalBtnPrimary}
                  onClick={handleJoin}
                  disabled={joinLoading}
                >
                  {joinLoading ? 'Uniéndose…' : 'Unirse'}
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
