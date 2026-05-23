import '../env'
import { db, pool } from '../db/client'
import { teams, fixtures } from '../db/schema'
import { FixtureStatus } from '../constants/fixture-status'

async function seedMock() {
  console.log('🌱 Starting Mock Seed...')

  const mockTeams = [
    { id: 1, name: 'Argentina', shortName: 'ARG', logoUrl: 'https://flagpedia.net/data/flags/h80/ar.png', groupLabel: 'Grupo A' },
    { id: 2, name: 'Brasil', shortName: 'BRA', logoUrl: 'https://flagpedia.net/data/flags/h80/br.png', groupLabel: 'Grupo A' },
    { id: 3, name: 'Francia', shortName: 'FRA', logoUrl: 'https://flagpedia.net/data/flags/h80/fr.png', groupLabel: 'Grupo B' },
    { id: 4, name: 'Alemania', shortName: 'GER', logoUrl: 'https://flagpedia.net/data/flags/h80/de.png', groupLabel: 'Grupo B' },
    { id: 5, name: 'España', shortName: 'ESP', logoUrl: 'https://flagpedia.net/data/flags/h80/es.png', groupLabel: 'Grupo C' },
    { id: 6, name: 'Italia', shortName: 'ITA', logoUrl: 'https://flagpedia.net/data/flags/h80/it.png', groupLabel: 'Grupo C' },
    { id: 7, name: 'Uruguay', shortName: 'URU', logoUrl: 'https://flagpedia.net/data/flags/h80/uy.png', groupLabel: 'Grupo D' },
    { id: 8, name: 'Portugal', shortName: 'POR', logoUrl: 'https://flagpedia.net/data/flags/h80/pt.png', groupLabel: 'Grupo D' },
  ]

  console.log('Inserting teams...')
  for (const team of mockTeams) {
    await db.insert(teams).values(team).onConflictDoNothing()
    console.log(`  - ${team.name}`)
  }

  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const nextWeek = new Date(now)
  nextWeek.setDate(now.getDate() + 7)

  const mockFixtures = [
    {
      id: 101,
      homeTeamId: 1, // Argentina
      awayTeamId: 2, // Brasil
      date: tomorrow,
      round: 'Fase de Grupos',
      groupLabel: 'Grupo A',
      status: FixtureStatus.NotStarted
    },
    {
      id: 102,
      homeTeamId: 3, // Francia
      awayTeamId: 4, // Alemania
      date: nextWeek,
      round: 'Fase de Grupos',
      groupLabel: 'Grupo B',
      status: FixtureStatus.NotStarted
    },
    {
      id: 103,
      homeTeamId: 5, // España
      awayTeamId: 6, // Italia
      date: new Date(now.getTime() + 1000 * 60 * 60 * 5), // 5 hours from now
      round: 'Fase de Grupos',
      groupLabel: 'Grupo C',
      status: FixtureStatus.NotStarted
    }
  ]

  console.log('Inserting fixtures...')
  for (const fx of mockFixtures) {
    await db.insert(fixtures).values(fx).onConflictDoNothing()
    console.log(`  - Match ${fx.id}: ${fx.homeTeamId} vs ${fx.awayTeamId} on ${fx.date.toISOString()}`)
  }

  console.log('✅ Mock Seed complete!')
}

seedMock()
  .catch(console.error)
  .finally(() => pool.end())
