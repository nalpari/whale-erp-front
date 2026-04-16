import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import api from '@/lib/api'
import { bpKeys } from './query-keys'
import { useAuthStore } from '@/stores/auth-store'
import type { ApiResponse, PageResponse } from '@/lib/schemas/api'
import type { BpHeadOfficeNode, BpDetailResponse, BpListParams, BpFormData } from '@/types/bp'

/**
 * 현재 조직의 BP 정보 조회 훅.
 * - 사이드바 로고/브랜드명 표시 + 마이페이지 사업자 정보 화면용
 * - affiliation 헤더로 현재 조직의 BP 자동 필터링
 * - affiliationId를 query key에 포함하여 조직 전환 시 캐시 분리
 *
 * 구현 메모:
 * 목록 API는 민감 필드를 마스킹/null 처리하므로, 목록으로 ID만 획득한 뒤
 * 상세 API로 평문 BpDetailResponse를 가져온다.
 *
 * 반환값 의미:
 * - `data === null` — 현재 조직에 연결된 BP 자체가 없음 (정상 상태, Empty 화면)
 * - `isError === true` — 네트워크/서버 장애 또는 상세 응답 본문이 비어 있음
 */
export const useMyOrganizationBp = () => {
  const affiliationId = useAuthStore((s) => s.affiliationId)
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: bpKeys.myOrganization(affiliationId),
    queryFn: async ({ signal }) => {
      const listResponse = await api.get<ApiResponse<PageResponse<BpDetailResponse>>>(
        '/api/v1/master/bp',
        { params: { page: 0, size: 1 }, signal }
      )
      const bpId = listResponse.data.data?.content?.[0]?.id
      // bpId === 0 도 유효 ID로 취급 (폴스 네거티브 방지)
      // bpId 자체가 없는 경우 "조직 없음" 상태로 null 반환 (정상 종료)
      if (bpId == null) return null

      const detail = await getBpDetail(bpId, { signal })
      // 목록에는 ID가 있었는데 상세 응답이 비어 있으면 백엔드 응답 이상으로 간주.
      // isError로 올려서 "조직 없음" null 상태와 구분 가능하도록 한다.
      if (detail == null) {
        throw new Error('BP 상세 응답이 비어있습니다')
      }
      // detail 캐시와 공유: useBpDetail(bpId) 호출 시 재요청 회피
      queryClient.setQueryData(bpKeys.detail(bpId), detail)
      return detail
    },
    enabled: !!affiliationId,
    staleTime: 5 * 60 * 1000,
    // 2-step 호출 구조라 실패 시 목록+상세 양쪽이 재호출되어 트래픽 증폭.
    // 5xx 에러에 한해 1회만 재시도하여 증폭 범위 축소.
    retry: (failureCount, error) => {
      if (failureCount >= 1) return false
      const status = error instanceof AxiosError ? error.response?.status : undefined
      return status != null && status >= 500
    },
  })
}

/**
 * BP 본사 트리 조회 훅.
 * - 헤더/필터에서 사용하는 본사/가맹점 트리 데이터를 제공
 * - staleTime을 길게 잡아 불필요한 재요청을 줄인다.
 */
export const useBpHeadOfficeTree = (enabled = true) => {
  return useQuery({
    queryKey: bpKeys.headOfficeTree(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<BpHeadOfficeNode[]>>(
        '/api/v1/master/bp/head-office-tree'
      )
      return response.data.data ?? []
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * BP 상세 조회 훅.
 * - 특정 BP 선택 시 상세 정보를 조회한다.
 */
export const useBpDetail = (id?: number | null) => {
  return useQuery({
    queryKey: bpKeys.detail(id!),
    queryFn: async () => {
      const response = await api.get<ApiResponse<BpDetailResponse>>(`/api/v1/master/bp/${id}`)
      return response.data.data
    },
    enabled: !!id,
    // useMyOrganizationBp와 동일한 캐시 공유/일관성 정책
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * BP 상세 조회 함수.
 * - 훅 외부(예: 이벤트 핸들러/비동기 로직)에서 사용한다.
 * - React Query queryFn 내부에서 호출할 때는 `options.signal` 을 전달하면
 *   쿼리 취소 시 진행 중인 요청도 함께 abort 된다.
 */
export const getBpDetail = async (
  id: number,
  options?: { signal?: AbortSignal }
): Promise<BpDetailResponse> => {
  const response = await api.get<ApiResponse<BpDetailResponse>>(
    `/api/v1/master/bp/${id}`,
    { signal: options?.signal }
  )
  return response.data.data
}

/**
 * BP 목록 조회 훅.
 * - 검색 조건에 따른 BP 목록을 페이징으로 조회한다.
 */
export const useBpList = (params: BpListParams, enabled = true) => {
  return useQuery({
    queryKey: bpKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<PageResponse<BpDetailResponse>>>(
        '/api/v1/master/bp',
        { params }
      )
      return response.data.data
    },
    enabled,
  })
}

/**
 * 운영중인 본사 목록 조회 훅.
 * - 가맹점 초대 시 본사 선택용 데이터를 제공한다.
 */
export const useOperatingHeadOffices = () => {
  return useQuery({
    queryKey: bpKeys.headOffices(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<BpDetailResponse[]>>(
        '/api/v1/master/bp/head-offices'
      )
      return response.data.data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * BP 등록 mutation.
 * - multipart/form-data로 BP JSON + LNB 로고 파일 전송
 */
export const useCreateBp = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      data,
      lnbLogoExpandFile,
      lnbLogoContractFile,
    }: {
      data: BpFormData
      lnbLogoExpandFile?: File
      lnbLogoContractFile?: File
    }) => {
      const formData = new FormData()
      formData.append('bp', new Blob([JSON.stringify(data)], { type: 'application/json' }))
      if (lnbLogoExpandFile) formData.append('lnbLogoExpandFile', lnbLogoExpandFile)
      if (lnbLogoContractFile) formData.append('lnbLogoContractFile', lnbLogoContractFile)

      const response = await api.post<ApiResponse<BpDetailResponse>>(
        '/api/v1/master/bp',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bpKeys.all })
    },
  })
}

/**
 * BP 수정 mutation.
 * - multipart/form-data로 BP JSON + LNB 로고 파일 전송
 */
export const useUpdateBp = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
      lnbLogoExpandFile,
      lnbLogoContractFile,
      deleteLnbLogoExpandFileId,
      deleteLnbLogoContractFileId,
    }: {
      id: number
      data: BpFormData
      lnbLogoExpandFile?: File
      lnbLogoContractFile?: File
      deleteLnbLogoExpandFileId?: number
      deleteLnbLogoContractFileId?: number
    }) => {
      const formData = new FormData()
      formData.append('bp', new Blob([JSON.stringify({ ...data, id })], { type: 'application/json' }))
      if (lnbLogoExpandFile) formData.append('lnbLogoExpandFile', lnbLogoExpandFile)
      if (lnbLogoContractFile) formData.append('lnbLogoContractFile', lnbLogoContractFile)

      const params: Record<string, number> = {}
      if (deleteLnbLogoExpandFileId) params.deleteLnbLogoExpandFileId = deleteLnbLogoExpandFileId
      if (deleteLnbLogoContractFileId) params.deleteLnbLogoContractFileId = deleteLnbLogoContractFileId

      const response = await api.put<ApiResponse<BpDetailResponse>>(
        `/api/v1/master/bp/${id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, params }
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bpKeys.all })
    },
  })
}

/**
 * BP 삭제 mutation.
 * - 삭제 성공 시 BP 목록 캐시를 무효화한다.
 */
export const useDeleteBp = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/master/bp/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bpKeys.all })
    },
  })
}

/**
 * 가맹점 초대 mutation.
 */
export const useInviteFranchise = () => {
  return useMutation({
    mutationFn: async (data: {
      id: number
      businessRegistrationNumber: string
      representativeName: string
      representativeMobilePhone: string
      representativeEmail: string
    }) => {
      const response = await api.post<ApiResponse<void>>(
        '/api/v1/master/bp/invitations',
        data
      )
      return response.data
    },
  })
}
