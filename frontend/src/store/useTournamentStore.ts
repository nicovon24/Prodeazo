import { create } from 'zustand'
import { fetchTournaments, type Tournament } from '../api/tournaments'

interface TournamentState {
  tournaments: Tournament[]
  activeTournamentId: string | null
  loading: boolean
  fetchTournaments: () => Promise<void>
  setActiveTournament: (id: string) => void
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  tournaments: [],
  activeTournamentId: null,
  loading: false,

  fetchTournaments: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      const data = await fetchTournaments()
      const defaultT = data.tournaments.find(t => t.isDefault) ?? data.tournaments[0] ?? null
      set({
        tournaments: data.tournaments,
        activeTournamentId: defaultT?.id ?? null,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  setActiveTournament: (id: string) => set({ activeTournamentId: id }),
}))
