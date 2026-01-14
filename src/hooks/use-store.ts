import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createStore,
  deleteStore,
  fetchStoreDetail,
  fetchStoreOptions,
  fetchStores,
  StoreListParams,
  updateStore,
} from '@/lib/store-api'
import { StoreDetailResponse, StoreHeaderRequest, StoreListResponse, StoreOption } from '@/types/store'

interface LoadState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export const useStoreOptions = (officeId?: number, franchiseId?: number) => {
  const [state, setState] = useState<LoadState<StoreOption[]>>({
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
        const data = await fetchStoreOptions(officeId, franchiseId)
        if (!active) return
        setState({ data, loading: false, error: null })
      } catch {
        if (!active) return
        setState({ data: null, loading: false, error: '점포 옵션을 불러오지 못했습니다.' })
      }
    }

    load()

    return () => {
      active = false
    }
  }, [officeId, franchiseId, refreshIndex])

  const refresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1)
  }, [])

  return {
    options: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh,
  }
}

export const useStoreList = (params: StoreListParams, enabled = true) => {
  const [state, setState] = useState<LoadState<StoreListResponse>>({
    data: null,
    loading: false,
    error: null,
  })
  const [refreshIndex, setRefreshIndex] = useState(0)
  const paramsKey = useMemo(() => JSON.stringify(params), [params])

  useEffect(() => {
    if (!enabled) return
    let active = true

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const data = await fetchStores(params)
        if (!active) return
        setState({ data, loading: false, error: null })
      } catch {
        if (!active) return
        setState({ data: null, loading: false, error: '점포 목록을 불러오지 못했습니다.' })
      }
    }

    load()

    return () => {
      active = false
    }
  }, [enabled, paramsKey, refreshIndex, params])

  const refresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1)
  }, [])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh,
  }
}

export const useStoreDetail = (storeId?: number | null) => {
  const [state, setState] = useState<LoadState<StoreDetailResponse>>({
    data: null,
    loading: false,
    error: null,
  })
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    if (!storeId) return
    let active = true

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const data = await fetchStoreDetail(storeId)
        if (!active) return
        setState({ data, loading: false, error: null })
      } catch {
        if (!active) return
        setState({ data: null, loading: false, error: '점포 상세 정보를 불러오지 못했습니다.' })
      }
    }

    load()

    return () => {
      active = false
    }
  }, [storeId, refreshIndex])

  const refresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1)
  }, [])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh,
  }
}

export const useStoreActions = () => {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (payload: StoreHeaderRequest, files: Parameters<typeof createStore>[1]) => {
    setSaving(true)
    setError(null)
    try {
      return await createStore(payload, files)
    } catch {
      setError('점포 저장에 실패했습니다.')
      throw new Error('create failed')
    } finally {
      setSaving(false)
    }
  }, [])

  const update = useCallback(
    async (storeId: number, payload: StoreHeaderRequest, files: Parameters<typeof updateStore>[2]) => {
      setSaving(true)
      setError(null)
      try {
        return await updateStore(storeId, payload, files)
      } catch {
        setError('점포 저장에 실패했습니다.')
        throw new Error('update failed')
      } finally {
        setSaving(false)
      }
    },
    []
  )

  const remove = useCallback(async (storeId: number) => {
    setSaving(true)
    setError(null)
    try {
      await deleteStore(storeId)
    } catch {
      setError('점포 삭제에 실패했습니다.')
      throw new Error('delete failed')
    } finally {
      setSaving(false)
    }
  }, [])

  return {
    create,
    update,
    remove,
    saving,
    error,
  }
}
