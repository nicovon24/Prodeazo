'use client'
import { useEffect } from 'react'
import { useTournamentStore } from '../store/useTournamentStore'

export function TournamentInitializer() {
  const fetch = useTournamentStore(s => s.fetchTournaments)
  useEffect(() => { fetch() }, [fetch])
  return null
}
