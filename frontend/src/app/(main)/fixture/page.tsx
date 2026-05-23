"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { fetchFixtures, type Fixture } from '../../../api/fixtures';
import { useTournamentStore } from '../../../store/useTournamentStore';
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

const ROUNDS_PER_PAGE = 5;

export default function FixturePage() {
  const { tournaments, activeTournamentId, setActiveTournament } = useTournamentStore();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roundPage, setRoundPage] = useState(0);
  const [tournamentOpen, setTournamentOpen] = useState(false);
  const [roundOpen, setRoundOpen] = useState(false);
  const tournamentRef = useRef<HTMLDivElement>(null);
  const roundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tournamentRef.current && !tournamentRef.current.contains(e.target as Node)) setTournamentOpen(false);
      if (roundRef.current && !roundRef.current.contains(e.target as Node)) setRoundOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedRound(null);
    setStatusFilter('all');
    setRoundPage(0);
    setLoading(true);
    fetchFixtures(activeTournamentId)
      .then(data => setFixtures(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTournamentId]);

  const activeTournament = tournaments.find(t => t.id === activeTournamentId);

  // Unique rounds sorted
  const rounds = Array.from(new Set(fixtures.map(f => f.round).filter(Boolean))) as string[];
  const totalRoundPages = Math.ceil(rounds.length / ROUNDS_PER_PAGE);
  const visibleRounds = rounds.slice(roundPage * ROUNDS_PER_PAGE, (roundPage + 1) * ROUNDS_PER_PAGE);

  const renderScoreStatus = (f: Fixture) => {
    if (f.status === 'in_progress') {
      return (
        <div className={styles.scoreCol}>
          <span className={styles.scoreValue}>{f.homeScore ?? 0} - {f.awayScore ?? 0}</span>
          <span className={`${styles.scoreStatus} ${styles.statusLive}`}>EN VIVO</span>
        </div>
      );
    }
    if (f.status === 'finished') {
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

  // Apply filters
  const filtered = fixtures.filter(f => {
    if (selectedRound && f.round !== selectedRound) return false;
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    return true;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, Fixture[]>>((acc, f) => {
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
        {/* Top Mini Stats */}
        <div className={styles.statsRow}>
          <div className={styles.miniStat}>
            <Trophy className={styles.miniStatIcon} />
            <div className={styles.miniStatInfo}>
              <span className={styles.miniStatLabel}>Puntos Totales</span>
              <div className={styles.miniStatContent}>
                <span className={styles.miniStatValue}>1.250</span>
                <span className={styles.miniStatSubGreen}>Top 12%</span>
              </div>
            </div>
          </div>

          <div className={styles.miniStat}>
            <Target className={styles.miniStatIcon} />
            <div className={styles.miniStatInfo}>
              <span className={styles.miniStatLabel}>Partidos Acertados</span>
              <div className={styles.miniStatContent}>
                <span className={styles.miniStatValue}>18</span>
                <span className={styles.miniStatSub}>de 32</span>
              </div>
            </div>
          </div>

          <div className={styles.miniStat}>
            <TrendingUp className={styles.miniStatIcon} />
            <div className={styles.miniStatInfo}>
              <span className={styles.miniStatLabel}>Precisión</span>
              <div className={styles.miniStatContent}>
                <span className={styles.miniStatValue}>62%</span>
                <span className={styles.miniStatSubGreen}>+8% vs promedio</span>
              </div>
            </div>
          </div>

          <div className={styles.miniStat}>
            <Star className={styles.miniStatIcon} fill="currentColor" />
            <div className={styles.miniStatInfo}>
              <span className={styles.miniStatLabel}>Mejor Racha</span>
              <div className={styles.miniStatContent}>
                <span className={styles.miniStatValue}>5</span>
                <span className={styles.miniStatSub}>aciertos</span>
              </div>
            </div>
          </div>

          <div className={styles.miniStat}>
            <Users className={styles.miniStatIcon} />
            <div className={styles.miniStatInfo}>
              <span className={styles.miniStatLabel}>Ligas</span>
              <div className={styles.miniStatContent}>
                <span className={styles.miniStatValue}>2</span>
                <span className={styles.miniStatSub}>activas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          {/* Tournament selector */}
          {tournaments.length > 1 && (
            <div className={styles.filterDropdown} ref={tournamentRef}>
              <button className={styles.filterSelect} onClick={() => setTournamentOpen(v => !v)}>
                <Trophy className={styles.filterSelectIcon} />
                {activeTournament?.shortName ?? activeTournament?.name ?? 'Torneo'}
                <ChevronDown className={styles.filterSelectIcon} />
              </button>
              {tournamentOpen && (
                <div className={styles.filterMenu}>
                  {tournaments.map(t => (
                    <button
                      key={t.id}
                      className={`${styles.filterMenuItem} ${t.id === activeTournamentId ? styles.filterMenuItemActive : ''}`}
                      onClick={() => { setActiveTournament(t.id); setTournamentOpen(false); }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Round filter with pagination */}
          <div className={styles.filterDropdown} ref={roundRef}>
            <button className={styles.filterSelect} onClick={() => setRoundOpen(v => !v)}>
              {selectedRound ?? 'Todas las fases'}
              <ChevronDown className={styles.filterSelectIcon} />
            </button>
            {roundOpen && (
              <div className={styles.filterMenu}>
                <button
                  className={`${styles.filterMenuItem} ${!selectedRound ? styles.filterMenuItemActive : ''}`}
                  onClick={() => { setSelectedRound(null); setRoundOpen(false); setRoundPage(0); }}
                >
                  Todas las fases
                </button>
                {visibleRounds.map(r => (
                  <button
                    key={r}
                    className={`${styles.filterMenuItem} ${r === selectedRound ? styles.filterMenuItemActive : ''}`}
                    onClick={() => { setSelectedRound(r); setRoundOpen(false); }}
                  >
                    {r}
                  </button>
                ))}
                {totalRoundPages > 1 && (
                  <div className={styles.filterMenuPager}>
                    <button
                      className={styles.filterMenuPagerBtn}
                      disabled={roundPage === 0}
                      onClick={() => setRoundPage(p => p - 1)}
                    >
                      <ChevronLeft className={styles.filterSelectIcon} />
                    </button>
                    <span>{roundPage + 1} / {totalRoundPages}</span>
                    <button
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

          {/* Status filter */}
          <div className={styles.statusFilters}>
            {(Object.keys(STATUS_LABELS) as StatusFilter[]).map(s => (
              <button
                key={s}
                className={`${styles.statusBtn} ${statusFilter === s ? styles.statusBtnActive : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <button className={styles.calendarBtn}>
            <Calendar className={styles.filterSelectIcon} />
            Ver calendario
          </button>
        </div>

        {/* Match Table */}
        <div>
          <div className={styles.tableColumns}>
            <div>FECHA</div>
            <div className={styles.colCenter}>PARTIDO</div>
            <div className={styles.colCenter}>MARCADOR</div>
            <div className={styles.colCenter}>TU PREDICCIÓN</div>
            <div></div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-white/50">Cargando partidos...</div>
          ) : fixtures.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              No hay partidos disponibles.
            </div>
          ) : (
            Object.entries(grouped).map(([dateKey, dayFixtures]) => (
              <div key={dateKey} className={styles.dateGroup}>
                <div className={styles.dateHeader}>
                  <Calendar className={styles.dateIcon} />
                  {formatDateLabel(dateKey)}
                </div>

                {dayFixtures.map(f => (
                  <Link key={f.id} href="#" className={styles.matchRow}>
                    <div className={styles.timeCol}>
                      <span className={styles.matchTime}>
                        {f.date
                          ? new Date(f.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </span>
                      <span className={styles.matchStadium}>{f.round ?? f.groupLabel ?? ''}</span>
                    </div>
                    <div className={styles.teamsCol}>
                      <div className={`${styles.team} ${styles.teamRight}`}>
                        <span className={styles.teamName}>{f.homeTeam?.shortName ?? f.homeTeam?.name ?? '?'}</span>
                        {f.homeTeam?.logoUrl
                          ? <img src={f.homeTeam.logoUrl} alt={f.homeTeam.name} className={styles.teamLogo} />
                          : <div className={styles.teamLogoPlaceholder} />}
                      </div>
                      <span className={styles.vsSpan}>VS</span>
                      <div className={`${styles.team} ${styles.teamLeft}`}>
                        {f.awayTeam?.logoUrl
                          ? <img src={f.awayTeam.logoUrl} alt={f.awayTeam.name} className={styles.teamLogo} />
                          : <div className={styles.teamLogoPlaceholder} />}
                        <span className={styles.teamName}>{f.awayTeam?.shortName ?? f.awayTeam?.name ?? '?'}</span>
                      </div>
                    </div>
                    {renderScoreStatus(f)}
                    <div className={styles.predCol}>
                      <div className={`${styles.predBadge} ${styles.predGrey}`}>-</div>
                    </div>
                    <div className={styles.chevronCol}>
                      <ChevronRight className={styles.rowChevron} />
                    </div>
                  </Link>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Legend Bar */}
        <div className={styles.legendBar}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendDotGreen}`}></div>
            <span className={styles.legendTitle}>¡Vas ganando!</span> Tu predicción es correcta
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendDotYellow}`}></div>
            <span className={styles.legendTitle}>En riesgo</span> Tu predicción puede fallar
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendDotRed}`}></div>
            <span className={styles.legendTitle}>Vas perdiendo</span> Tu predicción no se está cumpliendo
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendDotGrey}`}></div>
            <span className={styles.legendTitle}>Sin comenzar</span> Aún no hiciste tu predicción o no empezó
          </div>
        </div>
      </main>
    </>
  );
}
