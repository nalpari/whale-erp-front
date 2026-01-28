import api from '@/lib/api'
import type { Program, ProgramFormData } from '@/lib/schemas/program'

/**
 * 프로그램 목록 조회
 */
export async function fetchPrograms(signal?: AbortSignal): Promise<Program[]> {
  const response = await api.get('/api/system/programs', { signal })
  return response.data.data as Program[]
}

/**
 * 프로그램 생성
 */
export async function createProgram(data: ProgramFormData & { parent_id: number | null }): Promise<Program> {
  const response = await api.post('/api/system/programs', data)
  return response.data.data as Program
}

/**
 * 프로그램 수정
 */
export async function updateProgram(id: number, data: ProgramFormData): Promise<Program> {
  const response = await api.put(`/api/system/programs/${id}`, data)
  return response.data.data as Program
}

/**
 * 프로그램 삭제
 */
export async function deleteProgram(id: number): Promise<void> {
  await api.delete(`/api/system/programs/${id}`)
}
