import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { LoginAuthorityProgram } from '@/lib/schemas/auth'

/**
 * 백엔드 GET /api/auth/my-authority 응답 타입
 * SelectAuthorityResponse 와 동일 구조 (재사용)
 */
interface MyAuthorityResponseData {
  authority: {
    authorityId: number
    programs: LoginAuthorityProgram[]
  }
}

interface MyAuthorityApiResponse {
  code: number
  message: string
  data: MyAuthorityResponseData
}

async function fetchMyAuthority(affiliationId: string): Promise<LoginAuthorityProgram[]> {
  const response = await api.get<MyAuthorityApiResponse>('/api/auth/my-authority', {
    params: { affiliationId },
  })
  return response.data.data.authority.programs
}

/**
 * 내 권한 실시간 조회 훅 (Notion "Whale ERP 권한 실시간 갱신 방안")
 *
 * 동작:
 * - 탭 포커스 시 자동 재조회 (refetchOnWindowFocus: true)
 * - staleTime: 0 — 항상 fresh 로 간주, 매 트리거마다 네트워크 호출
 * - 응답을 auth-store.authority 와 동기화 → LNB 권한 필터링 자동 갱신
 *
 * 트리거:
 * - 탭 활성화/포커스 변경
 * - 403 응답 시 invalidate (api.ts response interceptor)
 * - (선택) 라우트 전환 시 invalidate
 *
 * 마운트 위치: app/(sub)/layout.tsx — ERP 진입 시 항상 활성화
 */
export function useMyAuthority() {
  const affiliationId = useAuthStore((s) => s.affiliationId)
  const setAuthority = useAuthStore((s) => s.setAuthority)

  const query = useQuery({
    queryKey: ['auth', 'my-authority', affiliationId],
    queryFn: () => fetchMyAuthority(affiliationId!),
    enabled: !!affiliationId,
    refetchOnWindowFocus: true,
    // 관리자가 타인의 권한을 변경했을 때 최대 60초 이내 반영 보장 (폴링)
    // 탭 포커스 / 403 invalidate 트리거와 함께 동작
    refetchInterval: 60_000,
    staleTime: 0,
  })

  // Zustand 는 React state 외부 store 이므로 set-state-in-effect 규칙 미적용
  useEffect(() => {
    if (query.data) {
      setAuthority(query.data)
    }
  }, [query.data, setAuthority])

  return query
}
