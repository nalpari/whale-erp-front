import api from '@/lib/api'
import {
  OperatingHourInfo,
  StoreDetailResponse,
  StoreHeaderRequest,
  StoreListResponse,
  StoreOption,
} from '@/types/store'

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp?: string
}

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

export const fetchStores = async (params: StoreListParams) => {
  const response = await api.get<ApiResponse<StoreListResponse>>('/api/v1/stores', { params })
  return response.data.data
}

export const fetchStoreOptions = async (officeId?: number, franchiseId?: number) => {
  const response = await api.get<ApiResponse<StoreOption[]>>('/api/v1/stores/options', {
    params: { officeId, franchiseId },
  })
  return response.data.data
}

export const fetchStoreDetail = async (storeId: number) => {
  const response = await api.get<ApiResponse<StoreDetailResponse>>(`/api/v1/stores/${storeId}`)
  return response.data.data
}

export const createStore = async (payload: StoreHeaderRequest, files: StoreFilePayload) => {
  const formData = buildStoreFormData(payload, files)
  const response = await api.post<ApiResponse<StoreDetailResponse>>('/api/v1/stores', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data
}

export const updateStore = async (storeId: number, payload: StoreHeaderRequest, files: StoreFilePayload) => {
  const formData = buildStoreFormData(payload, files)
  const response = await api.put<ApiResponse<StoreDetailResponse>>(`/api/v1/stores/${storeId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data
}

export const deleteStore = async (storeId: number) => {
  await api.delete(`/api/v1/stores/${storeId}`)
}

export interface StoreFilePayload {
  businessFile?: File | null
  storeImages?: File[]
  deleteImages?: number[]
}

const buildStoreFormData = (payload: StoreHeaderRequest, files: StoreFilePayload) => {
  const formData = new FormData()

  formData.append('storeDto', new Blob([JSON.stringify(payload)], { type: 'application/json' }))

  if (files.businessFile) {
    formData.append('businessFile', files.businessFile)
  }

  if (files.storeImages?.length) {
    files.storeImages.forEach((file) => formData.append('storeImages', file))
  }

  if (files.deleteImages?.length) {
    formData.append('deleteImages', JSON.stringify(files.deleteImages))
  }

  return formData
}

export const normalizeOperatingHours = (operating: OperatingHourInfo[]) =>
  operating.map((item) => ({
    ...item,
    breakTimeEnabled: item.breakTimeEnabled ?? false,
  }))
