'use client'

import { useState, useCallback } from 'react'

interface UseSearchFilterStorageOptions<T> {
  /** Date로 복원해야 하는 필드 이름 목록 */
  dateFields?: (keyof T)[]
}

interface UseSearchFilterStorageReturn<T> {
  /** sessionStorage에서 복원된 필터 (없으면 null) */
  savedFilters: T | null
  /** 검색 실행 시 호출 — sessionStorage에 저장 */
  saveFilters: (filters: T) => void
  /** 초기화 시 호출 — sessionStorage에서 삭제 */
  clearFilters: () => void
}

/**
 * 검색 조건을 sessionStorage에 저장/복원하는 훅.
 *
 * - 탭 단위로 유지, 탭 닫으면 자동 정리
 * - appliedFilters(검색 실행된 값)만 저장 대상
 * - Date 필드는 dateFields 옵션으로 자동 복원
 *
 * @example
 * const { savedFilters, saveFilters, clearFilters } = useSearchFilterStorage<StoreSearchFilters>(
 *   'store-search',
 *   { dateFields: ['from', 'to'] }
 * )
 * const [appliedFilters, setAppliedFilters] = useState(savedFilters ?? DEFAULT_FILTERS)
 */
export function useSearchFilterStorage<T>(
  key: string,
  options?: UseSearchFilterStorageOptions<T>,
): UseSearchFilterStorageReturn<T> {
  const dateFields = options?.dateFields

  const [savedFilters] = useState<T | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = sessionStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw) as T
      // Date 필드 복원
      if (dateFields && parsed) {
        for (const field of dateFields) {
          const value = (parsed as Record<string, unknown>)[field as string]
          if (typeof value === 'string') {
            ;(parsed as Record<string, unknown>)[field as string] = new Date(value)
          }
          // null은 그대로 유지
        }
      }
      return parsed
    } catch {
      return null
    }
  })

  const saveFilters = useCallback(
    (filters: T) => {
      if (typeof window === 'undefined') return
      try {
        sessionStorage.setItem(key, JSON.stringify(filters))
      } catch {
        // sessionStorage 용량 초과 등 무시
      }
    },
    [key],
  )

  const clearFilters = useCallback(() => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(key)
  }, [key])

  return { savedFilters, saveFilters, clearFilters }
}
