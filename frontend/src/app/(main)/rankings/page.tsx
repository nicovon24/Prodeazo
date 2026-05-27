"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  Target,
  Star,
} from "lucide-react";
import { Header } from "../../../components/layout/Header";
import { useAuth } from "../../../hooks/useAuth";
import {
  fetchLeaderboard,
  fetchMyLeaderboardStats,
  fetchMyPointsHistory,
  type LeaderboardEntry,
  type MyLeaderboardStats,
  type PointsHistoryEntry,
} from "../../../api/leaderboard";
import styles from "./rankings.module.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart
} from "recharts";

function labelForDay(iso: string, tab: string): string {
  const d = new Date(iso)
  if (tab === 'Semanal') {
    return d.toLocaleDateString('es-AR', { weekday: 'short' })
  }
  if (tab === 'Mensual') {
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  }
  // Torneo — show month + day
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

const TAB_DAYS: Record<string, number> = {
  Semanal: 7,
  Mensual: 30,
  'Todo el Torneo': Infinity,
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default function RankingsPage() {
  const { user } = useAuth();
  const [activeChartTab, setActiveChartTab] = useState("Mensual");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<MyLeaderboardStats | null>(null);
  const [history, setHistory] = useState<PointsHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([fetchLeaderboard(1, 100), fetchMyLeaderboardStats(), fetchMyPointsHistory()])
      .then(([lb, stats, hist]) => {
        if (!cancelled) {
          setLeaderboard(lb.results);
          setMyStats(stats);
          setHistory(hist.results);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLeaderboard([]);
          setMyStats(null);
          setHistory([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter history by active tab and shape for recharts
  const chartData = (() => {
    const cutoffDays = TAB_DAYS[activeChartTab] ?? Infinity;
    const cutoff = cutoffDays === Infinity ? null : new Date(Date.now() - cutoffDays * 86400_000);
    const filtered = history.filter((e) => !cutoff || new Date(e.day) >= cutoff);
    const points = filtered.map((e) => ({ name: labelForDay(e.day, activeChartTab), puntos: e.cumulative }));
    // Always start from 0
    return points.length > 0 ? [{ name: 'Inicio', puntos: 0 }, ...points] : [];
  })();

  const totalPoints = myStats?.totalPoints ?? null;
  const globalRank = myStats?.globalRank ?? null;
  const precision = myStats?.precision ?? null;

  const filteredLeaderboard = searchQuery.trim()
    ? leaderboard.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leaderboard;

  return (
    <>
      <Header
        title="Ranking Global"
        subtitle="Medite contra todos los jugadores de Prodeazo."
      />
      <main className={styles.main}>
        {/* Top 3 Stat Cards */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}><Star className="w-6 h-6" /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Tus Puntos Totales</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>
                  {loading ? '—' : totalPoints !== null ? totalPoints.toLocaleString('es-AR') : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}><Trophy className="w-6 h-6" /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Posición Global</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>
                  {loading ? '—' : globalRank !== null ? globalRank.toLocaleString('es-AR') : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}><Target className="w-6 h-6" /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Precisión Promedio</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>
                  {loading ? '—' : precision !== null ? `${precision}%` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Evolución de puntos</h3>
            <div className={styles.chartActions}>
               <button
                className={`${styles.chartBtn} ${activeChartTab === 'Semanal' ? styles.chartBtnActive : ''}`}
                onClick={() => setActiveChartTab('Semanal')}
              >
                Semanal
              </button>
              <button
                className={`${styles.chartBtn} ${activeChartTab === 'Mensual' ? styles.chartBtnActive : ''}`}
                onClick={() => setActiveChartTab('Mensual')}
              >
                Mensual
              </button>
              <button
                className={`${styles.chartBtn} ${activeChartTab === 'Todo el Torneo' ? styles.chartBtnActive : ''}`}
                onClick={() => setActiveChartTab('Todo el Torneo')}
              >
                Todo el Torneo
              </button>
            </div>
          </div>

          <div className={styles.chartContainer}>
            {!loading && chartData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>
                Todavía no tenés predicciones puntuadas en este período.
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPuntos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#AFE805" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#AFE805" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#AFE805', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="puntos" stroke="none" fillOpacity={1} fill="url(#colorPuntos)" />
                <Line type="monotone" dataKey="puntos" stroke="#AFE805" strokeWidth={3} dot={{ r: 4, fill: '#AFE805', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff', stroke: '#AFE805', strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className={styles.leaderboardSection}>
          <div className={styles.lbHeaderRow}>
            <h3 className={styles.lbTitle}>Top 100 Global</h3>
            <input
              type="text"
              placeholder="Buscar participante..."
              className={styles.lbSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.tableContainer}>
            <div className={styles.tableHead}>
              <div>POS</div>
              <div>PARTICIPANTE</div>
              <div>PUNTOS</div>
            </div>

            {loading ? (
              <div className={styles.tableRow} style={{ opacity: 0.5 }}>
                <div className={styles.colPos}>—</div>
                <div className={styles.colUser}><span>Cargando…</span></div>
                <div className={styles.colPoints}>—</div>
              </div>
            ) : (
              (() => {
                // Pre-compute ranks with tie support (standard competition ranking)
                // Ranks are based on the full unfiltered leaderboard so positions stay accurate
                const ranks: number[] = [];
                let currentRank = 1;
                for (let i = 0; i < leaderboard.length; i++) {
                  if (i > 0 && leaderboard[i].totalPoints < leaderboard[i - 1].totalPoints) {
                    currentRank = i + 1;
                  }
                  ranks.push(currentRank);
                }
                const rankMap = new Map(leaderboard.map((e, i) => [e.id, ranks[i]]));
                return filteredLeaderboard.map((entry) => {
                  const rank = rankMap.get(entry.id) ?? leaderboard.indexOf(entry) + 1;
                  const posClass =
                    rank === 1 ? styles.colRank1 :
                    rank === 2 ? styles.colRank2 :
                    rank === 3 ? styles.colRank3 : '';
                  const initials = getInitials(entry.name);
                  return (
                    <div key={entry.id} className={styles.tableRow}>
                      <div className={`${styles.colPos} ${posClass}`}>{rank}</div>
                      <div className={styles.colUser}>
                        <div className={styles.userAvatar}>
                          {entry.avatar ? (
                            <img src={entry.avatar} alt={entry.name} />
                          ) : (
                            initials
                          )}
                        </div>
                        <span className={styles.userName}>{entry.name}</span>
                      </div>
                      <div className={styles.colPoints}>
                        {entry.totalPoints.toLocaleString('es-AR')}
                      </div>
                    </div>
                  );
                });
              })()
            )}

            {!loading && leaderboard.length > 0 && !searchQuery.trim() && (
              <>
                {/* Ellipsis row showing gap */}
                <div className={styles.tableRow} style={{ opacity: 0.5 }}>
                  <div className={styles.colPos} style={{ fontSize: '1rem' }}>...</div>
                  <div className={styles.colUser}></div>
                  <div className={styles.colPoints}></div>
                </div>

                {/* Current user highlighted row */}
                <div className={`${styles.tableRow} ${styles.rowHighlight}`}>
                  <div className={styles.colPos}>
                    {globalRank !== null ? globalRank.toLocaleString('es-AR') : '—'}
                  </div>
                  <div className={styles.colUser}>
                    <div className={styles.userAvatar} style={{ backgroundColor: 'var(--color-primary)', color: '#000' }}>
                      {user?.name ? getInitials(user.name) : 'TÚ'}
                    </div>
                    <span className={styles.userName}>{user?.name ?? 'tu_usuario'}</span>
                    <span className={styles.userBadge}>TÚ</span>
                  </div>
                  <div className={styles.colPoints}>
                    {totalPoints !== null ? totalPoints.toLocaleString('es-AR') : '—'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
