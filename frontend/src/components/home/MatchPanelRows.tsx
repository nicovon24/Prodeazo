import { format, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DashboardPanelMatch, DashboardPanelTeam, DashboardRecentResult } from '@/api/dashboard'
import styles from '@/app/(main)/home/home.module.css'

function formatKickoff(iso: string) {
  const d = new Date(iso)
  if (isToday(d)) return { label: 'Hoy', time: format(d, 'HH:mm') }
  if (isTomorrow(d)) return { label: 'Mañana', time: format(d, 'HH:mm') }
  return { label: format(d, 'd MMM', { locale: es }), time: format(d, 'HH:mm') }
}

function teamLabel(team: DashboardPanelTeam | null) {
  return team?.shortName?.trim() || team?.name || '—'
}

function TeamLogo({ team }: { team: DashboardPanelTeam | null }) {
  if (!team?.logoUrl) {
    return <span className={styles.teamLogoFallback}>{teamLabel(team).slice(0, 2).toUpperCase()}</span>
  }
  return <img src={team.logoUrl} alt={team.name} className={styles.teamLogo} />
}

function TeamsRow({ match }: { match: DashboardPanelMatch }) {
  return (
    <div className={styles.matchTeamsRow}>
      <div className={`${styles.team} ${styles.teamRight}`}>
        <TeamLogo team={match.homeTeam} />
        {teamLabel(match.homeTeam)}
      </div>
      <span className={styles.vs}>VS</span>
      <div className={`${styles.team} ${styles.teamLeft}`}>
        {teamLabel(match.awayTeam)}
        <TeamLogo team={match.awayTeam} />
      </div>
    </div>
  )
}

export function UpcomingMatchRow({ match }: { match: DashboardPanelMatch }) {
  const kickoff = formatKickoff(match.date)
  const isLive = match.status === 'in_progress' || match.status === 'inprogress'

  return (
    <div className={styles.matchCardStatic}>
      <div className={styles.matchTime}>
        <span className={styles.matchTimeLabel}>{kickoff.label}</span>
        <span className={styles.matchTimeValue}>{kickoff.time}</span>
        <span className={isLive ? styles.matchLive : styles.matchKickoff}>
          {isLive ? 'En vivo' : 'Para el kickoff'}
        </span>
      </div>
      <div className={styles.matchTeams}>
        <TeamsRow match={match} />
      </div>
    </div>
  )
}

export function PendingMatchRow({ match }: { match: DashboardPanelMatch }) {
  const kickoff = formatKickoff(match.date)

  return (
    <div className={styles.predCard}>
      <span className={styles.predTime}>
        {kickoff.label} - {kickoff.time}
      </span>
      <div className={styles.predTeams}>
        <div className={`${styles.predTeam} ${styles.teamRight}`}>
          <TeamLogo team={match.homeTeam} />
          {teamLabel(match.homeTeam)}
        </div>
        <span className={styles.vs}>VS</span>
        <div className={`${styles.predTeam} ${styles.teamLeft}`}>
          {teamLabel(match.awayTeam)}
          <TeamLogo team={match.awayTeam} />
        </div>
      </div>
    </div>
  )
}

const toneClass: Record<DashboardRecentResult['prediction']['resultTone'], string> = {
  exact: styles.resultToneExact,
  partial: styles.resultTonePartial,
  miss: styles.resultToneMiss,
}

export function RecentResultRow({ match }: { match: DashboardRecentResult }) {
  const kickoff = formatKickoff(match.date)
  const tone = match.prediction.resultTone

  return (
    <div className={`${styles.resultCard} ${toneClass[tone]}`}>
      <div className={styles.matchTime}>
        <span className={styles.matchTimeLabel}>{kickoff.label}</span>
        <span className={styles.matchTimeValue}>{kickoff.time}</span>
      </div>
      <div className={styles.matchTeams}>
        <TeamsRow match={match} />
        <div className={styles.resultScores}>
          <span className={styles.resultScoreLabel}>Resultado</span>
          <span className={styles.resultScoreValue}>
            {match.homeScore ?? 0} - {match.awayScore ?? 0}
          </span>
          <span className={styles.resultScoreLabel}>Tu predicción</span>
          <span className={styles.resultScoreValue}>
            {match.prediction.homeGoals} - {match.prediction.awayGoals}
          </span>
        </div>
      </div>
    </div>
  )
}
