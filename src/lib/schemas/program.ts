import { z } from 'zod';
import { apiResponseSchema } from './api';

/**
 * 프로그램 스키마 (API 응답 형태)
 * Backend ProgramResponse와 일치
 */
export const programSchema: z.ZodType<Program> = z.object({
  id: z.number().nullable(),
  parent_id: z.number().nullable(),
  name: z.string(),
  path: z.string().nullable(),
  order_index: z.number(),
  level: z.number(),
  is_active: z.boolean(),
  created_by_id: z.number().nullable(),
  updated_by_id: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  children: z.lazy(() => z.array(programSchema)).default([]),
});

/**
 * 프로그램 목록 응답 스키마 (ApiResponse<List<ProgramResponse>>)
 */
export const programListResponseSchema = apiResponseSchema(z.array(programSchema));

/**
 * 프로그램 타입
 */
export interface Program {
  id: number | null;
  parent_id: number | null;
  name: string;
  path: string | null;
  order_index: number;
  level: number;
  is_active: boolean;
  created_by_id: number | null;
  updated_by_id: number | null;
  created_at: string;
  updated_at: string;
  children: Program[];
}

/**
 * 프로그램 목록 응답 타입
 */
export type ProgramListResponse = z.infer<typeof programListResponseSchema>;

/**
 * 프로그램 폼 데이터 (생성/수정 공통)
 */
export interface ProgramFormData {
  name: string;
  path: string;
  is_active: boolean;
}

/**
 * 프로그램 생성 요청 데이터
 */
export interface ProgramCreateRequest extends ProgramFormData {
  parent_id: number | null;
}

/**
 * 프로그램 검색 결과
 */
export interface ProgramSearchResult {
  path: string[];
  programId: number;
}
