import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { isAxiosError } from 'axios'
import { useAlert } from '@/components/common/ui'

/**
 * 쿼리 에러 공통 처리 훅 (목록 + 상세 공용)
 * - 403: 공통 alert 후 이전 페이지로 이동
 * - 그 외: warning-txt에 표시할 메시지 문자열 반환
 */
export function useQueryError(
  error: Error | null,
  fallbackMessage = '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
): string | undefined {
  const router = useRouter()
  const { alert } = useAlert()
  const handledRef = useRef(false)

  useEffect(() => {
    if (!error) {
      handledRef.current = false
      return
    }
    if (handledRef.current) return
    if (isAxiosError(error) && error.response?.status === 403) {
      handledRef.current = true
      alert('접근 권한이 없습니다.').then(() => router.back())
    }
  }, [error, alert, router])

  if (!error) return undefined
  if (isAxiosError(error) && error.response?.status === 403) return undefined
  return fallbackMessage
}
