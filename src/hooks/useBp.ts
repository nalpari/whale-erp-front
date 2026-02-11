'use client'

import { useBpHeadOfficeTree, useBpDetail, getBpDetail as getBpDetailApi } from '@/hooks/queries'

export const useBp = (enabled = true) => {
  const { data, isPending: loading, error, refetch: refresh } = useBpHeadOfficeTree(enabled)

  return {
    data: data ?? [],
    loading,
    error: error?.message ?? null,
    refresh,
    getBpDetail: getBpDetailApi,
  }
}

export const useBpDetailQuery = (id?: number | null) => {
  return useBpDetail(id)
}