import { z } from 'zod'
import { apiResponseSchema } from '@/lib/schemas/api'

/**
 * 관리자 관리 Zod 스키마 및 타입 정의
 *
 * API 문서 기준:
 * - 근무여부 공통코드: MSTWK_001(근무), MSTWK_002(퇴사)
 * - 직급 코드: RNK_xxx (공통코드)
 * - 페이징: 1-based (pageNumber, pageSize)
 */

// ============================================
// 검색 파라미터
// ============================================

export interface AdminSearchParams {
  admin_id?: number
  user_type?: string // 'MSTWK_001' | 'MSTWK_002'
  authority_id?: number
  start_date?: string // yyyy-MM-dd
  end_date?: string // yyyy-MM-dd
  page?: number
  size?: number
}

// ============================================
// 근무여부 옵션 (공통코드)
// ============================================

export const WORK_STATUS_OPTIONS = [
  { value: 'MSTWK_001', label: '근무' },
  { value: 'MSTWK_002', label: '퇴사' },
] as const

/**
 * 근무여부 코드 → 한글 변환
 */
export function getWorkStatusLabel(code: string | null | undefined): string {
  const option = WORK_STATUS_OPTIONS.find((opt) => opt.value === code)
  return option?.label ?? (code ?? '-')
}

// ============================================
// 직급 옵션 (공통코드 RNK_xxx)
// ============================================

export const POSITION_OPTIONS = [
  { value: 'RNK_001', label: '사원' },
  { value: 'RNK_002', label: '주임' },
  { value: 'RNK_003', label: '대리' },
  { value: 'RNK_004', label: '과장' },
  { value: 'RNK_005', label: '차장' },
  { value: 'RNK_006', label: '부장' },
  { value: 'RNK_007', label: '이사' },
  { value: 'RNK_008', label: '상무이사' },
  { value: 'RNK_009', label: '전무이사' },
  { value: 'RNK_010', label: '대표' },
  { value: 'RNK_011', label: '대표이사' },
] as const

// ============================================
// Zod 스키마 - 폼 유효성 검사
// ============================================

// ID 유효성: 영문+숫자 조합, 8자 이상
const loginIdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/

// 비밀번호 유효성: 영문+숫자+특수문자(@$!%*#?&) 조합, 8~20자
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,20}$/

// 관리자 생성 스키마 (API request body와 일치)
export const adminCreateSchema = z.object({
  name: z.string().min(1, '관리자명은 필수입니다'),
  userType: z.string().min(1, '근무여부를 선택해주세요'),
  mobilePhone: z.string().min(1, '휴대폰 번호는 필수입니다'),
  loginId: z.string()
    .min(1, 'ID는 필수입니다')
    .regex(loginIdRegex, 'ID는 영문과 숫자를 포함하여 8자 이상이어야 합니다'),
  password: z.string()
    .min(1, '비밀번호는 필수입니다')
    .regex(passwordRegex, '비밀번호는 영문, 숫자, 특수문자를 포함하여 8~20자이어야 합니다'),
  authorityId: z.number({ message: '권한을 선택해주세요' }).min(1, '권한을 선택해주세요'),
  department: z.string().optional(),
  rank: z.string().optional(),
  officePhone: z.string().optional(),
  extensionNumber: z.string().optional(),
  email: z.string().optional(),
  inquiryResponderName: z.string().min(1, '1:1문의 답변자 네이밍은 필수입니다'),
})

export type AdminCreateRequest = z.infer<typeof adminCreateSchema>

// 관리자 수정 스키마 (loginId, password 제외)
export const adminUpdateSchema = z.object({
  name: z.string().min(1, '관리자명은 필수입니다'),
  userType: z.string().min(1, '근무여부를 선택해주세요'),
  mobilePhone: z.string().min(1, '휴대폰 번호는 필수입니다'),
  authorityId: z.number({ message: '권한을 선택해주세요' }).min(1, '권한을 선택해주세요'),
  department: z.string().optional(),
  rank: z.string().optional(),
  officePhone: z.string().optional(),
  extensionNumber: z.string().optional(),
  email: z.string().optional(),
  inquiryResponderName: z.string().min(1, '1:1문의 답변자 네이밍은 필수입니다'),
})

export type AdminUpdateRequest = z.infer<typeof adminUpdateSchema>

// ============================================
// 응답 스키마 (API 문서 기준 camelCase)
// ============================================

// 목록 아이템
export const adminListItemSchema = z.object({
  id: z.number(),
  userType: z.string().nullable(),
  loginId: z.string(),
  name: z.string(),
  mobilePhone: z.string().nullable(),
  email: z.string().nullable(),
  authorityName: z.string().nullable(),
  createdAt: z.string(),
})

export type AdminListItem = z.infer<typeof adminListItemSchema>

// 상세 응답
export const adminDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  userType: z.string().nullable(),
  department: z.string().nullable(),
  rank: z.string().nullable(),
  mobilePhone: z.string().nullable(),
  officePhone: z.string().nullable(),
  extensionNumber: z.string().nullable(),
  loginId: z.string(),
  email: z.string().nullable(),
  authorityId: z.number().nullable(),
  authorityName: z.string().nullable(),
  createdByLoginId: z.string().nullable(),
  createdByName: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  updatedByLoginId: z.string().nullable(),
  updatedByName: z.string().nullable(),
  inquiryResponderName: z.string().nullable(),
})

export type AdminDetail = z.infer<typeof adminDetailSchema>

// 관리자 전용 페이징 응답 (API 문서 구조: pageNumber, pageSize, isFirst, isLast, hasNext)
export const adminPageResponseSchema = z.object({
  content: z.array(adminListItemSchema),
  pageNumber: z.number(),
  pageSize: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
  isFirst: z.boolean(),
  isLast: z.boolean(),
  hasNext: z.boolean(),
})

export type AdminPageResponse = z.infer<typeof adminPageResponseSchema>

// 페이징 응답 스키마 (ApiResponse<PageResponse>)
export const adminListResponseSchema = apiResponseSchema(adminPageResponseSchema)

// 상세 응답 스키마
export const adminDetailResponseSchema = apiResponseSchema(adminDetailSchema)

// ID 중복체크 응답 스키마 (data: true/false boolean)
export const adminIdCheckResponseSchema = apiResponseSchema(z.boolean())

// SelectBox 옵션 응답 스키마 (관리자/권한 공통)
export const adminSelectOptionsResponseSchema = apiResponseSchema(
  z.array(z.object({ id: z.number(), name: z.string() }))
)
