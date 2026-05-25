import { create } from 'zustand'
import { apiFetch, type PaginatedResponse } from '../api/client'

export interface Prediction {
  id: string
  fixtureId: number
  homeGoals: number
  awayGoals: number
  points: number | null
}

interface PredictionsState {
  predictions: Prediction[]
  loading: boolean
  fetchPredictions: () => Promise<void>
  savePrediction: (fixtureId: number, homeGoals: number, awayGoals: number) => Promise<void>
}

export const usePredictionsStore = create<PredictionsState>((set, get) => ({
  predictions: [],
  loading: false,

  fetchPredictions: async () => {
    set({ loading: true })
    try {
      const data = await apiFetch<PaginatedResponse<Prediction>>('/api/predictions')
      set({ predictions: data.results })
    } finally {
      set({ loading: false })
    }
  },

  savePrediction: async (fixtureId, homeGoals, awayGoals) => {
    const saved = await apiFetch<Prediction>('/api/predictions', {
      method: 'POST',
      body: JSON.stringify({ fixtureId, homeGoals, awayGoals }),
    })
    set((state) => {
      const existing = state.predictions.findIndex((p) => p.fixtureId === fixtureId)
      if (existing >= 0) {
        const updated = [...state.predictions]
        updated[existing] = saved
        return { predictions: updated }
      }
      return { predictions: [...state.predictions, saved] }
    })
  },
}))
