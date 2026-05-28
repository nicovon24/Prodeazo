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
import { FixtureRowSkeleton } from '@/components/skeletons/FixtureRowSkeleton';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { getCountryName } from '@/lib/i18n/countries';

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
  none:    'bg-transparent border-white/20 text-white/60',
  neutral: 'bg-transparent border-white/20 text-white/60',
  exact:   'bg-[rgba(0,206,23,0.15)] border-[rgba(0,206,23,0.5)] text-[#00CE17]',
  partial: 'bg-[rgba(255,204,0,0.15)] border-[rgba(255,204,0,0.5)] text-[#FFCC00]',
  miss:    'bg-[rgba(213,2,4,0.15)] border-[rgba(213,2,4,0.5)] text-[#ff4d4d]',
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
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="font-display text-[1.25rem] font-extrabold text-white">{f.homeScore ?? 0} - {f.awayScore ?? 0}</span>
          <span className="flex items-center gap-1 text-[0.6rem] font-bold uppercase text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            EN VIVO
          </span>
        </div>
      );
    }
    if (f.status === 'finished' || f.status === 'ft') {
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="font-display text-[1.25rem] font-extrabold text-white">{f.homeScore ?? 0} - {f.awayScore ?? 0}</span>
          <span className="text-[0.6rem] font-bold uppercase text-white/40">FINALIZADO</span>
        </div>
      );
    }
    if (f.status === 'postponed') {
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="font-display text-[1.25rem] font-extrabold text-white">-</span>
          <span className="text-[0.6rem] font-bold uppercase text-white/40">POSTERGADO</span>
        </div>
      );
    }
    if (f.status === 'cancelled') {
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="font-display text-[1.25rem] font-extrabold text-white">-</span>
          <span className="text-[0.6rem] font-bold uppercase text-white/40">CANCELADO</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-1">
        <span className="font-display text-[1.25rem] font-extrabold text-white">-</span>
        <span className="text-[0.6rem] font-bold uppercase text-white/40">POR JUGAR</span>
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
      <main className="flex-1 px-4 md:px-8 pt-4 md:pt-6 pb-4 md:pb-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {([ { icon: Trophy, label: 'Puntos Totales' }, { icon: Target, label: 'Acertados' }, { icon: TrendingUp, label: 'Precisión' }, { icon: Star, label: 'Mejor Racha' }, { icon: Users, label: 'Ligas' } ] as const).map(({ icon: Icon, label }) => {
            const value = label === 'Puntos Totales' ? formatCount(stats?.totalPoints ?? 0) : label === 'Acertados' ? formatCount(stats?.correctPredictions ?? 0) : label === 'Precisión' ? `${stats?.precision ?? 0}%` : label === 'Mejor Racha' ? formatCount(stats?.bestStreak ?? 0) : formatCount(stats?.leagueCount ?? 0);
            const sub = label === 'Mejor Racha' ? 'aciertos' : label === 'Ligas' ? 'activas' : label === 'Puntos Totales' && topPercent != null ? `Top ${topPercent}%` : null;
            const subGreen = label === 'Puntos Totales' && topPercent != null;
            return (
              <div key={label} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex items-center gap-3">
                <Icon className="w-5 h-5 text-primary flex-shrink-0" {...(label === 'Mejor Racha' ? { fill: 'currentColor' } : {})} />
                <div className="flex flex-col gap-1">
                  <span className="text-[0.65rem] font-bold uppercase text-white/60">{label}</span>
                  <div className="flex items-baseline gap-2">
                    {loading ? <Skeleton className="h-6 w-16" /> : <span className="font-display text-[1.4rem] font-extrabold text-white leading-none">{value}</span>}
                    {!loading && sub && <span className={subGreen ? 'text-[0.75rem] font-bold text-[#00CE17]' : 'text-[0.75rem] text-white/40'}>{sub}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pb-4 border-b border-white/[0.1] overflow-x-auto flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-3 md:flex-wrap md:overflow-x-visible">
          {tournaments.length > 0 && (
            <div className="relative flex-shrink-0" ref={tournamentRef}>
              <button type="button" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-[0.85rem] font-medium cursor-pointer" onClick={() => setTournamentOpen(v => !v)}>
                {tournamentIcon ? (
                  <img src={tournamentIcon} alt="" className="w-5 h-5 object-contain" />
                ) : (
                  <Trophy className="w-4 h-4 text-white/50" />
                )}
                {activeTournament?.shortName ?? activeTournament?.name ?? 'Torneo'}
                <ChevronDown className="w-4 h-4 text-white/50" />
              </button>
              {tournamentOpen && tournaments.length > 1 && (
                <div className="absolute top-[calc(100%+6px)] left-0 min-w-[200px] bg-[#141414] border border-white/[0.12] rounded-xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-0.5">
                  {tournaments.map(t => {
                    const icon = getTournamentIconUrl(t.leagueId);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`w-full flex items-center gap-2.5 text-left px-3 py-[9px] border-none rounded-lg bg-transparent text-[0.85rem] font-medium cursor-pointer transition-all duration-150 ${t.id === activeTournamentId ? 'bg-primary/[0.12] text-primary' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
                        onClick={() => { setActiveTournament(t.id); setTournamentOpen(false); }}
                      >
                        {icon ? (
                          <img src={icon} alt="" className="w-[18px] h-[18px] object-contain flex-shrink-0" />
                        ) : (
                          <Trophy className="w-[18px] h-[18px] text-primary flex-shrink-0" />
                        )}
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="relative flex-shrink-0" ref={sortRef}>
            <button type="button" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-[0.85rem] font-medium cursor-pointer" onClick={() => setSortOpen(v => !v)}>
              <ArrowUpDown className="w-4 h-4 text-white/50" />
              {SORT_LABELS[sortMode]}
              <ChevronDown className="w-4 h-4 text-white/50" />
            </button>
            {sortOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 min-w-[200px] bg-[#141414] border border-white/[0.12] rounded-xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-0.5">
                {(Object.keys(SORT_LABELS) as FixtureSortMode[]).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    className={`w-full flex items-center gap-2.5 text-left px-3 py-[9px] border-none rounded-lg bg-transparent text-[0.85rem] font-medium cursor-pointer transition-all duration-150 ${mode === sortMode ? 'bg-primary/[0.12] text-primary' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
                    onClick={() => { setSortMode(mode); setSortOpen(false); }}
                  >
                    {SORT_LABELS[mode]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex-shrink-0" ref={roundRef}>
            <button type="button" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-[0.85rem] font-medium cursor-pointer" onClick={() => setRoundOpen(v => !v)}>
              {selectedRound ?? 'Todas las fases'}
              <ChevronDown className="w-4 h-4 text-white/50" />
            </button>
            {roundOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 min-w-[200px] bg-[#141414] border border-white/[0.12] rounded-xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-0.5">
                <button
                  type="button"
                  className={`w-full flex items-center gap-2.5 text-left px-3 py-[9px] border-none rounded-lg bg-transparent text-[0.85rem] font-medium cursor-pointer transition-all duration-150 ${!selectedRound ? 'bg-primary/[0.12] text-primary' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
                  onClick={() => { setSelectedRound(null); setRoundOpen(false); setRoundPage(0); }}
                >
                  Todas las fases
                </button>
                {visibleRounds.map(r => (
                  <button
                    key={r}
                    type="button"
                    className={`w-full flex items-center gap-2.5 text-left px-3 py-[9px] border-none rounded-lg bg-transparent text-[0.85rem] font-medium cursor-pointer transition-all duration-150 ${r === selectedRound ? 'bg-primary/[0.12] text-primary' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
                    onClick={() => { setSelectedRound(r); setRoundOpen(false); }}
                  >
                    {r}
                  </button>
                ))}
                {totalRoundPages > 1 && (
                  <div className="flex items-center justify-center gap-2 px-1 py-1.5 border-t border-white/[0.08] mt-1 text-[0.78rem] text-white/50">
                    <button type="button" className="bg-transparent border-none text-white/60 cursor-pointer p-0.5 flex items-center rounded hover:text-white disabled:opacity-25 disabled:cursor-default" disabled={roundPage === 0} onClick={() => setRoundPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4 text-white/50" />
                    </button>
                    <span>{roundPage + 1} / {totalRoundPages}</span>
                    <button type="button" className="bg-transparent border-none text-white/60 cursor-pointer p-0.5 flex items-center rounded hover:text-white disabled:opacity-25 disabled:cursor-default" disabled={roundPage >= totalRoundPages - 1} onClick={() => setRoundPage(p => p + 1)}>
                      <ChevronRight className="w-4 h-4 text-white/50" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-1.5 flex-shrink-0">
            {(Object.keys(STATUS_LABELS) as StatusFilter[]).map(s => (
              <button
                key={s}
                type="button"
                className={`px-3.5 py-2 rounded-lg border text-[0.8rem] font-medium cursor-pointer whitespace-nowrap transition-all duration-150 ${statusFilter === s ? 'bg-primary/[0.15] border-primary/40 text-primary' : 'border-white/[0.1] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white'}`}
                onClick={() => setStatusFilter(s)}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <button type="button" className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-transparent border border-white/[0.2] rounded-lg text-white text-[0.85rem] font-medium cursor-pointer flex-shrink-0 whitespace-nowrap transition-colors duration-200 hover:bg-white/[0.05]">
            <Calendar className="w-4 h-4 text-white/50" />
            Ver calendario
          </button>
        </div>

        <div className="overflow-x-hidden">
          <div className="hidden sm:grid [grid-template-columns:100px_minmax(0,1fr)_92px_92px] gap-4 px-4 py-2 text-[0.7rem] font-bold text-white/40 uppercase sticky top-16 z-[2] bg-[#0a0a0a]">
            <div>FECHA</div>
            <div className="text-center">PARTIDO</div>
            <div className="text-center">MARCADOR</div>
            <div className="text-center">TU PREDICCIÓN</div>
          </div>

          {loading ? (
            <div>
              {Array.from({ length: 8 }).map((_, i) => (
                <FixtureRowSkeleton key={i} />
              ))}
            </div>
          ) : fixtures.length === 0 ? (
            <div className="py-8 text-center text-white/50">No hay partidos disponibles.</div>
          ) : sorted.length === 0 ? (
            <div className="py-8 text-center text-white/50">No hay partidos con estos filtros.</div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {Object.entries(grouped).map(([dateKey, dayFixtures]) => (
              <div key={dateKey} className="mb-6">
                <div className="flex items-center gap-2 px-4 py-3 text-[0.95rem] font-bold text-white border-b border-white/[0.1] mb-2">
                  <Calendar className="w-[18px] h-[18px] text-white/40" />
                  {formatDateLabel(dateKey)}
                </div>

                {dayFixtures.map(f => {
                  const pred = predByFixture.get(f.id);
                  const tone = getPredictionBadgeTone(f, pred);
                  return (
                    <motion.div key={f.id} variants={fadeInUp} className="flex flex-col gap-3 p-3 bg-white/[0.02] rounded-lg mb-1 transition-colors duration-200 hover:bg-white/[0.05] sm:grid sm:[grid-template-columns:100px_minmax(0,1fr)_92px_92px] sm:gap-4 sm:p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[0.95rem] font-bold text-white">
                          {f.date
                            ? new Date(f.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                            : '--:--'}
                        </span>
                        <span className="text-[0.65rem] text-white/55 leading-[1.3] font-semibold">{formatFixturePhase(f)}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 sm:gap-4">
                        <div className="flex-1 flex items-center justify-end gap-3 text-[0.95rem] font-semibold text-white min-w-0">
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                            {getCountryName(f.homeTeam?.name)}
                          </span>
                          <TeamLogo name={f.homeTeam?.name} logoUrl={f.homeTeam?.logoUrl} />
                        </div>
                        <span className="text-[0.8rem] font-bold text-white/30 flex-shrink-0">VS</span>
                        <div className="flex-1 flex items-center justify-start gap-3 text-[0.95rem] font-semibold text-white min-w-0">
                          <TeamLogo name={f.awayTeam?.name} logoUrl={f.awayTeam?.logoUrl} />
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                            {getCountryName(f.awayTeam?.name)}
                          </span>
                        </div>
                      </div>
                      {renderScoreStatus(f)}
                      <div className="flex justify-center items-center">
                        <div className={`px-4 py-2 rounded-lg font-display text-[1rem] font-bold flex items-center justify-center min-w-[64px] border ${PRED_BADGE_CLASS[tone]}`}>
                          {formatPredictionScore(pred)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
            </motion.div>
          )}
        </div>

        <div className="flex-none flex items-start justify-center flex-wrap gap-x-6 gap-y-3 px-4 py-3 bg-white/[0.02] rounded-xl sm:items-center sm:gap-8 sm:p-4 sm:flex-nowrap">
          {([
            { color: 'bg-[#00CE17]', title: '¡Vas ganando!', desc: 'Tu predicción es correcta' },
            { color: 'bg-[#FFCC00]', title: 'En riesgo', desc: 'Tu predicción puede fallar' },
            { color: 'bg-[#D50204]', title: 'Vas perdiendo', desc: 'Tu predicción no se está cumpliendo' },
            { color: 'bg-white/30', title: 'Sin comenzar', desc: 'Aún no hiciste tu predicción o no empezó' },
          ]).map(({ color, title, desc }) => (
            <div key={title} className="flex items-center gap-2 text-[0.75rem] text-white/60">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${color}`} />
              <span className="font-bold text-white">{title}</span> {desc}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
