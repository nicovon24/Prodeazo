"use client";

import Link from "next/link";
import {
  Globe,
  Users,
  BarChart2,
  CalendarDays,
  CheckCircle,
  ChevronUp,
  ChevronRight,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { Header } from "../../../components/layout/Header";
import { useTournamentStore } from "../../../store/useTournamentStore";
import styles from "./home.module.css";

export default function HomePage() {
  const { user } = useAuth();
  const { tournaments, activeTournamentId, setActiveTournament } = useTournamentStore();
  const activeTournament = tournaments.find(t => t.id === activeTournamentId);

  return (
    <>
      <Header
        title="Inicio"
        subtitle={`Bienvenido de vuelta, ${user?.name ?? "Usuario"}. Este es tu resumen.`}
      />
      <main className={styles.main}>
        {/* Tournament selector */}
        {tournaments.length > 1 && (
          <div className={styles.tournamentBar}>
            <span className={styles.tournamentBarLabel}>
              <Trophy className={styles.tournamentBarIcon} />
              Torneo activo:
            </span>
            <div className={styles.tournamentTabs}>
              {tournaments.map(t => (
                <button
                  key={t.id}
                  className={`${styles.tournamentTab} ${t.id === activeTournamentId ? styles.tournamentTabActive : ''}`}
                  onClick={() => setActiveTournament(t.id)}
                >
                  {t.shortName ?? t.name}
                </button>
              ))}
            </div>
          </div>
        )}
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
                <div className={styles.statMainValue}>1.248°</div>
                <div className={styles.statSubLabel}>de 25.430 participantes</div>
              </div>
              <div className={styles.statUpIndicator}>
                <ChevronUp className="w-4 h-4" />
                <div className={styles.statUpText}>
                  <span>256</span>
                  <div className={styles.statUpLabel}>vs. semana pasada</div>
                </div>
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
              <div>
                <div className={styles.statMainValue}>2°</div>
                <div className={styles.statSubLabel}>de 12</div>
              </div>
              <div className={styles.leagueBadge}>
                <div className={styles.leagueBadgeText}>Liga Amigos</div>
                <div className={styles.leagueBadgeIcon}>
                  <Users className="w-5 h-5" />
                </div>
              </div>
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
                  <span className={styles.statsGridValue}>1.250</span>
                </div>
                <div className={styles.statsGridItem}>
                  <span className={styles.statsGridLabel}>Partidos Acertados</span>
                  <span className={styles.statsGridValue}>18</span>
                </div>
                <div className={styles.statsGridItem}>
                  <span className={styles.statsGridLabel}>Precisión</span>
                  <span className={styles.statsGridValue}>62%</span>
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

        {/* Content Panels */}
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
