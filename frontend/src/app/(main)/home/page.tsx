"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Users,
  BarChart2,
  CalendarDays,
  CheckCircle,
  ArrowRight,
  History,
  Target,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { Header } from "../../../components/layout/Header";
import {
  fetchDashboardMe,
  fetchDashboardPanels,
  type DashboardMe,
  type DashboardPanels,
} from "../../../api/dashboard";
import {
  PendingMatchRow,
  RecentResultRow,
  UpcomingMatchRow,
} from "@/components/home/MatchPanelRows";
import styles from "./home.module.css";

function formatCount(n: number): string {
  return n.toLocaleString("es-AR");
}

export default function HomePage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardMe | null>(null);
  const [panels, setPanels] = useState<DashboardPanels | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPanels, setLoadingPanels] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingStats(true);
    setLoadingPanels(true);

    Promise.all([fetchDashboardMe(), fetchDashboardPanels()])
      .then(([stats, panelData]) => {
        if (!cancelled) {
          setDashboard(stats);
          setPanels(panelData);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDashboard(null);
          setPanels(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingStats(false);
          setLoadingPanels(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const participantCount = dashboard?.participantCount ?? 0;
  const globalRank = dashboard?.globalRank ?? 1;
  const totalPoints = dashboard?.totalPoints ?? 0;
  const correctPredictions = dashboard?.correctPredictions ?? 0;
  const precision = dashboard?.precision ?? 0;

  return (
    <>
      <Header
        title="Inicio"
        subtitle={`Bienvenido de vuelta, ${user?.name ?? "Usuario"}. Este es tu resumen.`}
      />
      <main className={styles.main}>
        {/* Top Stat Cards */}
        <div className={styles.statsRow}>
          {/* Global Pos */}
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <Globe className={styles.statCardHeaderIcon} />
              Mi posición global
            </div>
            <div className={styles.statCardBody}>
              <div>
                <div className={styles.statMainValue}>
                  {loadingStats ? "—" : `${globalRank}°`}
                </div>
                <div className={styles.statSubLabel}>
                  {loadingStats
                    ? "Cargando…"
                    : `de ${formatCount(participantCount)} participantes`}
                </div>
              </div>
              <div className={styles.statNeutralIndicator}>
                <span>0</span>
                <div className={styles.statNeutralLabel}>vs. semana pasada</div>
              </div>
            </div>
            <div className={styles.statCardFooter}>
              <Link href="/rankings" className={styles.statCardButton}>
                Ver ranking
              </Link>
            </div>
          </div>

          {/* Leagues Pos */}
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <Users className={styles.statCardHeaderIcon} />
              Mi posición en ligas
            </div>
            <div className={styles.statCardBody}>
              <p className={styles.leagueEmptyText}>
                Aún no te uniste a ninguna liga.{" "}
                <Link href="/leagues" className={styles.leagueEmptyLink}>
                  ¡Busca una liga!
                </Link>
              </p>
            </div>
            <div className={styles.statCardFooter}>
              <Link href="/leagues" className={styles.statCardButton}>
                Ver ligas
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <BarChart2 className={styles.statCardHeaderIcon} />
              Mis estadísticas
            </div>
            <div className={styles.statCardBody}>
              <div className={styles.statsGrid}>
                <div className={styles.statsGridItem}>
                  <span className={styles.statsGridLabel}>Puntos Totales</span>
                  <span className={styles.statsGridValue}>
                    {loadingStats ? "—" : formatCount(totalPoints)}
                  </span>
                </div>
                <div className={styles.statsGridItem}>
                  <span className={styles.statsGridLabel}>Partidos Acertados</span>
                  <span className={styles.statsGridValue}>
                    {loadingStats ? "—" : formatCount(correctPredictions)}
                  </span>
                </div>
                <div className={styles.statsGridItem}>
                  <span className={styles.statsGridLabel}>Precisión</span>
                  <span className={styles.statsGridValue}>
                    {loadingStats ? "—" : `${precision}%`}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.statCardFooter}>
              <Link href="/rankings" className={styles.statCardButton}>
                Ver detalles
              </Link>
            </div>
          </div>
        </div>

        {/* Paneles centrales — datos reales */}
        <div className={styles.panelsRow}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <History className="w-5 h-5 text-primary" />
              Últimos resultados
            </div>
            <div className={styles.panelList}>
              {loadingPanels ? (
                <p className={styles.panelLoading}>Cargando…</p>
              ) : panels?.recentResults.length ? (
                panels.recentResults.map((m) => (
                  <RecentResultRow key={m.fixtureId} match={m} />
                ))
              ) : (
                <div className={styles.panelEmpty}>
                  <Target className={styles.panelEmptyIcon} />
                  <p className={styles.panelEmptyTitle}>
                    ¡Aún no participaste en ninguna predicción! ¿Qué estás esperando?
                  </p>
                  <Link href="/predictions" className={styles.panelEmptyLink}>
                    Predecí un partido
                  </Link>
                </div>
              )}
            </div>
            {(panels?.recentResults.length ?? 0) > 0 && (
              <div className={styles.panelFooter}>
                <Link href="/predictions" className={styles.panelFooterBtn}>
                  Ir a mis predicciones
                </Link>
              </div>
            )}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <CalendarDays className="w-5 h-5 text-primary" />
              Próximos con tu predicción
            </div>
            <div className={styles.panelList}>
              {loadingPanels ? (
                <p className={styles.panelLoading}>Cargando…</p>
              ) : panels?.upcomingWithPrediction.length ? (
                panels.upcomingWithPrediction.map((m) => (
                  <UpcomingMatchRow key={m.fixtureId} match={m} />
                ))
              ) : (
                <div className={styles.panelEmpty}>
                  <CalendarDays className={styles.panelEmptyIcon} />
                  <p className={styles.panelEmptyTitle}>
                    No tenés predicciones en partidos próximos o en vivo.
                  </p>
                </div>
              )}
            </div>
            {(panels?.upcomingWithPrediction.length ?? 0) > 0 && (
              <div className={styles.panelFooter}>
                <Link href="/fixture" className={styles.panelFooterBtn}>
                  Ver fixture completo
                </Link>
              </div>
            )}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <CheckCircle className="w-5 h-5 text-primary" />
              Pendientes de predicción
              {!loadingPanels && (panels?.pendingPredictions.length ?? 0) > 0 && (
                <span className={styles.panelHeaderBadge}>
                  {panels!.pendingPredictions.length}
                </span>
              )}
            </div>
            <div className={styles.panelList}>
              {loadingPanels ? (
                <p className={styles.panelLoading}>Cargando…</p>
              ) : panels?.pendingPredictions.length ? (
                panels.pendingPredictions.map((m) => (
                  <div key={m.fixtureId} className={styles.predCardWrap}>
                    <PendingMatchRow match={m} />
                    <Link href="/predictions" className={styles.predBtn}>
                      Predecir
                    </Link>
                  </div>
                ))
              ) : (
                <div className={styles.panelEmpty}>
                  <CheckCircle className={styles.panelEmptyIcon} />
                  <p className={styles.panelEmptyTitle}>
                    ¡Ya no te quedan partidos por predecir!
                  </p>
                </div>
              )}
            </div>
            {(panels?.pendingPredictions.length ?? 0) > 0 && (
              <div className={styles.panelFooter}>
                <Link href="/predictions" className={styles.panelFooterBtn}>
                  Ver todos los pendientes
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* CTA Banners */}
        <div className={styles.ctaRow}>
          <Link href="/predictions" className={`${styles.ctaCard} ${styles.ctaCardGreen}`}>
            <h3 className={styles.ctaTitle}>Mi Prode</h3>
            <p className={styles.ctaDesc}>Hacé tus predicciones y seguí tu progreso.</p>
            <div className={styles.ctaArrow}><ArrowRight className="w-6 h-6" /></div>
            <img src="/logo-mundial-2026.svg" className={styles.ctaBgDecoration} alt="" />
          </Link>
          
          <Link href="/rankings" className={`${styles.ctaCard} ${styles.ctaCardBlue}`}>
            <h3 className={styles.ctaTitle}>Rankings</h3>
            <p className={styles.ctaDesc}>Compará tu posición con otros participantes.</p>
            <div className={styles.ctaArrow}><ArrowRight className="w-6 h-6" /></div>
            <BarChart2 className={styles.ctaBgDecoration} />
          </Link>

          <Link href="/leagues" className={`${styles.ctaCard} ${styles.ctaCardRed}`}>
            <h3 className={styles.ctaTitle}>Ligas</h3>
            <p className={styles.ctaDesc}>Creá o unite a ligas y competí con tus amigos.</p>
            <div className={styles.ctaArrow}><ArrowRight className="w-6 h-6" /></div>
            <Users className={styles.ctaBgDecoration} />
          </Link>
        </div>
      </main>
    </>
  );
}
