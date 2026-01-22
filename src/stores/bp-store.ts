import { create } from 'zustand'
import api from '@/lib/api'
import { ApiResponse } from '@/lib/schemas/api'
import type { BpHeadOfficeNode } from '@/types/bp'

interface BpStoreState {
  data: BpHeadOfficeNode[]
  loading: boolean
  error: string | null
  loaded: boolean
  load: () => Promise<void>
  refresh: () => Promise<void>
}

let inFlight: Promise<void> | null = null

const fetchBpTree = async (set: (state: Partial<BpStoreState>) => void) => {
  set({ loading: true, error: null })
  try {
    const response = await api.get<ApiResponse<BpHeadOfficeNode[]>>('/api/master/bp/head-office-tree')
    set({ data: response.data.data ?? [], loading: false, error: null, loaded: true })
  } catch {
    set({ data: [], loading: false, error: 'Failed to load head-office tree.', loaded: false })
  } finally {
    inFlight = null
  }
}

export const useBpStore = create<BpStoreState>((set, get) => ({
  data: [],
  loading: false,
  error: null,
  loaded: false,
  load: async () => {
    if (get().loaded) return
    if (inFlight) return inFlight
    inFlight = fetchBpTree(set)
    return inFlight
  },
  refresh: async () => {
    if (inFlight) return inFlight
    inFlight = fetchBpTree(set)
    return inFlight
  },
}))
