'use client'

import { useCallback, useEffect } from 'react'
import api from '@/lib/api'
import { ApiResponse } from '@/lib/schemas/api'
import { BpDetailResponse } from '@/types/bp'
import { useBpStore } from '@/stores/bp-store'

export const useBp = () => {
  const { data, loading, error, load, refresh } = useBpStore()

  useEffect(() => {
    void load()
  }, [load])

  const getBpDetail = useCallback(async (id: number) => {
    try {
      const response = await api.get<ApiResponse<BpDetailResponse>>(`/api/master/bp/${id}`)
      return response.data.data
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to load business partner detail.')
    }
  }, [])

  return {
    data,
    loading,
    error,
    refresh,
    getBpDetail,
  }
}
