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
import clsx from "clsx";
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
import { getCountryName } from "../../../lib/i18n/countries";

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

// Result badge tone → Tailwind classes
const TONE_CLASS: Record<ReturnType<typeof getPredictionBadgeTone>, string> = {
  none: "bg-transparent border border-white/[0.18] text-white/60",
  neutral: "bg-transparent border border-white/[0.18] text-white/60",
  exact: "bg-[rgba(0,206,23,0.15)] border border-[rgba(0,206,23,0.5)] text-[#00CE17]",
  partial: "bg-[rgba(255,204,0,0.15)] border border-[rgba(255,204,0,0.5)] text-[#ffcc00]",
  miss: "bg-[rgba(213,2,4,0.15)] border border-[rgba(213,2,4,0.5)] text-[#ff4d4d]",
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
    const base = "inline-flex items-center justify-center min-w-[86px] px-2.5 py-1.5 rounded-md text-[0.64rem] font-black uppercase";
    if (isLive(row.fixture.status))
      return <span className={clsx(base, "text-primary border border-primary/[0.35] bg-primary/[0.08]")}>En vivo</span>;
    if (isFinished(row.fixture.status))
      return <span className={clsx(base, "bg-white/[0.055] border border-white/[0.11] text-white/58")}>Finalizado</span>;
    if (row.locked)
      return <span className={clsx(base, "bg-white/[0.055] border border-white/[0.11] text-white/58")}>Cerrado</span>;
    if (row.hasSavedPrediction)
      return <span className={clsx(base, "text-primary border border-primary/[0.35] bg-primary/[0.08]")}>Editable</span>;
    return <span className={clsx(base, "bg-white/[0.055] border border-white/[0.11] text-white/58")}>Pendiente</span>;
  };

  const renderResult = (row: MatchRow) => {
    if (!row.locked || row.homePred === null || row.awayPred === null) return null;

    const prediction = toPrediction(row);
    const tone = getPredictionBadgeTone(row.fixture, prediction);

    return (
      <span className={clsx(
        "inline-flex items-center justify-center min-w-[86px] px-2.5 py-1.5 rounded-md font-display text-[0.78rem] border border-transparent",
        TONE_CLASS[tone]
      )}>
        {isFinished(row.fixture.status) && row.fixture.homeScore !== null && row.fixture.awayScore !== null
          ? `${row.fixture.homeScore} - ${row.fixture.awayScore}`
          : "En juego"}
      </span>
    );
  };

  const renderRow = (row: MatchRow) => (
    <div
      key={row.fixtureId}
      className={clsx(
        "grid gap-4 items-center min-h-[92px] px-4 py-3.5 bg-white/[0.025] border border-transparent rounded-lg mb-1 transition-[background-color,border-color] duration-200 hover:bg-white/[0.055]",
        "[grid-template-columns:100px_minmax(0,1fr)_150px]",
        row.locked && "border-white/[0.04]",
        // Mobile: stack
        "max-[760px]:grid-cols-1 max-[760px]:gap-3"
      )}
    >
      <div className="flex flex-col gap-[5px] max-[760px]:items-center">
        <span className="text-[0.95rem] font-extrabold text-white">{row.time}</span>
        <span className="text-[0.66rem] text-white/55 leading-[1.25] font-bold">{row.phase}</span>
      </div>

      <div className="grid items-center gap-[18px] [grid-template-columns:minmax(0,1fr)_auto_minmax(0,1fr)] max-[760px]:gap-2">
        {/* Home team */}
        <div className="flex flex-col items-center gap-1 justify-self-end w-[110px] max-[760px]:w-[80px]">
          <div className="w-[30px] h-[30px] flex items-center justify-center flex-shrink-0">
            <TeamLogo name={row.fixture.homeTeam?.name} logoUrl={row.fixture.homeTeam?.logoUrl} size={30} />
          </div>
          <div className="h-[34px] w-full overflow-hidden flex items-center justify-center">
            <span className="text-xs text-center leading-tight font-bold text-white line-clamp-2 w-full">
              {getCountryName(row.fixture.homeTeam?.name)}
            </span>
          </div>
        </div>

        {/* Score inputs */}
        <div className="flex items-center justify-center gap-2 min-w-[100px] max-[760px]:min-w-0 max-[760px]:gap-1.5">
          <ScoreInput
            value={row.homePred}
            onChange={(n) => updatePred(row.fixtureId, "home", n)}
            readonly={row.locked}
          />
          <span className="text-[1.15rem] font-black text-white/35">-</span>
          <ScoreInput
            value={row.awayPred}
            onChange={(n) => updatePred(row.fixtureId, "away", n)}
            readonly={row.locked}
          />
        </div>

        {/* Away team */}
        <div className="flex flex-col items-center gap-1 justify-self-start w-[110px] max-[760px]:w-[80px]">
          <div className="w-[30px] h-[30px] flex items-center justify-center flex-shrink-0">
            <TeamLogo name={row.fixture.awayTeam?.name} logoUrl={row.fixture.awayTeam?.logoUrl} size={30} />
          </div>
          <div className="h-[34px] w-full overflow-hidden flex items-center justify-center">
            <span className="text-xs text-center leading-tight font-bold text-white line-clamp-2 w-full">
              {getCountryName(row.fixture.awayTeam?.name)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end justify-center gap-2 max-[760px]:items-center max-[760px]:flex-row max-[760px]:justify-center">
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
      <main className="flex-1 px-8 pt-6 pb-8 flex flex-col gap-6 relative max-[760px]:px-4 max-[760px]:pt-4 max-[760px]:pb-6">
        <AnimatePresence>
          {toast && (
            <motion.div
              className={clsx(
                "fixed top-7 right-7 z-[80] flex items-start gap-3.5 w-[min(420px,calc(100vw-56px))] p-4 rounded-[10px] shadow-[0_22px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset] overflow-hidden relative",
                toast.tone === "success"
                  ? "bg-[#111a12] border border-[rgba(0,206,23,0.32)] text-[#f1fff5] toast-bar-success"
                  : "bg-[#1e1112] border border-[rgba(213,2,4,0.36)] text-[#fff0f0] toast-bar-error"
              )}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              role="status"
            >
              <span className={clsx(
                "flex items-center justify-center w-[38px] h-[38px] rounded-full shrink-0",
                toast.tone === "success"
                  ? "bg-[rgba(0,206,23,0.13)] text-[#00CE17]"
                  : "bg-[rgba(213,2,4,0.15)] text-[#ff5c5c]"
              )}>
                {toast.tone === "success" ? (
                  <CheckCircle2 className="w-[21px] h-[21px]" />
                ) : (
                  <AlertCircle className="w-[21px] h-[21px]" />
                )}
              </span>
              <span className="flex min-w-0 flex-col gap-[3px]">
                <span className="text-white text-[0.92rem] font-black leading-[1.25]">
                  {toast.tone === "success" ? "Predicciones guardadas" : "No se pudo guardar"}
                </span>
                <span className="text-white/68 text-[0.82rem] font-semibold leading-[1.35]">{toast.message}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top bar: filter tabs + counter */}
        <div className="flex justify-between items-end border-b border-white/10 max-[760px]:flex-col max-[760px]:items-stretch max-[760px]:gap-2">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(item => (
              <button
                key={item.id}
                type="button"
                className={clsx(
                  "bg-transparent border-none text-[0.86rem] font-bold px-2 py-3 cursor-pointer relative transition-colors duration-200 whitespace-nowrap",
                  filter === item.id
                    ? "text-primary filter-tab-active-line"
                    : "text-white/56 hover:text-white/86"
                )}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-end pb-3 text-[0.75rem] text-white/60 leading-[1.4] whitespace-nowrap max-[760px]:items-start">
            <span>Predicciones guardadas</span>
            <span className="text-primary font-extrabold">{savedCount}/{matches.length} partidos</span>
          </div>
        </div>

        {/* Filter row: date select + nav + save */}
        <div className="flex justify-between items-center gap-4 max-[1100px]:flex-col max-[1100px]:items-stretch">
          <label className="flex items-center gap-2 px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.14] rounded-lg text-white text-[0.85rem] font-semibold min-w-[210px] max-[1100px]:w-full">
            <CalendarDays className="w-4 h-4 text-white/55 shrink-0" />
            <select
              className="flex-1 min-w-0 bg-transparent border-0 text-white outline-none font-[inherit] cursor-pointer"
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

          <div className="flex items-center gap-3 max-[1100px]:w-full max-[1100px]:justify-between">
            <button
              type="button"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-white/[0.12] bg-transparent text-white/68 cursor-pointer transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:not-disabled:bg-white/[0.06] hover:not-disabled:text-white"
              onClick={() => moveDate(-1)}
              disabled={dateOptions.length === 0}
              aria-label="Fecha anterior"
            >
              <ChevronLeft className="w-[18px] h-[18px]" />
            </button>
            <div className="flex items-center gap-2 min-w-[210px] justify-center px-[18px] py-2 bg-primary/[0.06] border border-primary/[0.28] rounded-[20px] text-primary text-[0.86rem] font-extrabold max-[1100px]:flex-1 max-[1100px]:min-w-0">
              <CalendarDays className="w-[18px] h-[18px]" />
              {selectedDate === "all" ? "Todas las fechas" : formatDateLabel(selectedDate)}
            </div>
            <button
              type="button"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-white/[0.12] bg-transparent text-white/68 cursor-pointer transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:not-disabled:bg-white/[0.06] hover:not-disabled:text-white"
              onClick={() => moveDate(1)}
              disabled={dateOptions.length === 0}
              aria-label="Fecha siguiente"
            >
              <ChevronRight className="w-[18px] h-[18px]" />
            </button>
          </div>

          <button
            className="flex items-center justify-center gap-2 min-w-[190px] px-5 py-3 bg-primary border-none rounded-lg text-black text-[0.9rem] font-extrabold cursor-pointer transition-[opacity,transform] duration-200 disabled:opacity-[0.42] disabled:cursor-not-allowed hover:not-disabled:opacity-[0.92] hover:not-disabled:-translate-y-px max-[1100px]:w-full"
            onClick={handleSave}
            disabled={!canSave}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 spin-animation" />
                Guardando
              </>
            ) : (
              "Guardar predicciones"
            )}
          </button>
        </div>

        {hasInvalidDirtyRow && (
          <div className="flex items-center gap-2 px-3 py-2.5 border border-[rgba(255,204,0,0.35)] rounded-lg bg-[rgba(255,204,0,0.08)] text-[#ffd75a] text-[0.83rem] font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Completá ambos marcadores para poder guardar.
          </div>
        )}

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3 max-[760px]:grid-cols-1">
          <div className="flex items-baseline gap-2 px-3.5 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg">
            <span className="font-display text-[1.35rem] font-black text-white">{validDirtyRows.length}</span>
            <span className="text-white/55 text-[0.78rem] font-bold">cambios listos</span>
          </div>
          <div className="flex items-baseline gap-2 px-3.5 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg">
            <span className="font-display text-[1.35rem] font-black text-white">{pendingCount}</span>
            <span className="text-white/55 text-[0.78rem] font-bold">pendientes</span>
          </div>
          <div className="flex items-baseline gap-2 px-3.5 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg">
            <span className="font-display text-[1.35rem] font-black text-white">{dateFilteredMatches.length}</span>
            <span className="text-white/55 text-[0.78rem] font-bold">en vista</span>
          </div>
        </div>

        <div>
          {/* Table columns header */}
          <div className="grid [grid-template-columns:100px_minmax(0,1fr)_150px] gap-4 px-4 pb-2 text-[0.7rem] font-extrabold text-white/[0.42] uppercase max-[760px]:hidden">
            <div>FECHA</div>
            <div className="text-center">PARTIDO Y PREDICCIÓN</div>
            <div className="text-center">ESTADO</div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-white/55">Cargando predicciones...</div>
          ) : matches.length === 0 ? (
            <div className="py-8 text-center text-white/55">No hay partidos disponibles.</div>
          ) : sectionRows.every(section => section.rows.length === 0) ? (
            <div className="py-8 text-center text-white/55">No hay predicciones con estos filtros.</div>
          ) : (
            sectionRows.map(section => (
              section.rows.length > 0 && (
                <section key={section.title} className="mb-6">
                  <div className="flex items-center justify-between gap-3 px-4 py-3 mb-2 text-white text-[0.95rem] font-extrabold border-b border-white/10">
                    <span>{section.title}</span>
                    <span className="text-primary font-display">{section.rows.length}</span>
                  </div>
                  {section.rows.map(renderRow)}
                </section>
              )
            ))
          )}
        </div>

        {/* Footer area */}
        <div className="flex justify-between items-center gap-4 mt-2 max-[1100px]:flex-col max-[1100px]:items-stretch">
          <div className="flex items-center gap-3 bg-primary/[0.05] border border-primary/[0.2] rounded-lg px-4 py-3 text-white/82 text-[0.85rem] font-semibold">
            <Info className="text-primary w-[18px] h-[18px] shrink-0" />
            Podés editar tus predicciones hasta el inicio de cada partido.
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-white/20 rounded-lg text-white text-[0.85rem] font-bold cursor-pointer transition-colors duration-200 hover:bg-white/[0.05]">
            <Trophy className="w-4 h-4 text-white/55" />
            Predicciones del torneo
          </button>
        </div>
      </main>
    </>
  );
}
