'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '@/lib/api'
import { ApiResponse } from '@/lib/schemas/api'
import { BpDetailResponse } from '@/types/bp'

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
        const response = await api.get<ApiResponse<BpHeadOfficeNode[]>>('/api/master/bp/head-office-tree')
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

  const getBpDetail = useCallback(async (id: number) => {
    try {
      const response = await api.get<ApiResponse<BpDetailResponse>>(`/api/master/bp/${id}`)
      return response.data.data
    } catch (error) {
      throw error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
    }
  }, [])

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh,
    getBpDetail,
  }
}
