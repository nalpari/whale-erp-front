import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import api from '@/lib/api'
import { StoreDetailResponse, StoreHeaderRequest, StoreListResponse, StoreOption } from '@/types/store'
import { ApiResponse } from '@/lib/schemas/api'

// 점포 목록 조회 파라미터
export interface StoreListParams {
  office?: number
  franchise?: number
  store?: number
  status?: string
  from?: string
  to?: string
  page?: number
  size?: number
  sort?: string
}

// 점포 저장/수정 시 파일 관련 payload
export interface StoreFilePayload {
  businessFile?: File | null
  storeImages?: File[]
  deleteImages?: number[]
}

// 비동기 로딩 상태 관리용 공통 타입
interface LoadState<T> {
  data: T | null
  loading: boolean
  error: string | null
  // 디버깅 또는 로깅용: 오류를 유지하여 컨텍스트를 잃지 않도록 합니다.
  errorCause: unknown | null
  // 개발자를 위한 추가 상세 정보 (상태/메시지), 사용자 화면에 표시하지 않습니다.
  errorDetail: string | null
}

// 공통 로딩 훅 옵션
interface UseAsyncResourceOptions<T> {
  loader: (signal: AbortSignal) => Promise<T>
  enabled?: boolean
  deps?: unknown[]
  errorMessage?: string
  initialData?: T | null
}

// FormData 키 상수
const FORM_DATA_KEYS = {
  storeDto: 'storeDto',
  businessFile: 'businessFile',
  storeImages: 'storeImages',
  deleteImages: 'deleteImages',
} as const

// 에러 상세 정보를 사람이 읽기 쉬운 텍스트로 변환
const buildErrorDetail = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const serverMessage = (error.response?.data as { message?: string } | undefined)?.message
    return [status ? `HTTP ${status}` : null, serverMessage || error.message].filter(Boolean).join(' - ')
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown error'
}

// 평범한 객체 여부 판별(정렬된 stringify를 위한 안전장치)
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && Object.prototype.toString.call(value) === '[object Object]'

// 키 순서를 고정해 동일한 객체가 같은 문자열이 되도록 변환
const stableStringify = (value: unknown): string => {
  if (value === undefined) return 'null'
  if (value === null) return 'null'
  if (typeof value !== 'object') return JSON.stringify(value)
  if (value instanceof Date) return JSON.stringify(value.toISOString())
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`
  if (!isPlainObject(value)) return JSON.stringify(value)

  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
  const serialized = entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(',')
  return `{${serialized}}`
}

// 공통 로딩 훅: 로딩/에러/취소를 표준화해 중복 제거
const useAsyncResource = <T,>({
  loader,
  enabled = true,
  deps = [],
  errorMessage = '알 수 없는 오류가 발생했습니다.',
  initialData = null,
}: UseAsyncResourceOptions<T>) => {
  const depsKey = useMemo(() => stableStringify(deps), [deps])
  const [state, setState] = useState<LoadState<T>>({
    data: initialData,
    loading: false,
    error: null,
    errorCause: null,
    errorDetail: null,
  })
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    if (!enabled) return

    let active = true
    const controller = new AbortController()

    const load = async () => {
      // 더 부드러운 UI를 위해 로딩 상태를 표시하면서도 이전 데이터를 유지합니다.
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        errorCause: null,
        errorDetail: null,
      }))

      try {
        const data = await loader(controller.signal)
        if (!active) return
        setState({
          data,
          loading: false,
          error: null,
          errorCause: null,
          errorDetail: null,
        })
      } catch (error) {
        if (!active || controller.signal.aborted) return
        setState({
          data: initialData,
          loading: false,
          error: errorMessage,
          errorCause: error,
          errorDetail: buildErrorDetail(error),
        })
      }
    }

    void load()

    return () => {
      // 요청을 중단하고 언마운트 후 지연된 setState를 차단합니다.
      active = false
      controller.abort()
    }
  }, [enabled, refreshIndex, errorMessage, initialData, loader, depsKey])

  const refresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1)
  }, [])

  return {
    ...state,
    refresh,
  }
}

// 점포 생성/수정 요청용 FormData 구성
const buildStoreFormData = (payload: StoreHeaderRequest, files: StoreFilePayload) => {
  const formData = new FormData()

  formData.append(FORM_DATA_KEYS.storeDto, new Blob([JSON.stringify(payload)], { type: 'application/json' }))

  if (files.businessFile) {
    formData.append(FORM_DATA_KEYS.businessFile, files.businessFile)
  }

  if (files.storeImages?.length) {
    files.storeImages.forEach((file) => formData.append(FORM_DATA_KEYS.storeImages, file))
  }

  if (files.deleteImages?.length) {
    const deletePayload = { shouldDeleteFileIds: files.deleteImages }
    formData.append(
      FORM_DATA_KEYS.deleteImages,
      new Blob([JSON.stringify(deletePayload)], { type: 'application/json' })
    )
  }

  return formData
}

// 점포 목록 조회 API
const fetchStores = async (params: StoreListParams, signal?: AbortSignal) => {
  const response = await api.get<ApiResponse<StoreListResponse>>('/api/v1/stores', { params, signal })
  return response.data.data
}

// 점포 옵션 조회 API
const fetchStoreOptions = async (officeId?: number | null, franchiseId?: number | null, signal?: AbortSignal) => {
  const response = await api.get<ApiResponse<StoreOption[]>>('/api/v1/stores/options', {
    params: { officeId, franchiseId },
    signal,
  })
  return response.data.data
}

// 점포 상세 조회 API
const fetchStoreDetail = async (storeId: number, signal?: AbortSignal) => {
  const response = await api.get<ApiResponse<StoreDetailResponse>>(`/api/v1/stores/${storeId}`, { signal })
  return response.data.data
}

// 점포 생성 API
const createStore = async (payload: StoreHeaderRequest, files: StoreFilePayload) => {
  const formData = buildStoreFormData(payload, files)
  const response = await api.post<ApiResponse<StoreDetailResponse>>('/api/v1/stores', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data
}

// 점포 수정 API
const updateStore = async (storeId: number, payload: StoreHeaderRequest, files: StoreFilePayload) => {
  const formData = buildStoreFormData(payload, files)
  const response = await api.put<ApiResponse<StoreDetailResponse>>(`/api/v1/stores/${storeId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data
}

// 점포 삭제 API
const deleteStore = async (storeId: number) => {
  await api.delete(`/api/v1/stores/${storeId}`)
}

// 점포 옵션 목록 훅
export const useStoreOptions = (officeId?: number | null, franchiseId?: number | null, enabled = true) => {
  const loader = useCallback((signal: AbortSignal) => fetchStoreOptions(officeId, franchiseId, signal), [
    officeId,
    franchiseId,
  ])

  const { data, loading, error, errorCause, errorDetail, refresh } = useAsyncResource<StoreOption[]>({
    loader,
    deps: [officeId, franchiseId],
    enabled,
    errorMessage: '점포 옵션을 불러오지 못했습니다.',
  })

  return {
    options: data ?? [],
    loading,
    error,
    errorCause,
    errorDetail,
    refresh,
  }
}

// 점포 목록 훅
export const useStoreList = (params: StoreListParams, enabled = true) => {
  // 키 순서를 고정해 동일한 객체가 같은 문자열이 되도록 변환하여 불필요한 재요청을 방지합니다.
  const paramsKey = useMemo(() => stableStringify(params), [params])
  const loader = useCallback((signal: AbortSignal) => fetchStores(params, signal), [params])

  const { data, loading, error, errorCause, errorDetail, refresh } = useAsyncResource<StoreListResponse>({
    loader,
    enabled,
    deps: [paramsKey],
    errorMessage: '점포 목록을 불러오지 못했습니다.',
  })

  return {
    data,
    loading,
    error,
    errorCause,
    errorDetail,
    refresh,
  }
}

// 점포 상세 훅
export const useStoreDetail = (storeId?: number | null) => {
  const enabled = Boolean(storeId)
  const loader = useCallback((signal: AbortSignal) => fetchStoreDetail(storeId as number, signal), [storeId])

  const { data, loading, error, errorCause, errorDetail, refresh } = useAsyncResource<StoreDetailResponse>({
    loader,
    enabled,
    deps: [storeId],
    errorMessage: '점포 상세 정보를 불러오지 못했습니다.',
  })

  return {
    data,
    loading,
    error,
    errorCause,
    errorDetail,
    refresh,
  }
}

// 점포 생성/수정/삭제 액션 훅
export const useStoreActions = () => {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCause, setErrorCause] = useState<unknown | null>(null)

  const withSaving = useCallback(
    async <T,>(action: () => Promise<T>, message: string) => {
      setSaving(true)
      setError(null)
      setErrorCause(null)
      try {
        return await action()
      } catch (err) {
        setError(message)
        setErrorCause(err)
        throw new Error(message, { cause: err })
      } finally {
        setSaving(false)
      }
    },
    []
  )

  const create = useCallback(
    async (payload: StoreHeaderRequest, files: StoreFilePayload) =>
      withSaving(() => createStore(payload, files), '점포 저장에 실패했습니다.'),
    [withSaving]
  )

  const update = useCallback(
    async (storeId: number, payload: StoreHeaderRequest, files: StoreFilePayload) =>
      withSaving(() => updateStore(storeId, payload, files), '점포 저장에 실패했습니다.'),
    [withSaving]
  )

  const remove = useCallback(
    async (storeId: number) => withSaving(() => deleteStore(storeId), '점포 삭제에 실패했습니다.'),
    [withSaving]
  )

  return {
    create,
    update,
    remove,
    saving,
    error,
    errorCause,
  }
}