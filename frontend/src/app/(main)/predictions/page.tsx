"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Trophy
} from "lucide-react";
import { Header } from "../../../components/layout/Header";
import { ScoreInput } from "../../../components/ScoreInput";
import { useTournamentStore } from "../../../store/useTournamentStore";
import { fetchFixtures, type Fixture } from "../../../api/fixtures";
import { fetchPredictions, savePrediction, type Prediction } from "../../../api/predictions";
import styles from "./predictions.module.css";

interface MatchRow {
  fixtureId: number;
  time: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  homePred: number | null;
  awayPred: number | null;
  locked: boolean;
  dateKey: string;
}

export default function PredictionsPage() {
  const activeTournamentId = useTournamentStore(s => s.activeTournamentId);
  const [activeTab, setActiveTab] = useState("Por partidos");
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const buildRows = useCallback((fixtures: Fixture[], predictions: Prediction[]): MatchRow[] => {
    const predMap = new Map(predictions.map(p => [p.fixtureId, p]));
    return fixtures.map(f => {
      const pred = predMap.get(f.id);
      const date = f.date ? new Date(f.date) : null;
      return {
        fixtureId: f.id,
        time: date
          ? date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
          : '--:--',
        round: f.round ?? f.groupLabel ?? '',
        homeTeam: f.homeTeam?.name ?? '?',
        awayTeam: f.awayTeam?.name ?? '?',
        homePred: pred?.homeGoals ?? null,
        awayPred: pred?.awayGoals ?? null,
        locked: false,
        dateKey: date ? date.toISOString().slice(0, 10) : 'Sin fecha',
      };
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchFixtures(activeTournamentId),
      fetchPredictions(activeTournamentId),
    ])
      .then(([fixtures, predictions]) => {
        setMatches(buildRows(
          Array.isArray(fixtures) ? fixtures : [],
          Array.isArray(predictions) ? predictions : [],
        ));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTournamentId, buildRows]);

  const updatePred = (fixtureId: number, team: 'home' | 'away', val: number) => {
    setMatches(prev =>
      prev.map(m =>
        m.fixtureId === fixtureId
          ? { ...m, [team === 'home' ? 'homePred' : 'awayPred']: val }
          : m,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        matches
          .filter(m => m.homePred !== null && m.awayPred !== null && !m.locked)
          .map(m => savePrediction(m.fixtureId, m.homePred!, m.awayPred!)),
      );
      alert("Predicciones guardadas exitosamente!");
    } catch (err) {
      console.error(err);
      alert("Error al guardar predicciones.");
    } finally {
      setSaving(false);
    }
  };

  // Group by date
  const grouped = matches.reduce<Record<string, MatchRow[]>>((acc, m) => {
    if (!acc[m.dateKey]) acc[m.dateKey] = [];
    acc[m.dateKey].push(m);
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

  const savedCount = matches.filter(m => m.homePred !== null && m.awayPred !== null).length;

  return (
    <>
      <Header
        title="Predicciones"
        subtitle="Hacé tus predicciones para cada partido del torneo."
      />
      <main className={styles.main}>
        {/* Top Tab Bar & Stats */}
        <div className={styles.topBar}>
          <div className={styles.tabBar}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'Por partidos' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('Por partidos')}
            >
              Por partidos
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'Por fase' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('Por fase')}
            >
              Por fase
            </button>
          </div>
          <div className={styles.counterInfo}>
            <span>Predicciones guardadas</span>
            <span className={styles.counterValue}>{savedCount}/{matches.length} partidos</span>
          </div>
        </div>

        {/* Filter Row */}
        <div className={styles.filterRow}>
          <button className={styles.dateFilter}>
            <CalendarDays className={styles.dateFilterIcon} />
            Todas las fechas
            <ChevronDown className={styles.dateFilterIcon} />
          </button>

          <div className={styles.dateNav}>
            <button className={styles.navBtn}><ChevronLeft className={styles.navBtnIcon} /></button>
            <div className={styles.currentDateLabel}>
              <CalendarDays className={styles.navBtnIcon} />
              {Object.keys(grouped)[0] ? formatDateLabel(Object.keys(grouped)[0]) : 'Cargando...'}
            </div>
            <button className={styles.navBtn}><ChevronRight className={styles.navBtnIcon} /></button>
          </div>

          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar predicciones'}
          </button>
        </div>

        {/* Matches Grid */}
        <div>
          <div className={styles.tableColumns}>
            <div>FECHA</div>
            <div className={styles.colCenter}>PARTIDO</div>
            <div className={styles.colCenter}>TU PREDICCIÓN</div>
            <div></div>
            <div></div>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              Cargando predicciones...
            </div>
          ) : matches.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              No hay partidos disponibles.
            </div>
          ) : (
            Object.entries(grouped).map(([dateKey, dayMatches]) => (
              <div key={dateKey} className={styles.dateGroup}>
                <div className={styles.dateHeader}>
                  <CalendarDays className={styles.dateIcon} />
                  {formatDateLabel(dateKey)}
                </div>

                {dayMatches.map(m => (
                  <div key={m.fixtureId} className={styles.matchRow}>
                    <div className={styles.timeCol}>
                      <span className={styles.matchTime}>{m.time}</span>
                      <span className={styles.matchStadium}>{m.round}</span>
                    </div>
                    <div className={styles.teamsCol}>
                      <div className={`${styles.team} ${styles.teamRight}`}>
                        <span>{m.homeTeam}</span>
                      </div>
                      <span className={styles.vsSpan}>VS</span>
                      <div className={`${styles.team} ${styles.teamLeft}`}>
                        <span>{m.awayTeam}</span>
                      </div>
                    </div>
                    <div className={styles.scoreInputCol}>
                      <ScoreInput
                        value={m.homePred}
                        onChange={(n) => updatePred(m.fixtureId, 'home', n)}
                        readonly={m.locked}
                      />
                      <span className={styles.dash}>-</span>
                      <ScoreInput
                        value={m.awayPred}
                        onChange={(n) => updatePred(m.fixtureId, 'away', n)}
                        readonly={m.locked}
                      />
                    </div>
                    <div className={styles.statusCol}>
                      <span className={styles.statusColBadge}>POR JUGAR</span>
                    </div>
                    <div className={styles.chevronCol}>
                      <ChevronRight className={styles.rowChevron} />
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer Area */}
        <div className={styles.footerArea}>
          <div className={styles.infoBanner}>
            <Info className={styles.infoBannerIcon} />
            Podés editar tus predicciones hasta el inicio de cada partido.
          </div>

          <button className={styles.secondaryDropdown}>
            <Trophy className={styles.dateFilterIcon} />
            Predicciones del torneo
            <ChevronDown className={styles.dateFilterIcon} />
          </button>
        </div>
      </main>
    </>
  );
}
