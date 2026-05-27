"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  PlusSquare,
  Target,
  Info,
  Clock,
  CalendarDays,
  Users,
  ShieldCheck,
  ChevronRight,
  Star,
} from "lucide-react";
import { Header } from "../../../components/layout/Header";
import styles from "./rules.module.css";

const TABS = [
  "Sistema de puntos",
  "Fechas y plazos",
  "Predicciones",
  "Desempates",
  "Ligas",
  "Otras reglas"
];

export default function RulesPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <>
      <Header
        title="Reglas"
        subtitle="Todo lo que necesitás saber para competir en Prodeazo."
      />
      <main className={styles.main}>
        {/* Navigation Tabs */}
        <div className={styles.tabBar}>
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <p className={styles.tabDesc}>
          Conocé cómo se calculan los puntos y qué acciones te hacen sumar en Prodeazo.
        </p>

        {/* ── Sistema de puntos ── */}
        {activeTab === "Sistema de puntos" && (
          <>
            <div className={styles.contentArea}>
              {/* Left Column - Scoring Rules */}
              <div className={styles.leftCol}>
                <div>
                  <h2 className={styles.sectionHeader}>
                    <Trophy className={styles.sectionIcon} />
                    ¿Cómo se suman puntos?
                  </h2>
                  <p className={styles.sectionP}>
                    Tus puntos se basan en qué tan acertadas son tus predicciones de resultado. Así es como funciona:
                  </p>
                </div>

                <div className={styles.pointList}>
                  <div className={styles.pointRow}>
                    <div className={styles.pointRowIcon}><PlusSquare className="w-5 h-5" /></div>
                    <div className={styles.pointRowContent}>
                      <div className={styles.pointRowTitle}>Resultado Exacto</div>
                      <div className={styles.pointRowDesc}>Acertaste el marcador exacto.</div>
                    </div>
                    <div className={styles.pointRowValue}>+5 pts</div>
                  </div>

                  <div className={styles.pointRow}>
                    <div className={styles.pointRowIcon}><Target className="w-5 h-5" /></div>
                    <div className={styles.pointRowContent}>
                      <div className={styles.pointRowTitle}>Ganador Correcto</div>
                      <div className={styles.pointRowDesc}>Acertaste quién gana (o si hay empate) pero no el marcador exacto.</div>
                    </div>
                    <div className={styles.pointRowValue}>+3 pts</div>
                  </div>

                  <div className={styles.pointRow}>
                    <div className={styles.pointRowIcon}><Star className="w-5 h-5" /></div>
                    <div className={styles.pointRowContent}>
                      <div className={styles.pointRowTitle}>Empate correcto</div>
                      <div className={styles.pointRowDesc}>Predijiste empate y hubo empate, pero con diferente marcador.</div>
                    </div>
                    <div className={styles.pointRowValue}>+1 pt</div>
                  </div>

                  <div className={styles.pointRow}>
                    <div className={styles.pointRowIcon}><Target className="w-5 h-5" /></div>
                    <div className={styles.pointRowContent}>
                      <div className={styles.pointRowTitle}>Sin aciertos</div>
                      <div className={styles.pointRowDesc}>No acertaste nada.</div>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>0 pts</div>
                  </div>

                  <div className={styles.infoNote}>
                    <Info className={styles.infoNoteIcon} />
                    Los puntos se actualizan automáticamente al finalizar cada partido.
                  </div>
                </div>
              </div>

              {/* Right Column - Info Cards */}
              <div className={styles.rightCol}>
                <div className={styles.infoCard}>
                  <div className={styles.infoCardHeader}>
                    <Clock className={styles.infoCardIcon} />
                    ¿Hasta cuándo puedo predecir?
                  </div>
                  <div className={styles.infoCardBody}>
                    Podés hacer o editar tus predicciones hasta 1 minuto antes del inicio de cada partido. Una vez que el partido comienza, ya no podrás realizar cambios.
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoCardHeader}>
                    <CalendarDays className={styles.infoCardIcon} />
                    Fechas y plazos
                  </div>
                  <div className={styles.infoCardBody}>
                    La fase de grupos estará disponible desde el inicio del Mundial. Las predicciones deben realizarse fecha por fecha. A medida que avanza el torneo, se habilitan las siguientes fases.
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoCardHeader}>
                    <Users className={styles.infoCardIcon} />
                    Desempates
                  </div>
                  <div className={styles.infoCardBody}>
                    Si dos o más participantes terminan con la misma cantidad de puntos, se desempata por:
                    <ol className={styles.infoCardList}>
                      <li>Mayor cantidad de resultados exactos.</li>
                      <li>Mayor cantidad de resultados correctos.</li>
                      <li>Menor cantidad de predicciones falladas.</li>
                      <li>Sorteo.</li>
                    </ol>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoCardHeader}>
                    <ShieldCheck className={styles.infoCardIcon} />
                    Juego limpio
                  </div>
                  <div className={styles.infoCardBody}>
                    Prodeazo se basa en la buena fe y el respeto. Cualquier comportamiento indebido puede resultar en la expulsión de ligas o del torneo.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA Banner */}
            <div className={styles.ctaBanner}>
              <Trophy className={styles.ctaBannerIcon} />
              <div className={styles.ctaBannerContent}>
                <h3 className={styles.ctaBannerTitle}>Disfrutá, competí y ganá</h3>
                <p className={styles.ctaBannerDesc}>Prodeazo es más divertido con amigos.<br/>Creá o unite a ligas y empezá a sumar puntos.</p>
              </div>
              <Link href="/leagues" className={styles.ctaBannerBtn}>
                Crear o unirte a una liga
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}

        {/* ── Fechas y plazos ── */}
        {activeTab === "Fechas y plazos" && (
          <div className={styles.contentArea}>
            <div className={styles.leftCol}>
              <div>
                <h2 className={styles.sectionHeader}>
                  <Clock className={styles.sectionIcon} />
                  Fechas y plazos
                </h2>
                <p className={styles.sectionP}>
                  Las predicciones se pueden realizar hasta 1 minuto antes del inicio de cada partido. Una vez iniciado el partido, no se pueden modificar las predicciones.
                </p>
              </div>
              <div className={styles.infoNote}>
                <Info className={styles.infoNoteIcon} />
                El cierre de predicciones es automático. Revisá los horarios de cada partido con tiempo.
              </div>
            </div>
          </div>
        )}

        {/* ── Predicciones ── */}
        {activeTab === "Predicciones" && (
          <div className={styles.contentArea}>
            <div className={styles.leftCol}>
              <div>
                <h2 className={styles.sectionHeader}>
                  <Target className={styles.sectionIcon} />
                  Predicciones
                </h2>
                <p className={styles.sectionP}>
                  Podés hacer una predicción por partido. Podés editar tu predicción hasta el inicio del partido.
                </p>
                <p className={styles.sectionP} style={{ marginTop: 12 }}>
                  El marcador que ingreses es el resultado final al 90 minutos (sin contar tiempo extra ni penales).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Desempates ── */}
        {activeTab === "Desempates" && (
          <div className={styles.contentArea}>
            <div className={styles.leftCol}>
              <div>
                <h2 className={styles.sectionHeader}>
                  <Trophy className={styles.sectionIcon} />
                  Desempates
                </h2>
                <p className={styles.sectionP}>
                  En caso de empate en puntos, el desempate se resuelve en este orden:
                </p>
              </div>
              <div className={styles.pointList}>
                <div className={styles.pointRow}>
                  <div className={styles.pointRowContent}>
                    <div className={styles.pointRowTitle}>1. Predicciones exactas</div>
                    <div className={styles.pointRowDesc}>Mayor cantidad de predicciones con marcador exacto.</div>
                  </div>
                </div>
                <div className={styles.pointRow}>
                  <div className={styles.pointRowContent}>
                    <div className={styles.pointRowTitle}>2. Ganador correcto</div>
                    <div className={styles.pointRowDesc}>Mayor cantidad de predicciones con ganador correcto.</div>
                  </div>
                </div>
                <div className={styles.pointRow}>
                  <div className={styles.pointRowContent}>
                    <div className={styles.pointRowTitle}>3. Diferencia promedio</div>
                    <div className={styles.pointRowDesc}>Menor diferencia promedio entre marcadores predichos y reales.</div>
                  </div>
                </div>
                <div className={styles.pointRow}>
                  <div className={styles.pointRowContent}>
                    <div className={styles.pointRowTitle}>4. Fecha de registro</div>
                    <div className={styles.pointRowDesc}>El participante registrado más antiguamente tiene prioridad.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Ligas ── */}
        {activeTab === "Ligas" && (
          <div className={styles.contentArea}>
            <div className={styles.leftCol}>
              <div>
                <h2 className={styles.sectionHeader}>
                  <Users className={styles.sectionIcon} />
                  Ligas
                </h2>
                <p className={styles.sectionP}>
                  Podés crear ligas privadas e invitar a amigos con un código único. También podés unirte a ligas existentes usando su código.
                </p>
                <p className={styles.sectionP} style={{ marginTop: 12 }}>
                  Podés participar en hasta 5 ligas simultáneamente. El creador de la liga puede eliminarla; los miembros pueden abandonarla en cualquier momento.
                </p>
              </div>
              <div className={styles.infoNote}>
                <Info className={styles.infoNoteIcon} />
                El ranking dentro de cada liga usa los mismos puntos globales. No hay puntos exclusivos por liga.
              </div>
            </div>
          </div>
        )}

        {/* ── Otras reglas ── */}
        {activeTab === "Otras reglas" && (
          <div className={styles.contentArea}>
            <div className={styles.leftCol}>
              <div>
                <h2 className={styles.sectionHeader}>
                  <ShieldCheck className={styles.sectionIcon} />
                  Otras reglas
                </h2>
                <p className={styles.sectionP}>
                  Las predicciones son finales una vez iniciado el partido.
                </p>
                <p className={styles.sectionP} style={{ marginTop: 12 }}>
                  No se otorgan puntos por partidos suspendidos o cancelados.
                </p>
                <p className={styles.sectionP} style={{ marginTop: 12 }}>
                  El sistema es automático y las puntuaciones se calculan al finalizar cada partido.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
