"use client";

import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Trophy,
  Target,
  TrendingUp,
  Star,
  Users,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
} from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { fetchFixtures, type Fixture } from '../../../api/fixtures';
import { fetchPredictions, type Prediction } from '../../../api/predictions';
import { fetchDashboardMe } from '../../../api/dashboard';
import { useTournamentStore } from '../../../store/useTournamentStore';
import { TeamLogo } from '@/components/TeamLogo';
import { getTournamentIconUrl } from '@/lib/tournament-icons';
import {
  formatFixturePhase,
  formatPredictionScore,
  getPredictionBadgeTone,
  sortFixtures,
  type FixtureSortMode,
} from '@/lib/fixture-utils';
import styles from './fixture.module.css';

type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'finished' | 'postponed' | 'cancelled';

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'Todos',
  not_started: 'Por jugar',
  in_progress: 'En vivo',
  finished: 'Finalizados',
  postponed: 'Postergados',
  cancelled: 'Cancelados',
};

const SORT_LABELS: Record<FixtureSortMode, string> = {
  recommended: 'Recomendado',
  kickoff_asc: 'Fecha (próximos primero)',
  kickoff_desc: 'Fecha (lejanos primero)',
};

const PRED_BADGE_CLASS: Record<ReturnType<typeof getPredictionBadgeTone>, string> = {
  none: styles.predGrey,
  neutral: styles.predGrey,
  exact: styles.predGreen,
  partial: styles.predYellow,
  miss: styles.predRed,
};

const ROUNDS_PER_PAGE = 5;

function formatCount(n: number): string {
  return n.toLocaleString('es-AR');
}

export default function FixturePage() {
  const { tournaments, activeTournamentId, setActiveTournament } = useTournamentStore();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<FixtureSortMode>('recommended');
  const [roundPage, setRoundPage] = useState(0);
  const [tournamentOpen, setTournamentOpen] = useState(false);
  const [roundOpen, setRoundOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchDashboardMe>> | null>(null);
  const tournamentRef = useRef<HTMLDivElement>(null);
  const roundRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tournamentRef.current && !tournamentRef.current.contains(e.target as Node)) setTournamentOpen(false);
      if (roundRef.current && !roundRef.current.contains(e.target as Node)) setRoundOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!activeTournamentId) return;
    setSelectedRound(null);
    setStatusFilter('all');
    setRoundPage(0);
    setLoading(true);

    Promise.all([
      fetchFixtures(activeTournamentId),
      fetchPredictions(activeTournamentId),
      fetchDashboardMe(activeTournamentId),
    ])
      .then(([fixtureData, predData, dashboard]) => {
        setFixtures(Array.isArray(fixtureData) ? fixtureData : []);
        setPredictions(Array.isArray(predData) ? predData : []);
        setStats(dashboard);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTournamentId]);

  const activeTournament = tournaments.find(t => t.id === activeTournamentId);
  const tournamentIcon = getTournamentIconUrl(activeTournament?.leagueId);

  const predByFixture = useMemo(() => {
    const map = new Map<number, Prediction>();
    predictions.forEach(p => map.set(p.fixtureId, p));
    return map;
  }, [predictions]);

  const topPercent =
    stats && stats.participantCount > 0
      ? Math.min(100, Math.max(1, Math.round((stats.globalRank / stats.participantCount) * 100)))
      : null;

  const rounds = Array.from(new Set(fixtures.map(f => f.round).filter(Boolean))) as string[];
  const totalRoundPages = Math.ceil(rounds.length / ROUNDS_PER_PAGE);
  const visibleRounds = rounds.slice(roundPage * ROUNDS_PER_PAGE, (roundPage + 1) * ROUNDS_PER_PAGE);

  const renderScoreStatus = (f: Fixture) => {
    if (f.status === 'in_progress' || f.status === 'inprogress') {
      return (
        <div className={styles.scoreCol}>
          <span className={styles.scoreValue}>{f.homeScore ?? 0} - {f.awayScore ?? 0}</span>
          <span className={`${styles.scoreStatus} ${styles.statusLive}`}>EN VIVO</span>
        </div>
      );
    }
    if (f.status === 'finished' || f.status === 'ft') {
      return (
        <div className={styles.scoreCol}>
          <span className={styles.scoreValue}>{f.homeScore ?? 0} - {f.awayScore ?? 0}</span>
          <span className={styles.scoreStatus}>FINALIZADO</span>
        </div>
      );
    }
    if (f.status === 'postponed') {
      return (
        <div className={styles.scoreCol}>
          <span className={styles.scoreValue}>-</span>
          <span className={styles.scoreStatus}>POSTERGADO</span>
        </div>
      );
    }
    if (f.status === 'cancelled') {
      return (
        <div className={styles.scoreCol}>
          <span className={styles.scoreValue}>-</span>
          <span className={styles.scoreStatus}>CANCELADO</span>
        </div>
      );
    }
    return (
      <div className={styles.scoreCol}>
        <span className={styles.scoreValue}>-</span>
        <span className={styles.scoreStatus}>POR JUGAR</span>
      </div>
    );
  };

  const filtered = fixtures.filter(f => {
    if (selectedRound && f.round !== selectedRound) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'in_progress') {
      return f.status === 'in_progress' || f.status === 'inprogress';
    }
    if (statusFilter === 'not_started') {
      return f.status === 'not_started' || f.status === 'ns';
    }
    if (statusFilter === 'finished') {
      return f.status === 'finished' || f.status === 'ft';
    }
    return f.status === statusFilter;
  });

  const sorted = sortFixtures(filtered, sortMode);

  const grouped = sorted.reduce<Record<string, Fixture[]>>((acc, f) => {
    const dateKey = f.date ? f.date.slice(0, 10) : 'Sin fecha';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(f);
    return acc;
  }, {});

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === 'Sin fecha') return dateStr;
    try {
      return new Date(dateStr).toLocaleDateString('es-AR', {
        weekday: 'long', day: 'numeric', month: 'long',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Header
        title="Fixture"
        subtitle="Todos los partidos del torneo."
      />
      <main className={styles.main}>
        <div className={styles.statsRow}>
          <div className={styles.miniStat}>
            <Trophy className={styles.miniStatIcon} />
            <div className={styles.miniStatInfo}>
              <span className={styles.miniStatLabel}>Puntos Totales</span>
              <div className={styles.miniStatContent}>
                <span className={styles.miniStatValue}>
                  {loading ? '—' : formatCount(stats?.totalPoints ?? 0)}
                </span>
                {topPercent != null && (
                  <span className={styles.miniStatSubGreen}>Top {topPercent}%</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.miniStat}>
            <Target className={styles.miniStatIcon} />
            <div className={styles.miniStatInfo}>
              <span className={styles.miniStatLabel}>Partidos Acertados</span>
              <div className={styles.miniStatContent}>
                <span className={styles.miniStatValue}>
                  {loading ? '—' : formatCount(stats?.correctPredictions ?? 0)}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.miniStat}>
            <TrendingUp className={styles.miniStatIcon} />
            <div className={styles.miniStatInfo}>
              <span className={styles.miniStatLabel}>Precisión</span>
              <div className={styles.miniStatContent}>
                <span className={styles.miniStatValue}>
                  {loading ? '—' : `${stats?.precision ?? 0}%`}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.miniStat}>
            <Star className={styles.miniStatIcon} fill="currentColor" />
            <div className={styles.miniStatInfo}>
              <span className={styles.miniStatLabel}>Mejor Racha</span>
              <div className={styles.miniStatContent}>
                <span className={styles.miniStatValue}>
                  {loading ? '—' : formatCount(stats?.bestStreak ?? 0)}
                </span>
                <span className={styles.miniStatSub}>aciertos</span>
              </div>
            </div>
          </div>

          <div className={styles.miniStat}>
            <Users className={styles.miniStatIcon} />
            <div className={styles.miniStatInfo}>
              <span className={styles.miniStatLabel}>Ligas</span>
              <div className={styles.miniStatContent}>
                <span className={styles.miniStatValue}>
                  {loading ? '—' : formatCount(stats?.leagueCount ?? 0)}
                </span>
                <span className={styles.miniStatSub}>activas</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.filterBar}>
          {tournaments.length > 0 && (
            <div className={styles.filterDropdown} ref={tournamentRef}>
              <button type="button" className={styles.filterSelect} onClick={() => setTournamentOpen(v => !v)}>
                {tournamentIcon ? (
                  <img src={tournamentIcon} alt="" className={styles.tournamentIcon} />
                ) : (
                  <Trophy className={styles.filterSelectIcon} />
                )}
                {activeTournament?.shortName ?? activeTournament?.name ?? 'Torneo'}
                <ChevronDown className={styles.filterSelectIcon} />
              </button>
              {tournamentOpen && tournaments.length > 1 && (
                <div className={styles.filterMenu}>
                  {tournaments.map(t => {
                    const icon = getTournamentIconUrl(t.leagueId);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`${styles.filterMenuItem} ${t.id === activeTournamentId ? styles.filterMenuItemActive : ''}`}
                        onClick={() => { setActiveTournament(t.id); setTournamentOpen(false); }}
                      >
                        {icon ? (
                          <img src={icon} alt="" className={styles.tournamentMenuIcon} />
                        ) : (
                          <Trophy className={styles.filterMenuItemIcon} />
                        )}
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className={styles.filterDropdown} ref={sortRef}>
            <button type="button" className={styles.filterSelect} onClick={() => setSortOpen(v => !v)}>
              <ArrowUpDown className={styles.filterSelectIcon} />
              {SORT_LABELS[sortMode]}
              <ChevronDown className={styles.filterSelectIcon} />
            </button>
            {sortOpen && (
              <div className={styles.filterMenu}>
                {(Object.keys(SORT_LABELS) as FixtureSortMode[]).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    className={`${styles.filterMenuItem} ${mode === sortMode ? styles.filterMenuItemActive : ''}`}
                    onClick={() => { setSortMode(mode); setSortOpen(false); }}
                  >
                    {SORT_LABELS[mode]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.filterDropdown} ref={roundRef}>
            <button type="button" className={styles.filterSelect} onClick={() => setRoundOpen(v => !v)}>
              {selectedRound ?? 'Todas las fases'}
              <ChevronDown className={styles.filterSelectIcon} />
            </button>
            {roundOpen && (
              <div className={styles.filterMenu}>
                <button
                  type="button"
                  className={`${styles.filterMenuItem} ${!selectedRound ? styles.filterMenuItemActive : ''}`}
                  onClick={() => { setSelectedRound(null); setRoundOpen(false); setRoundPage(0); }}
                >
                  Todas las fases
                </button>
                {visibleRounds.map(r => (
                  <button
                    key={r}
                    type="button"
                    className={`${styles.filterMenuItem} ${r === selectedRound ? styles.filterMenuItemActive : ''}`}
                    onClick={() => { setSelectedRound(r); setRoundOpen(false); }}
                  >
                    {r}
                  </button>
                ))}
                {totalRoundPages > 1 && (
                  <div className={styles.filterMenuPager}>
                    <button
                      type="button"
                      className={styles.filterMenuPagerBtn}
                      disabled={roundPage === 0}
                      onClick={() => setRoundPage(p => p - 1)}
                    >
                      <ChevronLeft className={styles.filterSelectIcon} />
                    </button>
                    <span>{roundPage + 1} / {totalRoundPages}</span>
                    <button
                      type="button"
                      className={styles.filterMenuPagerBtn}
                      disabled={roundPage >= totalRoundPages - 1}
                      onClick={() => setRoundPage(p => p + 1)}
                    >
                      <ChevronRight className={styles.filterSelectIcon} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.statusFilters}>
            {(Object.keys(STATUS_LABELS) as StatusFilter[]).map(s => (
              <button
                key={s}
                type="button"
                className={`${styles.statusBtn} ${statusFilter === s ? styles.statusBtnActive : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <button type="button" className={styles.calendarBtn}>
            <Calendar className={styles.filterSelectIcon} />
            Ver calendario
          </button>
        </div>

        <div>
          <div className={styles.tableColumns}>
            <div>FECHA</div>
            <div className={styles.colCenter}>PARTIDO</div>
            <div className={styles.colScore}>MARCADOR</div>
            <div className={styles.colPred}>TU PREDICCIÓN</div>
          </div>

          {loading ? (
            <div className={styles.tableMessage}>Cargando partidos...</div>
          ) : fixtures.length === 0 ? (
            <div className={styles.tableMessage}>No hay partidos disponibles.</div>
          ) : sorted.length === 0 ? (
            <div className={styles.tableMessage}>No hay partidos con estos filtros.</div>
          ) : (
            Object.entries(grouped).map(([dateKey, dayFixtures]) => (
              <div key={dateKey} className={styles.dateGroup}>
                <div className={styles.dateHeader}>
                  <Calendar className={styles.dateIcon} />
                  {formatDateLabel(dateKey)}
                </div>

                {dayFixtures.map(f => {
                  const pred = predByFixture.get(f.id);
                  const tone = getPredictionBadgeTone(f, pred);
                  return (
                    <div key={f.id} className={styles.matchRow}>
                      <div className={styles.timeCol}>
                        <span className={styles.matchTime}>
                          {f.date
                            ? new Date(f.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                            : '--:--'}
                        </span>
                        <span className={styles.matchPhase}>{formatFixturePhase(f)}</span>
                      </div>
                      <div className={styles.teamsCol}>
                        <div className={`${styles.team} ${styles.teamRight}`}>
                          <span className={styles.teamName}>
                            {f.homeTeam?.shortName ?? f.homeTeam?.name ?? '?'}
                          </span>
                          <TeamLogo name={f.homeTeam?.name} logoUrl={f.homeTeam?.logoUrl} />
                        </div>
                        <span className={styles.vsSpan}>VS</span>
                        <div className={`${styles.team} ${styles.teamLeft}`}>
                          <TeamLogo name={f.awayTeam?.name} logoUrl={f.awayTeam?.logoUrl} />
                          <span className={styles.teamName}>
                            {f.awayTeam?.shortName ?? f.awayTeam?.name ?? '?'}
                          </span>
                        </div>
                      </div>
                      {renderScoreStatus(f)}
                      <div className={styles.predCol}>
                        <div className={`${styles.predBadge} ${PRED_BADGE_CLASS[tone]}`}>
                          {formatPredictionScore(pred)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className={styles.legendBar}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendDotGreen}`} />
            <span className={styles.legendTitle}>¡Vas ganando!</span> Tu predicción es correcta
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendDotYellow}`} />
            <span className={styles.legendTitle}>En riesgo</span> Tu predicción puede fallar
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendDotRed}`} />
            <span className={styles.legendTitle}>Vas perdiendo</span> Tu predicción no se está cumpliendo
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendDotGrey}`} />
            <span className={styles.legendTitle}>Sin comenzar</span> Aún no hiciste tu predicción o no empezó
          </div>
        </div>
      </main>
    </>
  );
}
