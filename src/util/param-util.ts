/**
 * URL 검색 파라미터에서 숫자를 파싱하는 유틸리티.
 * 값이 없거나 숫자로 변환할 수 없으면 null을 반환한다.
 */
export const parseNumberParam = (value: string | null): number | null => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}
