"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Trophy, 
  Target, 
  Star,
  Flame  // as alternate for streak icon
} from "lucide-react";
import { Header } from "../../../components/layout/Header";
import styles from "./rankings.module.css";
// Important: Add Recharts imports
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

// Mock data for the chart
const chartData = [
  { name: 'F1', puntos: 120 },
  { name: 'F2', puntos: 250 },
  { name: 'F3', puntos: 380 },
  { name: 'Oct', puntos: 540 },
  { name: 'Cua', puntos: 810 },
  { name: 'Sem', puntos: 1050 },
  { name: 'Fin', puntos: 1250 },
];

export default function RankingsPage() {
  const [activeChartTab, setActiveChartTab] = useState("Mensual");

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
                <span className={styles.statValue}>1.250</span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}><Trophy className="w-6 h-6" /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Posición Global</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>18.402</span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}><Target className="w-6 h-6" /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Precisión Promedio</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>61%</span>
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
                className={`${styles.chartBtn} ${activeChartTab === 'Torneo' ? styles.chartBtnActive : ''}`}
                onClick={() => setActiveChartTab('Torneo')}
              >
                Todo el Torneo
              </button>
            </div>
          </div>
          
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              {/* We use ComposedChart to easily layer an Area under the Line */}
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
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className={styles.leaderboardSection}>
          <div className={styles.lbHeaderRow}>
            <h3 className={styles.lbTitle}>Top 100 Global</h3>
            <input type="text" placeholder="Buscar participante..." className={styles.lbSearch} />
          </div>
          
          <div className={styles.tableContainer}>
            <div className={styles.tableHead}>
              <div>POS</div>
              <div>PARTICIPANTE</div>
              <div>PUNTOS</div>
              <div>PRECISIÓN</div>
              <div>RACHA ACTUAL</div>
            </div>

            {/* Simulated Data Rows */}
            <div className={styles.tableRow}>
              <div className={`${styles.colPos} ${styles.colRank1}`}>1</div>
              <div className={styles.colUser}>
                <div className={styles.userAvatar}>
                  {/* using initials since no src */} 
                  MQ
                </div>
                <span className={styles.userName}>Martin Q.</span>
              </div>
              <div className={styles.colPoints}>2.450</div>
              <div className={styles.colAccuracy}>82%</div>
              <div className={styles.colStreak}>
                <Flame className={styles.streakIcon} fill="currentColor" /> 7 aciertos
              </div>
            </div>

            <div className={styles.tableRow}>
              <div className={`${styles.colPos} ${styles.colRank2}`}>2</div>
              <div className={styles.colUser}>
                <div className={styles.userAvatar}>
                  JP
                </div>
                <span className={styles.userName}>Juampi10</span>
              </div>
              <div className={styles.colPoints}>2.390</div>
              <div className={styles.colAccuracy}>79%</div>
              <div className={styles.colStreak}>
                <Flame className={styles.streakIcon} fill="currentColor" /> 4 aciertos
              </div>
            </div>

            <div className={styles.tableRow}>
              <div className={`${styles.colPos} ${styles.colRank3}`}>3</div>
              <div className={styles.colUser}>
                <div className={styles.userAvatar}>
                  LA
                </div>
                <span className={styles.userName}>Lia Alvarez</span>
              </div>
              <div className={styles.colPoints}>2.210</div>
              <div className={styles.colAccuracy}>76%</div>
              <div className={styles.colStreak}>
                <Flame className={styles.streakIcon} fill="currentColor" /> 3 aciertos
              </div>
            </div>

            <div className={styles.tableRow}>
              <div className={styles.colPos}>4</div>
              <div className={styles.colUser}>
                <div className={styles.userAvatar}>RS</div>
                <span className={styles.userName}>Rodrigo Sálvador</span>
              </div>
              <div className={styles.colPoints}>2.100</div>
              <div className={styles.colAccuracy}>74%</div>
              <div className={styles.colStreak}>
                <Flame className={styles.streakIcon} fill="currentColor" /> 2 aciertos
              </div>
            </div>

            {/* Ellipis row for UX showing gap */}
            <div className={styles.tableRow} style={{ opacity: 0.5 }}>
              <div className={styles.colPos} style={{ fontSize: '1rem' }}>...</div>
              <div className={styles.colUser}></div>
              <div className={styles.colPoints}></div>
              <div className={styles.colAccuracy}></div>
              <div className={styles.colStreak}></div>
            </div>

            {/* Current user highlighted row */}
            <div className={`${styles.tableRow} ${styles.rowHighlight}`}>
              <div className={styles.colPos}>18.402</div>
              <div className={styles.colUser}>
                <div className={styles.userAvatar} style={{backgroundColor: 'var(--color-primary)', color: '#000'}}>
                  TÚ
                </div>
                <span className={styles.userName}>tu_usuario</span>
                <span className={styles.userBadge}>TÚ</span>
              </div>
              <div className={styles.colPoints}>1.250</div>
              <div className={styles.colAccuracy}>61%</div>
              <div className={styles.colStreak}>
                <Flame className={styles.streakIcon} fill="currentColor" /> 1 acierto
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
