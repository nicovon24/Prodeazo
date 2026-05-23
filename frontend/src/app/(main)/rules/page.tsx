"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Minus, 
  MinusCircle, 
  PlusSquare, 
  Target, 
  Star, 
  Info,
  Clock,
  CalendarDays,
  Users,
  ShieldCheck,
  ChevronRight
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
          Conocé cómo se calculan los puntos y qué acciones te hacen sumar (o restar) en Prodeazo.
        </p>

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
                      <div className={styles.pointRowDesc}>Aciertas el marcador exacto del partido.</div>
                    </div>
                    <div className={styles.pointRowValue}>+5 pts</div>
                  </div>

                  <div className={styles.pointRow}>
                    <div className={styles.pointRowIcon}><Minus className="w-5 h-5" /></div>
                    <div className={styles.pointRowContent}>
                      <div className={styles.pointRowTitle}>Diferencia Exacta</div>
                      <div className={styles.pointRowDesc}>Aciertas la diferencia de goles (ej: 2-1, 3-2).</div>
                    </div>
                    <div className={styles.pointRowValue}>+3 pts</div>
                  </div>

                  <div className={styles.pointRow}>
                    <div className={styles.pointRowIcon}><Target className="w-5 h-5" /></div>
                    <div className={styles.pointRowContent}>
                      <div className={styles.pointRowTitle}>Resultado Correcto</div>
                      <div className={styles.pointRowDesc}>Aciertas quién gana o si empatan.</div>
                    </div>
                    <div className={styles.pointRowValue}>+1 pt</div>
                  </div>

                  <div className={styles.pointRow}>
                    <div className={styles.pointRowIcon}><Target className="w-5 h-5" /></div>
                    <div className={styles.pointRowContent}>
                      <div className={styles.pointRowTitle}>Sin Aciertos</div>
                      <div className={styles.pointRowDesc}>No aciertas el resultado ni la diferencia.</div>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>0 pts</div>
                  </div>

                  <div className={`${styles.pointRow} ${styles.pointRowDanger}`}>
                    <div className={styles.pointRowIcon}><MinusCircle className="w-5 h-5" /></div>
                    <div className={styles.pointRowContent}>
                      <div className={styles.pointRowTitle}>Marcador Incorrecto</div>
                      <div className={styles.pointRowDesc}>Si errás el resultado por 3 o más goles de diferencia.</div>
                    </div>
                    <div className={styles.pointRowValue}>-1 pt</div>
                  </div>

                  <div className={`${styles.pointRow} ${styles.pointRowBonus}`}>
                    <div className={styles.pointRowIcon}><Star className="w-5 h-5" fill="currentColor" /></div>
                    <div className={styles.pointRowContent}>
                      <div className={styles.pointRowTitle}>Bonus por Racha</div>
                      <div className={styles.pointRowDesc}>Si acertás 5 o más resultados exactos en una misma fecha, ganás <span style={{ color: 'var(--color-primary)'}}>+3 pts extra</span>.</div>
                    </div>
                    <div className={styles.pointRowValue}>+3 pts</div>
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
      </main>
    </>
  );
}
