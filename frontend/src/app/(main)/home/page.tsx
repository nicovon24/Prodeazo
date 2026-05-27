"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Users,
  BarChart2,
  CalendarDays,
  CheckCircle,
  ArrowRight,
  History,
  Target,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { Header } from "../../../components/layout/Header";
import {
  fetchDashboardMe,
  fetchDashboardPanels,
  type DashboardMe,
  type DashboardPanels,
} from "../../../api/dashboard";
import {
  PendingMatchRow,
  RecentResultRow,
  UpcomingMatchRow,
} from "@/components/home/MatchPanelRows";
import { StatsCardSkeleton } from "@/components/skeletons/StatsCardSkeleton";
import { MatchPanelSkeleton } from "@/components/skeletons/MatchPanelSkeleton";
import { motion } from "framer-motion";
import { staggerContainer, scaleIn } from "@/lib/animations";

function formatCount(n: number): string {
  return n.toLocaleString("es-AR");
}

export default function HomePage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardMe | null>(null);
  const [panels, setPanels] = useState<DashboardPanels | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPanels, setLoadingPanels] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingStats(true);
    setLoadingPanels(true);

    Promise.all([fetchDashboardMe(), fetchDashboardPanels()])
      .then(([stats, panelData]) => {
        if (!cancelled) {
          setDashboard(stats);
          setPanels(panelData);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDashboard(null);
          setPanels(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingStats(false);
          setLoadingPanels(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const participantCount = dashboard?.participantCount ?? 0;
  const globalRank = dashboard?.globalRank ?? null;
  const totalPoints = dashboard?.totalPoints ?? 0;
  const correctPredictions = dashboard?.correctPredictions ?? 0;
  const precision = dashboard?.precision ?? 0;

  return (
    <>
      <Header
        title="Inicio"
        subtitle={`Bienvenido de vuelta, ${user?.name ?? "Usuario"}. Este es tu resumen.`}
      />
      <main className="flex-1 px-4 md:px-8 pt-4 md:pt-6 pb-4 md:pb-6 flex flex-col gap-4">
        {/* Top Stat Cards */}
        {loadingStats ? (
          <StatsCardSkeleton />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Global Pos */}
            <motion.div variants={scaleIn} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[0.7rem] font-bold uppercase text-white tracking-[0.02em]">
                <Globe className="w-4 h-4 text-primary" />
                Mi posición global
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-display text-[1.7rem] font-extrabold text-white leading-none mb-0.5">
                    {globalRank !== null ? `${globalRank}°` : "—"}
                  </div>
                  <div className="text-[0.7rem] text-white/50">
                    {globalRank !== null ? `de ${formatCount(participantCount)} participantes` : "Datos no disponibles"}
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-2">
                <Link
                  href="/rankings"
                  className="w-full flex items-center justify-center p-2 min-h-[36px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-[0.78rem] font-semibold cursor-pointer transition-all duration-200 no-underline hover:bg-white/[0.08]"
                >
                  Ver ranking
                </Link>
              </div>
            </motion.div>

            {/* Leagues Pos */}
            <motion.div variants={scaleIn} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[0.7rem] font-bold uppercase text-white tracking-[0.02em]">
                <Users className="w-4 h-4 text-primary" />
                Mi posición en ligas
              </div>
              <div className="flex justify-between items-start">
                <p className="text-[0.82rem] leading-[1.45] text-white/65 max-w-[220px]">
                  Aún no te uniste a ninguna liga.{" "}
                  <Link href="/leagues" className="text-primary font-bold underline underline-offset-[3px] hover:text-white">
                    ¡Busca una liga!
                  </Link>
                </p>
              </div>
              <div className="mt-auto pt-2">
                <Link
                  href="/leagues"
                  className="w-full flex items-center justify-center p-2 min-h-[36px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-[0.78rem] font-semibold cursor-pointer transition-all duration-200 no-underline hover:bg-white/[0.08]"
                >
                  Ver ligas
                </Link>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={scaleIn} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-2 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-[0.7rem] font-bold uppercase text-white tracking-[0.02em]">
                <BarChart2 className="w-4 h-4 text-primary" />
                Mis estadísticas
              </div>
              <div className="grid grid-cols-3 gap-2 w-full">
                <div className="flex flex-col">
                  <span className="text-[0.6rem] uppercase text-white/50 font-semibold mb-1">Puntos</span>
                  <span className="font-display text-xl font-extrabold text-primary">{formatCount(totalPoints)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[0.6rem] uppercase text-white/50 font-semibold mb-1">Acertados</span>
                  <span className="font-display text-xl font-extrabold text-primary">{formatCount(correctPredictions)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[0.6rem] uppercase text-white/50 font-semibold mb-1">Precisión</span>
                  <span className="font-display text-xl font-extrabold text-primary">{`${precision}%`}</span>
                </div>
              </div>
              <div className="mt-auto pt-2">
                <Link
                  href="/rankings"
                  className="w-full flex items-center justify-center p-2 min-h-[36px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-[0.78rem] font-semibold cursor-pointer transition-all duration-200 no-underline hover:bg-white/[0.08]"
                >
                  Ver detalles
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Paneles centrales — datos reales */}
        {loadingPanels ? (
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MatchPanelSkeleton />
            <MatchPanelSkeleton />
            <MatchPanelSkeleton />
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl flex flex-col min-h-0 overflow-hidden">
              <div className="flex-none px-3 pt-3 pb-2.5 flex items-center gap-2 text-[0.72rem] font-bold uppercase text-white border-b border-white/[0.05]">
                <History className="w-4 h-4 text-primary" />
                Últimos resultados
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col p-2 gap-1.5">
                {panels?.recentResults.length ? (
                  panels.recentResults.map((m) => (
                    <RecentResultRow key={m.fixtureId} match={m} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center px-4 py-6 gap-2 min-h-[140px]">
                    <Target className="w-9 h-9 text-white/20" />
                    <p className="text-[0.8rem] leading-[1.4] text-white/55 max-w-[220px]">
                      ¡Aún no participaste en ninguna predicción!
                    </p>
                    <Link href="/predictions" className="text-primary text-[0.8rem] font-bold underline underline-offset-[3px] hover:text-white">
                      Predecí un partido
                    </Link>
                  </div>
                )}
              </div>
              {(panels?.recentResults.length ?? 0) > 0 && (
                <div className="flex-none p-2.5 border-t border-white/[0.05]">
                  <Link
                    href="/predictions"
                    className="w-full block text-center p-2 min-h-[34px] leading-[18px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-[0.75rem] font-semibold no-underline hover:bg-white/[0.08]"
                  >
                    Ir a mis predicciones
                  </Link>
                </div>
              )}
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl flex flex-col min-h-0 overflow-hidden">
              <div className="flex-none px-3 pt-3 pb-2.5 flex items-center gap-2 text-[0.72rem] font-bold uppercase text-white border-b border-white/[0.05]">
                <CalendarDays className="w-4 h-4 text-primary" />
                Próximos con tu predicción
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col p-2 gap-1.5">
                {panels?.upcomingWithPrediction.length ? (
                  panels.upcomingWithPrediction.map((m) => (
                    <UpcomingMatchRow key={m.fixtureId} match={m} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center px-4 py-6 gap-2 min-h-[140px]">
                    <CalendarDays className="w-9 h-9 text-white/20" />
                    <p className="text-[0.8rem] leading-[1.4] text-white/55 max-w-[220px]">
                      No tenés predicciones en partidos próximos o en vivo.
                    </p>
                  </div>
                )}
              </div>
              {(panels?.upcomingWithPrediction.length ?? 0) > 0 && (
                <div className="flex-none p-2.5 border-t border-white/[0.05]">
                  <Link
                    href="/fixture"
                    className="w-full block text-center p-2 min-h-[34px] leading-[18px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-[0.75rem] font-semibold no-underline hover:bg-white/[0.08]"
                  >
                    Ver fixture completo
                  </Link>
                </div>
              )}
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl flex flex-col min-h-0 overflow-hidden md:col-span-2 lg:col-span-1">
              <div className="flex-none px-3 pt-3 pb-2.5 flex items-center gap-2 text-[0.72rem] font-bold uppercase text-white border-b border-white/[0.05]">
                <CheckCircle className="w-4 h-4 text-primary" />
                Pendientes de predicción
                {(panels?.pendingPredictions.length ?? 0) > 0 && (
                  <span className="bg-[#D50204] text-white text-[0.6rem] font-bold h-4.5 min-w-[18px] rounded-full flex items-center justify-center px-1.5 ml-auto">
                    {panels!.pendingPredictions.length}
                  </span>
                )}
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col p-2 gap-1.5">
                {panels?.pendingPredictions.length ? (
                  panels.pendingPredictions.slice(0, 4).map((m) => (
                    <div key={m.fixtureId} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <PendingMatchRow match={m} />
                      </div>
                      <Link
                        href="/predictions"
                        className="bg-primary text-black border-none rounded-md text-[0.7rem] font-bold px-3 py-1.5 min-h-[32px] flex items-center cursor-pointer transition-opacity duration-200 no-underline shrink-0 hover:opacity-90"
                      >
                        Predecir
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center px-4 py-6 gap-2 min-h-[140px]">
                    <CheckCircle className="w-9 h-9 text-white/20" />
                    <p className="text-[0.8rem] leading-[1.4] text-white/55 max-w-[220px]">
                      ¡Ya no te quedan partidos por predecir!
                    </p>
                  </div>
                )}
              </div>
              {(panels?.pendingPredictions.length ?? 0) > 4 && (
                <div className="flex-none p-2.5 border-t border-white/[0.05]">
                  <Link
                    href="/predictions"
                    className="w-full block text-center p-2 min-h-[34px] leading-[18px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-[0.75rem] font-semibold no-underline hover:bg-white/[0.08]"
                  >
                    Ver todos los pendientes ({panels!.pendingPredictions.length})
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CTA Banners */}
        <div className="flex-none grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/predictions"
            className="rounded-xl p-4 flex flex-col min-h-[96px] relative overflow-hidden no-underline transition-transform duration-200 hover:-translate-y-0.5 bg-gradient-to-br from-[#AFE805] to-[#85b300] text-black"
          >
            <h3 className="font-display text-[1rem] font-extrabold uppercase mb-1 z-[2]">Mi Prode</h3>
            <p className="text-[0.78rem] font-medium max-w-[75%] opacity-90 z-[2]">Hacé tus predicciones y seguí tu progreso.</p>
            <div className="absolute bottom-4 right-4 w-8 h-8 bg-black text-[#AFE805] rounded-lg flex items-center justify-center z-[2]">
              <ArrowRight className="w-5 h-5" />
            </div>
            <img src="/logo-mundial-2026.svg" className="absolute bottom-[-16px] right-[-16px] w-[90px] h-[90px] opacity-20 z-[1]" alt="" />
          </Link>

          <Link
            href="/rankings"
            className="rounded-xl p-4 flex flex-col min-h-[96px] relative overflow-hidden no-underline transition-transform duration-200 hover:-translate-y-0.5 bg-gradient-to-br from-[#0052FF] to-[#001AAC] text-white"
          >
            <h3 className="font-display text-[1rem] font-extrabold uppercase mb-1 z-[2]">Rankings</h3>
            <p className="text-[0.78rem] font-medium max-w-[75%] opacity-90 z-[2]">Compará tu posición con otros participantes.</p>
            <div className="absolute bottom-4 right-4 w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center z-[2]">
              <ArrowRight className="w-5 h-5" />
            </div>
            <BarChart2 className="absolute bottom-[-16px] right-[-16px] w-[90px] h-[90px] opacity-20 z-[1]" />
          </Link>

          <Link
            href="/leagues"
            className="rounded-xl p-4 flex flex-col min-h-[96px] relative overflow-hidden no-underline transition-transform duration-200 hover:-translate-y-0.5 bg-gradient-to-br from-[#FF3B30] to-[#D50204] text-white"
          >
            <h3 className="font-display text-[1rem] font-extrabold uppercase mb-1 z-[2]">Ligas</h3>
            <p className="text-[0.78rem] font-medium max-w-[75%] opacity-90 z-[2]">Creá o unite a ligas y competí con tus amigos.</p>
            <div className="absolute bottom-4 right-4 w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center z-[2]">
              <ArrowRight className="w-5 h-5" />
            </div>
            <Users className="absolute bottom-[-16px] right-[-16px] w-[90px] h-[90px] opacity-20 z-[1]" />
          </Link>
        </div>
      </main>
    </>
  );
}
