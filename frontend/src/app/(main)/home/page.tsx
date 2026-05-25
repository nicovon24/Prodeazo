"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Users,
  BarChart2,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { Header } from "../../../components/layout/Header";
import { fetchDashboardMe, type DashboardMe } from "../../../api/dashboard";
import styles from "./home.module.css";

function formatCount(n: number): string {
  return n.toLocaleString("es-AR");
}

export default function HomePage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardMe | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingStats(true);
    fetchDashboardMe()
      .then((data) => {
        if (!cancelled) setDashboard(data);
      })
      .catch(() => {
        if (!cancelled) setDashboard(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingStats(false);
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

        {/* Content Panels — paso 3: datos reales */}
        <div className={styles.panelsRow}>
          {/* Próximos Partidos */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <CalendarDays className="w-5 h-5 text-primary" />
              Próximos Partidos
            </div>
            <div className={styles.panelList}>
              <Link href="/fixture" className={styles.matchCard}>
                <div className={styles.matchTime}>
                  <span className={styles.matchTimeLabel}>Hoy</span>
                  <span className={styles.matchTimeValue}>16:00</span>
                  <span className={styles.matchKickoff}>Para el kickoff</span>
                </div>
                <div className={styles.matchTeams}>
                  <div className={styles.matchTeamsRow}>
                    <div className={`${styles.team} ${styles.teamRight}`}>
                      Argentina {"\u{1F1E6}\u{1F1F7}"}
                    </div>
                    <span className={styles.vs}>VS</span>
                    <div className={`${styles.team} ${styles.teamLeft}`}>
                      {"\u{1F1F8}\u{1F1E6}"} Arabia Saudita
                    </div>
                  </div>
                  <div className={styles.stadium}>Lusail Stadium, Lusail</div>
                </div>
                <ChevronRight className={styles.matchChevron} />
              </Link>
              
              <Link href="/fixture" className={styles.matchCard}>
                <div className={styles.matchTime}>
                  <span className={styles.matchTimeLabel}>Hoy</span>
                  <span className={styles.matchTimeValue}>19:00</span>
                  <span className={styles.matchKickoff}>Para el kickoff</span>
                </div>
                <div className={styles.matchTeams}>
                  <div className={styles.matchTeamsRow}>
                    <div className={`${styles.team} ${styles.teamRight}`}>
                      Francia {"\u{1F1EB}\u{1F1F7}"}
                    </div>
                    <span className={styles.vs}>VS</span>
                    <div className={`${styles.team} ${styles.teamLeft}`}>
                      {"\u{1F1E6}\u{1F1FA}"} Australia
                    </div>
                  </div>
                  <div className={styles.stadium}>Al Janoub Stadium, Al Wakrah</div>
                </div>
                <ChevronRight className={styles.matchChevron} />
              </Link>

              <Link href="/fixture" className={styles.matchCard}>
                <div className={styles.matchTime}>
                  <span className={styles.matchTimeLabel}>Mañana</span>
                  <span className={styles.matchTimeValue}>13:00</span>
                  <span className={styles.matchKickoff}>Para el kickoff</span>
                </div>
                <div className={styles.matchTeams}>
                  <div className={styles.matchTeamsRow}>
                    <div className={`${styles.team} ${styles.teamRight}`}>
                      Brasil {"\u{1F1E7}\u{1F1F7}"}
                    </div>
                    <span className={styles.vs}>VS</span>
                    <div className={`${styles.team} ${styles.teamLeft}`}>
                      {"\u{1F1F7}\u{1F1F8}"} Serbia
                    </div>
                  </div>
                  <div className={styles.stadium}>Stadium 974, Doha</div>
                </div>
                <ChevronRight className={styles.matchChevron} />
              </Link>
            </div>
            <div className={styles.panelFooter}>
              <Link href="/fixture" className={styles.panelFooterBtn}>
                Ver fixture completo
              </Link>
            </div>
          </div>

          {/* Pending Predictions */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <CheckCircle className="w-5 h-5 text-primary" />
              Partidos pendientes de predicción
              <span className={styles.panelHeaderBadge}>5</span>
            </div>
            <div className={styles.panelList}>
              <div className={styles.predCard}>
                <span className={styles.predTime}>13 JUN - 10:00</span>
                <div className={styles.predTeams}>
                  <div className={`${styles.predTeam} ${styles.teamRight}`}>
                    EE.UU. {"\u{1F1FA}\u{1F1F8}"}
                  </div>
                  <span className={styles.vs}>VS</span>
                  <div className={`${styles.predTeam} ${styles.teamLeft}`}>
                    {"\u{1F1EC}\u{1F1E7}"} Gales
                  </div>
                </div>
                <Link href="/predictions" className={styles.predBtn}>Predecir</Link>
              </div>

              <div className={styles.predCard}>
                <span className={styles.predTime}>13 JUN - 16:00</span>
                <div className={styles.predTeams}>
                  <div className={`${styles.predTeam} ${styles.teamRight}`}>
                    Irán {"\u{1F1EE}\u{1F1F7}"}
                  </div>
                  <span className={styles.vs}>VS</span>
                  <div className={`${styles.predTeam} ${styles.teamLeft}`}>
                    {"\u{1F1F2}\u{1F1E6}"} Marruecos
                  </div>
                </div>
                <Link href="/predictions" className={styles.predBtn}>Predecir</Link>
              </div>

              <div className={styles.predCard}>
                <span className={styles.predTime}>14 JUN - 13:00</span>
                <div className={styles.predTeams}>
                  <div className={`${styles.predTeam} ${styles.teamRight}`}>
                    Alemania {"\u{1F1E9}\u{1F1EA}"}
                  </div>
                  <span className={styles.vs}>VS</span>
                  <div className={`${styles.predTeam} ${styles.teamLeft}`}>
                    {"\u{1F1EF}\u{1F1F5}"} Japón
                  </div>
                </div>
                <Link href="/predictions" className={styles.predBtn}>Predecir</Link>
              </div>

              <div className={styles.predCard}>
                <span className={styles.predTime}>14 JUN - 16:00</span>
                <div className={styles.predTeams}>
                  <div className={`${styles.predTeam} ${styles.teamRight}`}>
                    Bélgica {"\u{1F1E7}\u{1F1EA}"}
                  </div>
                  <span className={styles.vs}>VS</span>
                  <div className={`${styles.predTeam} ${styles.teamLeft}`}>
                    {"\u{1F1ED}\u{1F1F7}"} Croacia
                  </div>
                </div>
                <Link href="/predictions" className={styles.predBtn}>Predecir</Link>
              </div>
            </div>
            <div className={styles.panelFooter}>
              <Link href="/predictions" className={styles.panelFooterBtn}>
                Ver todos los pendientes
              </Link>
            </div>
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
