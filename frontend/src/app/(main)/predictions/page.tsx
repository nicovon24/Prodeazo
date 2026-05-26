"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "../../../components/layout/Header";
import { ScoreInput } from "../../../components/ScoreInput";
import { TeamLogo } from "../../../components/TeamLogo";
import { useTournamentStore } from "../../../store/useTournamentStore";
import { fetchFixtures, type Fixture } from "../../../api/fixtures";
import { fetchPredictions, savePrediction, type Prediction } from "../../../api/predictions";
import {
  formatFixturePhase,
  getPredictionBadgeTone,
  sortFixtures,
} from "../../../lib/fixture-utils";
import styles from "./predictions.module.css";

type PredictionFilter = "all" | "saved" | "pending" | "results";
type ToastTone = "success" | "error";

interface ToastState {
  tone: ToastTone;
  message: string;
}

interface MatchRow {
  fixture: Fixture;
  fixtureId: number;
  time: string;
  dateKey: string;
  phase: string;
  homePred: number | null;
  awayPred: number | null;
  originalHomePred: number | null;
  originalAwayPred: number | null;
  locked: boolean;
  hasSavedPrediction: boolean;
}

const FILTERS: { id: PredictionFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "saved", label: "Predicciones hechas" },
  { id: "pending", label: "Predicciones pendientes" },
  { id: "results", label: "Resultados" },
];

const TONE_CLASS: Record<ReturnType<typeof getPredictionBadgeTone>, string> = {
  none: styles.resultNeutral,
  neutral: styles.resultNeutral,
  exact: styles.resultExact,
  partial: styles.resultPartial,
  miss: styles.resultMiss,
};

function isPredictionOpen(status: string): boolean {
  return status === "not_started" || status === "ns";
}

function isFinished(status: string): boolean {
  return status === "finished" || status === "ft";
}

function isLive(status: string): boolean {
  return status === "in_progress" || status === "inprogress";
}

function formatDateLabel(dateStr: string) {
  if (dateStr === "Sin fecha") return dateStr;
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return dateStr;
  }
}

function toPrediction(row: MatchRow): Prediction | undefined {
  if (row.homePred === null || row.awayPred === null) return undefined;
  return {
    id: "",
    fixtureId: row.fixtureId,
    homeGoals: row.homePred,
    awayGoals: row.awayPred,
    points: null,
  };
}

function hasChanged(row: MatchRow): boolean {
  return row.homePred !== row.originalHomePred || row.awayPred !== row.originalAwayPred;
}

export default function PredictionsPage() {
  const activeTournamentId = useTournamentStore(s => s.activeTournamentId);
  const [filter, setFilter] = useState<PredictionFilter>("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const buildRows = useCallback((fixtures: Fixture[], predictions: Prediction[]): MatchRow[] => {
    const predMap = new Map(predictions.map(p => [p.fixtureId, p]));

    return sortFixtures(fixtures, "recommended").map(f => {
      const pred = predMap.get(f.id);
      const date = f.date ? new Date(f.date) : null;

      return {
        fixture: f,
        fixtureId: f.id,
        time: date
          ? date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
          : "--:--",
        dateKey: date ? date.toISOString().slice(0, 10) : "Sin fecha",
        phase: formatFixturePhase(f),
        homePred: pred?.homeGoals ?? null,
        awayPred: pred?.awayGoals ?? null,
        originalHomePred: pred?.homeGoals ?? null,
        originalAwayPred: pred?.awayGoals ?? null,
        locked: !isPredictionOpen(f.status),
        hasSavedPrediction: Boolean(pred),
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
        setSelectedDate("all");
      })
      .catch(err => {
        console.error(err);
        setToast({ tone: "error", message: "No pudimos cargar tus predicciones." });
      })
      .finally(() => setLoading(false));
  }, [activeTournamentId, buildRows]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const dateOptions = useMemo(() => {
    return Array.from(new Set(matches.map(m => m.dateKey))).sort((a, b) => {
      if (a === "Sin fecha") return 1;
      if (b === "Sin fecha") return -1;
      return a.localeCompare(b);
    });
  }, [matches]);

  const dateFilteredMatches = useMemo(() => {
    if (selectedDate === "all") return matches;
    return matches.filter(m => m.dateKey === selectedDate);
  }, [matches, selectedDate]);

  const sectionRows = useMemo(() => {
    const saved = dateFilteredMatches.filter(m => !m.locked && m.hasSavedPrediction);
    const pending = dateFilteredMatches.filter(m => !m.locked && !m.hasSavedPrediction);
    const results = dateFilteredMatches.filter(m => m.locked && m.hasSavedPrediction);

    if (filter === "saved") return [{ title: "Predicciones hechas", rows: saved }];
    if (filter === "pending") return [{ title: "Predicciones pendientes", rows: pending }];
    if (filter === "results") return [{ title: "Resultados de predicciones", rows: results }];

    return [
      { title: "Predicciones hechas", rows: saved },
      { title: "Predicciones pendientes", rows: pending },
      { title: "Resultados de predicciones", rows: results },
    ];
  }, [dateFilteredMatches, filter]);

  const validDirtyRows = matches.filter(m =>
    !m.locked &&
    hasChanged(m) &&
    m.homePred !== null &&
    m.awayPred !== null
  );

  const hasInvalidDirtyRow = matches.some(m =>
    !m.locked &&
    hasChanged(m) &&
    (m.homePred === null || m.awayPred === null)
  );

  const savedCount = matches.filter(m => m.hasSavedPrediction).length;
  const pendingCount = matches.filter(m => !m.locked && !m.hasSavedPrediction).length;
  const canSave = validDirtyRows.length > 0 && !saving;

  const updatePred = (fixtureId: number, team: "home" | "away", val: number | null) => {
    setMatches(prev =>
      prev.map(m => {
        if (m.fixtureId !== fixtureId || m.locked) return m;

        const nextHome = team === "home" ? val : m.homePred;
        const nextAway = team === "away" ? val : m.awayPred;

        if (val === null) {
          return { ...m, homePred: nextHome, awayPred: nextAway };
        }

        return {
          ...m,
          homePred: nextHome === null ? 0 : nextHome,
          awayPred: nextAway === null ? 0 : nextAway,
        };
      }),
    );
  };

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      await Promise.all(
        validDirtyRows.map(m => savePrediction(m.fixtureId, m.homePred!, m.awayPred!)),
      );

      const savedIds = new Set(validDirtyRows.map(m => m.fixtureId));
      setMatches(prev =>
        prev.map(m =>
          savedIds.has(m.fixtureId)
            ? {
                ...m,
                originalHomePred: m.homePred,
                originalAwayPred: m.awayPred,
                hasSavedPrediction: true,
              }
            : m,
        ),
      );
      setToast({ tone: "success", message: "Tus predicciones se guardaron correctamente." });
    } catch (err) {
      console.error(err);
      setToast({ tone: "error", message: "No pudimos guardar tus predicciones. Probá nuevamente." });
    } finally {
      setSaving(false);
    }
  };

  const moveDate = (direction: -1 | 1) => {
    if (dateOptions.length === 0) return;
    if (selectedDate === "all") {
      setSelectedDate(direction > 0 ? dateOptions[0] : dateOptions[dateOptions.length - 1]);
      return;
    }

    const currentIndex = dateOptions.indexOf(selectedDate);
    const nextIndex = Math.min(dateOptions.length - 1, Math.max(0, currentIndex + direction));
    setSelectedDate(dateOptions[nextIndex] ?? "all");
  };

  const renderStatus = (row: MatchRow) => {
    if (isLive(row.fixture.status)) return <span className={`${styles.statusBadge} ${styles.statusLive}`}>En vivo</span>;
    if (isFinished(row.fixture.status)) return <span className={styles.statusBadge}>Finalizado</span>;
    if (row.locked) return <span className={styles.statusBadge}>Cerrado</span>;
    if (row.hasSavedPrediction) return <span className={`${styles.statusBadge} ${styles.statusSaved}`}>Editable</span>;
    return <span className={styles.statusBadge}>Pendiente</span>;
  };

  const renderResult = (row: MatchRow) => {
    if (!row.locked || row.homePred === null || row.awayPred === null) return null;

    const prediction = toPrediction(row);
    const tone = getPredictionBadgeTone(row.fixture, prediction);

    return (
      <span className={`${styles.resultBadge} ${TONE_CLASS[tone]}`}>
        {isFinished(row.fixture.status) && row.fixture.homeScore !== null && row.fixture.awayScore !== null
          ? `${row.fixture.homeScore} - ${row.fixture.awayScore}`
          : "En juego"}
      </span>
    );
  };

  const renderRow = (row: MatchRow) => (
    <div key={row.fixtureId} className={`${styles.matchRow} ${row.locked ? styles.matchRowLocked : ""}`}>
      <div className={styles.timeCol}>
        <span className={styles.matchTime}>{row.time}</span>
        <span className={styles.matchPhase}>{row.phase}</span>
      </div>

      <div className={styles.matchMain}>
        <div className={`${styles.team} ${styles.teamRight}`}>
          <span className={styles.teamName}>
            {row.fixture.homeTeam?.shortName ?? row.fixture.homeTeam?.name ?? "?"}
          </span>
          <TeamLogo name={row.fixture.homeTeam?.name} logoUrl={row.fixture.homeTeam?.logoUrl} size={30} />
        </div>

        <div className={styles.scoreInputCol}>
          <ScoreInput
            value={row.homePred}
            onChange={(n) => updatePred(row.fixtureId, "home", n)}
            readonly={row.locked}
          />
          <span className={styles.dash}>-</span>
          <ScoreInput
            value={row.awayPred}
            onChange={(n) => updatePred(row.fixtureId, "away", n)}
            readonly={row.locked}
          />
        </div>

        <div className={`${styles.team} ${styles.teamLeft}`}>
          <TeamLogo name={row.fixture.awayTeam?.name} logoUrl={row.fixture.awayTeam?.logoUrl} size={30} />
          <span className={styles.teamName}>
            {row.fixture.awayTeam?.shortName ?? row.fixture.awayTeam?.name ?? "?"}
          </span>
        </div>
      </div>

      <div className={styles.statusCol}>
        {renderStatus(row)}
        {renderResult(row)}
      </div>
    </div>
  );

  return (
    <>
      <Header
        title="Predicciones"
        subtitle="Hacé tus predicciones para cada partido del torneo."
      />
      <main className={styles.main}>
        <AnimatePresence>
          {toast && (
            <motion.div
              className={`${styles.toast} ${toast.tone === "success" ? styles.toastSuccess : styles.toastError}`}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              role="status"
            >
              <span className={styles.toastIconWrap}>
                {toast.tone === "success" ? (
                  <CheckCircle2 className={styles.toastIcon} />
                ) : (
                  <AlertCircle className={styles.toastIcon} />
                )}
              </span>
              <span className={styles.toastContent}>
                <span className={styles.toastTitle}>
                  {toast.tone === "success" ? "Predicciones guardadas" : "No se pudo guardar"}
                </span>
                <span className={styles.toastMessage}>{toast.message}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.topBar}>
          <div className={styles.filterTabs}>
            {FILTERS.map(item => (
              <button
                key={item.id}
                type="button"
                className={`${styles.filterTab} ${filter === item.id ? styles.filterTabActive : ""}`}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className={styles.counterInfo}>
            <span>Predicciones guardadas</span>
            <span className={styles.counterValue}>{savedCount}/{matches.length} partidos</span>
          </div>
        </div>

        <div className={styles.filterRow}>
          <label className={styles.dateFilter}>
            <CalendarDays className={styles.dateFilterIcon} />
            <select
              className={styles.dateSelect}
              value={selectedDate}
              onChange={event => setSelectedDate(event.target.value)}
            >
              <option value="all">Todas las fechas</option>
              {dateOptions.map(dateKey => (
                <option key={dateKey} value={dateKey}>
                  {formatDateLabel(dateKey)}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.dateNav}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => moveDate(-1)}
              disabled={dateOptions.length === 0}
              aria-label="Fecha anterior"
            >
              <ChevronLeft className={styles.navBtnIcon} />
            </button>
            <div className={styles.currentDateLabel}>
              <CalendarDays className={styles.navBtnIcon} />
              {selectedDate === "all" ? "Todas las fechas" : formatDateLabel(selectedDate)}
            </div>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => moveDate(1)}
              disabled={dateOptions.length === 0}
              aria-label="Fecha siguiente"
            >
              <ChevronRight className={styles.navBtnIcon} />
            </button>
          </div>

          <button className={styles.saveBtn} onClick={handleSave} disabled={!canSave}>
            {saving ? (
              <>
                <Loader2 className={styles.spinner} />
                Guardando
              </>
            ) : (
              "Guardar predicciones"
            )}
          </button>
        </div>

        {hasInvalidDirtyRow && (
          <div className={styles.inlineWarning}>
            <AlertCircle className={styles.inlineWarningIcon} />
            Completá ambos marcadores para poder guardar.
          </div>
        )}

        <div className={styles.summaryRow}>
          <div>
            <span className={styles.summaryValue}>{validDirtyRows.length}</span>
            <span className={styles.summaryLabel}>cambios listos</span>
          </div>
          <div>
            <span className={styles.summaryValue}>{pendingCount}</span>
            <span className={styles.summaryLabel}>pendientes</span>
          </div>
          <div>
            <span className={styles.summaryValue}>{dateFilteredMatches.length}</span>
            <span className={styles.summaryLabel}>en vista</span>
          </div>
        </div>

        <div>
          <div className={styles.tableColumns}>
            <div>FECHA</div>
            <div className={styles.colCenter}>PARTIDO Y PREDICCIÓN</div>
            <div className={styles.colCenter}>ESTADO</div>
          </div>

          {loading ? (
            <div className={styles.tableMessage}>Cargando predicciones...</div>
          ) : matches.length === 0 ? (
            <div className={styles.tableMessage}>No hay partidos disponibles.</div>
          ) : sectionRows.every(section => section.rows.length === 0) ? (
            <div className={styles.tableMessage}>No hay predicciones con estos filtros.</div>
          ) : (
            sectionRows.map(section => (
              section.rows.length > 0 && (
                <section key={section.title} className={styles.predictionSection}>
                  <div className={styles.sectionHeader}>
                    <span>{section.title}</span>
                    <span>{section.rows.length}</span>
                  </div>
                  {section.rows.map(renderRow)}
                </section>
              )
            ))
          )}
        </div>

        <div className={styles.footerArea}>
          <div className={styles.infoBanner}>
            <Info className={styles.infoBannerIcon} />
            Podés editar tus predicciones hasta el inicio de cada partido.
          </div>

          <button className={styles.secondaryDropdown}>
            <Trophy className={styles.dateFilterIcon} />
            Predicciones del torneo
          </button>
        </div>
      </main>
    </>
  );
}
