"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Trophy, 
  Star, 
  Target, 
  ChevronUp, 
  Plus, 
  ArrowRight,
  ShieldHalf,
  ChevronDown,
  Search
} from "lucide-react";
import { Header } from "../../../components/layout/Header";
import styles from "./leagues.module.css";

export default function LeaguesPage() {
  const [activeTab, setActiveTab] = useState("Mis Ligas");

  return (
    <>
      <Header
        title="Ligas"
        subtitle="Competí contra tus amigos y otros participantes."
      />
      <main className={styles.main}>
        {/* Top 4 Stat Cards */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}><Users className="w-6 h-6" /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Ligas Activas</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>3</span>
                <span className={styles.statSub}>de 5 posibles</span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}><Trophy className="w-6 h-6" /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Posición Promedio</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>2°</span>
                <div className={styles.statUp}>
                  <ChevronUp className="w-3 h-3" />
                  <span>1</span>
                  <span className={styles.statSub} style={{marginLeft: 4, color: "rgba(255,255,255,0.5)", fontWeight: 500}}>vs. semana pasada</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}><Star className="w-6 h-6" /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Puntos en Ligas</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>850</span>
                <div className={styles.statUp}>
                  <span style={{ fontSize: '0.85rem' }}>+120</span>
                  <span className={styles.statSub} style={{marginLeft: 4, color: "rgba(255,255,255,0.5)", fontWeight: 500}}>vs. semana pasada</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}><Target className="w-6 h-6" /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Precisión Promedio</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>61%</span>
                <div className={styles.statUp}>
                  <ChevronUp className="w-3 h-3" />
                  <span>7%</span>
                  <span className={styles.statSub} style={{marginLeft: 4, color: "rgba(255,255,255,0.5)", fontWeight: 500}}>vs. semana pasada</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'Mis Ligas' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('Mis Ligas')}
          >
            Mis Ligas
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'Explorar Ligas' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('Explorar Ligas')}
          >
            Explorar Ligas
          </button>
        </div>

        {activeTab === 'Mis Ligas' && (
          <div className={styles.splitView}>
            {/* Left Col - My Leagues */}
            <div className={styles.leftCol}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Mis Ligas</h2>
              
              <div className={styles.myLeaguesList}>
                <div className={styles.leagueRow}>
                  <div className={styles.leagueHexIcon} style={{ color: "var(--color-primary)" }}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div className={styles.leagueInfo}>
                    <div className={styles.leagueNameRow}>
                      <span className={styles.leagueName}>Liga Amigos</span>
                      <Trophy className={styles.leagueCrown} />
                    </div>
                    <span className={styles.leagueMembers}>12 miembros</span>
                  </div>
                  
                  <div className={styles.leagueStatCol}>
                    <span className={styles.leagueStatLabel}>TU POSICIÓN</span>
                    <div className={styles.leagueStatValueRow}>
                      <span className={styles.leagueStatValue}>2°</span>
                      <span className={styles.statSub}>de 12</span>
                    </div>
                  </div>

                  <div className={styles.leagueStatCol}>
                    <span className={styles.leagueStatLabel}>TUS PUNTOS</span>
                    <div className={styles.leagueStatValueRow}>
                      <span className={styles.leagueStatValue}>1.250</span>
                      <span className={styles.statUp} style={{fontSize: "0.75rem"}}>+150</span>
                    </div>
                    <span className={styles.statSub} style={{fontSize: "0.6rem", marginTop: "-4px"}}>vs. semana pasada</span>
                  </div>

                  <div className={styles.leagueStatCol}>
                    <span className={styles.leagueStatLabel}>PRECISIÓN</span>
                    <div className={styles.leagueStatValueRow}>
                      <span className={styles.leagueStatValue}>62%</span>
                    </div>
                  </div>

                  <button className={styles.leagueViewBtn}>
                    Ver liga
                  </button>
                </div>

                <div className={styles.leagueRow}>
                  <div className={styles.leagueHexIcon} style={{ color: "#fff" }}>
                    <ShieldHalf className="w-6 h-6" />
                  </div>
                  <div className={styles.leagueInfo}>
                    <div className={styles.leagueNameRow}>
                      <span className={styles.leagueName}>Familia Futbolera</span>
                    </div>
                    <span className={styles.leagueMembers}>8 miembros</span>
                  </div>
                  
                  <div className={styles.leagueStatCol}>
                    <span className={styles.leagueStatLabel}>TU POSICIÓN</span>
                    <div className={styles.leagueStatValueRow}>
                      <span className={styles.leagueStatValue}>1°</span>
                      <span className={styles.statSub}>de 8</span>
                    </div>
                  </div>

                  <div className={styles.leagueStatCol}>
                    <span className={styles.leagueStatLabel}>TUS PUNTOS</span>
                    <div className={styles.leagueStatValueRow}>
                      <span className={styles.leagueStatValue}>980</span>
                      <span className={styles.statUp} style={{fontSize: "0.75rem"}}>+80</span>
                    </div>
                    <span className={styles.statSub} style={{fontSize: "0.6rem", marginTop: "-4px"}}>vs. semana pasada</span>
                  </div>

                  <div className={styles.leagueStatCol}>
                    <span className={styles.leagueStatLabel}>PRECISIÓN</span>
                    <div className={styles.leagueStatValueRow}>
                      <span className={styles.leagueStatValue}>58%</span>
                    </div>
                  </div>

                  <button className={styles.leagueViewBtn}>
                    Ver liga
                  </button>
                </div>

                <div className={styles.leagueRow}>
                  <div className={styles.leagueHexIcon} style={{ color: "#0052FF" }}>
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div className={styles.leagueInfo}>
                    <div className={styles.leagueNameRow}>
                      <span className={styles.leagueName}>Oficina Champions</span>
                    </div>
                    <span className={styles.leagueMembers}>15 miembros</span>
                  </div>
                  
                  <div className={styles.leagueStatCol}>
                    <span className={styles.leagueStatLabel}>TU POSICIÓN</span>
                    <div className={styles.leagueStatValueRow}>
                      <span className={styles.leagueStatValue} style={{color: "var(--color-primary)"}}>4°</span>
                      <span className={styles.statSub}>de 15</span>
                    </div>
                  </div>

                  <div className={styles.leagueStatCol}>
                    <span className={styles.leagueStatLabel}>TUS PUNTOS</span>
                    <div className={styles.leagueStatValueRow}>
                      <span className={styles.leagueStatValue}>720</span>
                      <span className={styles.statUp} style={{fontSize: "0.75rem"}}>+60</span>
                    </div>
                    <span className={styles.statSub} style={{fontSize: "0.6rem", marginTop: "-4px"}}>vs. semana pasada</span>
                  </div>

                  <div className={styles.leagueStatCol}>
                    <span className={styles.leagueStatLabel}>PRECISIÓN</span>
                    <div className={styles.leagueStatValueRow}>
                      <span className={styles.leagueStatValue}>55%</span>
                    </div>
                  </div>

                  <button className={styles.leagueViewBtn}>
                    Ver liga
                  </button>
                </div>

              </div>
              <button className={styles.viewAllBtn}>Ver todas mis ligas</button>
            </div>

            {/* Right Col - CTAs */}
            <div className={styles.rightCol}>
              <Link href="#" className={`${styles.actionCard} ${styles.actionCardGreen}`}>
                <div className={styles.actionContent}>
                  <h3 className={styles.actionTitle}>Crear nueva liga</h3>
                  <p className={styles.actionDesc}>Creá tu propia liga y desafiá a tus amigos.</p>
                </div>
                <div className={styles.actionBtnIcon}><Plus className="w-6 h-6" /></div>
                <Users className={styles.actionBgIcon} />
              </Link>

              <Link href="#" className={`${styles.actionCard} ${styles.actionCardBlue}`}>
                <div className={styles.actionContent}>
                  <h3 className={styles.actionTitle}>Unirse a una liga</h3>
                  <p className={styles.actionDesc}>¿Tenés un código de liga? Unite y empezá a competir.</p>
                </div>
                <div className={styles.actionBtnIcon}><ArrowRight className="w-6 h-6" /></div>
                <Users className={styles.actionBgIcon} />
              </Link>

              <div className={styles.recommendedBox}>
                <div className={styles.recomHeader}>
                  <span className={styles.recomTitle}>Ligas recomendadas</span>
                  <Link href="#" className={styles.recomLink} onClick={(e) => { e.preventDefault(); setActiveTab('Explorar Ligas'); }}>
                    Ver todas
                  </Link>
                </div>
                <div className={styles.recomList}>
                  <div className={styles.recomItem}>
                    <div className={styles.recomItemLeft}>
                      <div className={styles.recomIconSm}><ShieldHalf className="w-4 h-4" /></div>
                      <div className={styles.recomInfo}>
                        <span className={styles.recomName}>Fanáticos del Fútbol</span>
                        <span className={styles.recomCount}>23 / 30 miembros</span>
                      </div>
                    </div>
                    <button className={styles.recomJoinBtn}>Unirse</button>
                  </div>

                  <div className={styles.recomItem}>
                    <div className={styles.recomItemLeft}>
                      <div className={styles.recomIconSm}><Trophy className="w-4 h-4" /></div>
                      <div className={styles.recomInfo}>
                        <span className={styles.recomName}>Prode Mundial 2026</span>
                        <span className={styles.recomCount}>18 / 25 miembros</span>
                      </div>
                    </div>
                    <button className={styles.recomJoinBtn}>Unirse</button>
                  </div>

                  <div className={styles.recomItem}>
                    <div className={styles.recomItemLeft}>
                      <div className={styles.recomIconSm}><ShieldHalf className="w-4 h-4" /></div>
                      <div className={styles.recomInfo}>
                        <span className={styles.recomName}>La Redonda</span>
                        <span className={styles.recomCount}>15 / 20 miembros</span>
                      </div>
                    </div>
                    <button className={styles.recomJoinBtn}>Unirse</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Explorar Ligas' && (
          <div>
            <div className={styles.exploreFilters}>
              <input 
                type="text" 
                placeholder="Buscar ligas..." 
                className={styles.searchInput}
              />
              <select className={styles.exploreSelect}>
                <option>Todas las ligas</option>
              </select>
              <select className={styles.exploreSelect}>
                <option>Ordenar por: Populares</option>
              </select>
            </div>

            <div className={styles.exploreGrid}>
              <div className={styles.exploreCard}>
                <div className={styles.exploreCardHeader}>
                  <div className={styles.exploreIconWrapper} style={{ color: "var(--color-primary)" }}>
                    <Star className="w-6 h-6" fill="currentColor" />
                  </div>
                  <div>
                    <h4 className={styles.exploreCardName}>Expertos del Prode</h4>
                    <div className={styles.exploreCardCount}>28 / 30 miembros</div>
                  </div>
                </div>
                <div className={styles.exploreBadge}>
                  <Trophy className="w-4 h-4" />
                  Competitiva
                </div>
                <button className={styles.exploreJoinBtn}>Unirse</button>
              </div>

              <div className={styles.exploreCard}>
                <div className={styles.exploreCardHeader}>
                  <div className={styles.exploreIconWrapper} style={{ color: "#0052FF" }}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={styles.exploreCardName}>Amigos del Fútbol</h4>
                    <div className={styles.exploreCardCount}>21 / 30 miembros</div>
                  </div>
                </div>
                <div className={styles.exploreBadge} style={{ color: "var(--color-primary)" }}>
                  <Trophy className="w-4 h-4" />
                  Casual
                </div>
                <button className={styles.exploreJoinBtn}>Unirse</button>
              </div>

              <div className={styles.exploreCard}>
                <div className={styles.exploreCardHeader}>
                  <div className={styles.exploreIconWrapper} style={{ color: "#D50204" }}>
                    <ShieldHalf className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={styles.exploreCardName}>Mundialistas</h4>
                    <div className={styles.exploreCardCount}>19 / 25 miembros</div>
                  </div>
                </div>
                <div className={styles.exploreBadge}>
                  <Trophy className="w-4 h-4" />
                  Competitiva
                </div>
                <button className={styles.exploreJoinBtn}>Unirse</button>
              </div>

              <div className={styles.exploreCard}>
                <div className={styles.exploreCardHeader}>
                  <div className={styles.exploreIconWrapper} style={{ color: "#9D00FF" }}>
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={styles.exploreCardName}>Leyendas del Prode</h4>
                    <div className={styles.exploreCardCount}>14 / 20 miembros</div>
                  </div>
                </div>
                <div className={styles.exploreBadge}>
                  <Trophy className="w-4 h-4" />
                  Competitiva
                </div>
                <button className={styles.exploreJoinBtn}>Unirse</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
