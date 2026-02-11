import api, { getWithSchema, postWithSchema, putWithSchema } from '@/lib/api'
import type { Program, ProgramCreateRequest, ProgramUpdateRequest } from '@/lib/schemas/program'
import { programListResponseSchema, programResponseSchema } from '@/lib/schemas/program'

export interface ProgramReorderRequest {
  parent_id: number | null
  orders: Array<{
    id: number
    order_index: number
  }>
}

/**
 * 프로그램 목록 조회
 */
export async function fetchPrograms(menuKind: string, signal?: AbortSignal): Promise<Program[]> {
  const response = await getWithSchema('/api/system/programs', programListResponseSchema, {
    params: { menuKind },
    signal
  })
  return response.data
}

/**
 * 프로그램 생성
 */
export async function createProgram(data: ProgramCreateRequest): Promise<Program> {
  const response = await postWithSchema('/api/system/programs', data, programResponseSchema)
  return response.data
}

/**
 * 프로그램 수정
 */
export async function updateProgram(id: number, data: ProgramUpdateRequest): Promise<Program> {
  const response = await putWithSchema(`/api/system/programs/${id}`, data, programResponseSchema)
  return response.data
}

/**
 * 프로그램 삭제
 */
export async function deleteProgram(id: number): Promise<void> {
  await api.delete(`/api/system/programs/${id}`)
}

/**
 * 프로그램 순서 변경
 */
export async function reorderPrograms(data: ProgramReorderRequest): Promise<void> {
  await api.put('/api/system/programs/reorder', data)
}
