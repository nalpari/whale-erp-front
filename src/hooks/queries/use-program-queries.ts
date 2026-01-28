import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPrograms, createProgram, updateProgram, deleteProgram } from '@/lib/api/program'
import type { ProgramFormData } from '@/lib/schemas/program'
import { programKeys } from './query-keys'

/**
 * 프로그램 목록 조회
 */
export const useProgramList = () => {
  return useQuery({
    queryKey: programKeys.lists(),
    queryFn: ({ signal }) => fetchPrograms(signal),
    staleTime: 60 * 1000, // 1분간 fresh
  })
}

/**
 * 프로그램 생성
 */
export const useCreateProgram = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProgramFormData & { parent_id: number | null }) => createProgram(data),
    onSuccess: () => {
      // 목록 캐시 무효화 → 자동으로 최신 데이터 다시 요청
      queryClient.invalidateQueries({ queryKey: programKeys.lists() })
    },
  })
}

/**
 * 프로그램 수정
 */
export const useUpdateProgram = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProgramFormData }) => updateProgram(id, data),
    onSuccess: (_, { id }) => {
      // 목록과 해당 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: programKeys.lists() })
      queryClient.invalidateQueries({ queryKey: programKeys.detail(id) })
    },
  })
}

/**
 * 프로그램 삭제
 */
export const useDeleteProgram = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteProgram(id),
    onSuccess: () => {
      // 프로그램 관련 모든 캐시 무효화
      queryClient.invalidateQueries({ queryKey: programKeys.all })
    },
  })
}
