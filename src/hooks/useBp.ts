'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '@/lib/api'

interface LoadState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface BpFranchiseNode {
  id: number
  name: string
}

export interface BpHeadOfficeNode {
  id: number
  name: string
  franchises: BpFranchiseNode[]
}

interface BpApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp?: string
}

export const useBp = () => {
  const [state, setState] = useState<LoadState<BpHeadOfficeNode[]>>({
    data: null,
    loading: false,
    error: null,
  })
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const response = await api.get<BpApiResponse<BpHeadOfficeNode[]>>('/api/master/bp/head-office-tree')
        if (!active) return
        setState({ data: response.data.data ?? [], loading: false, error: null })
      } catch {
        if (!active) return
        setState({ data: null, loading: false, error: '본사-가맹점 트리를 불러오지 못했습니다.' })
      }
    }

    load()

    return () => {
      active = false
    }
  }, [refreshIndex])

  const refresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1)
  }, [])

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh,
  }
}
