import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { authKeys } from '@/hooks/queries/query-keys'
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
 * 권한 트리 deep equal.
 *
 * 매 refetch 마다 새 배열 참조가 생기지만 내용이 동일할 수 있으므로,
 * Zustand setAuthority 호출 이전에 내용 비교로 불필요한 리렌더/localStorage 쓰기를 차단.
 *
 * 권한 트리는 작은 규모라 JSON.stringify 비교가 충분히 저렴.
 * 필드 순서가 고정되어 있어 안전하며, 트리 깊이도 3~4단이라 성능 영향 미미.
 */
function isAuthorityTreeEqual(
  a: LoginAuthorityProgram[] | null,
  b: LoginAuthorityProgram[],
): boolean {
  if (a === null) return false
  return JSON.stringify(a) === JSON.stringify(b)
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
    queryKey: authKeys.myAuthorityById(affiliationId),
    queryFn: () => fetchMyAuthority(affiliationId!),
    enabled: !!affiliationId,
    refetchOnWindowFocus: true,
    // 백그라운드 폴링 (보험 채널) — 대부분의 권한 변경은 탭 포커스 / 403 invalidate / mutation invalidate
    // 3채널로 즉시 반영되며, 이 인터벌은 장시간 포커스 유지 시 최대 반영 지연 상한 역할.
    // 60초 → 5분 완화 (사용자 1명당 시간당 12 req, 1000명 기준 시간당 12k req)
    refetchInterval: 5 * 60_000,
    // staleTime 30초 — 동시 트리거(포커스 + interval 근접) 시 중복 요청 방지
    staleTime: 30_000,
  })

  // Zustand 는 React state 외부 store 이므로 set-state-in-effect 규칙 미적용 (pnpm lint 검증됨).
  // deep equal 가드: 응답 트리 내용이 이전과 동일하면 setAuthority 를 호출하지 않는다.
  // 매 refetch 마다 새 배열 참조가 생성되므로 가드 없이 setAuthority 를 호출하면
  // Zustand 구독자(LNB 등) 전체가 매번 리렌더 + persist 의 localStorage 쓰기가 반복된다.
  useEffect(() => {
    if (!query.data) return
    const current = useAuthStore.getState().authority
    if (!isAuthorityTreeEqual(current, query.data)) {
      setAuthority(query.data)
    }
  }, [query.data, setAuthority])

  return query
}
