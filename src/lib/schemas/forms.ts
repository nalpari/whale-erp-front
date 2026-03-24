import { z } from 'zod';

/**
 * 공통 유효성 검사 패턴
 */
export const patterns = {
  phone: /^01[016789]-?\d{3,4}-?\d{4}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  businessNumber: /^\d{3}-\d{2}-\d{5}$/,
} as const;

/**
 * 공통 필드 스키마
 */
export const commonFields = {
  id: z.string().uuid('유효한 ID 형식이 아닙니다'),
  name: z.string().min(1, '이름을 입력해주세요').max(100, '이름은 100자 이내여야 합니다'),
  phone: z.string().regex(patterns.phone, '유효한 휴대폰 번호 형식이 아닙니다'),
  email: z.string().email('유효한 이메일 형식이 아닙니다'),
  date: z.string().regex(patterns.date, 'YYYY-MM-DD 형식이어야 합니다'),
  businessNumber: z.string().regex(patterns.businessNumber, '유효한 사업자등록번호 형식이 아닙니다'),
  positiveNumber: z.number().positive('양수여야 합니다'),
  nonNegativeNumber: z.number().nonnegative('0 이상이어야 합니다'),
} as const;

/**
 * 마스터 검색 폼 스키마
 */
export const masterSearchSchema = z.object({
  headquarter: z.string().optional(),
  franchise: z.string().optional(),
  service: z.string().optional(),
  representativeName: z.string().max(50, '대표자명은 50자 이내여야 합니다').optional(),
  operatingStatus: z.enum(['all', 'active', 'inactive']).optional(),
  joinMethod: z.enum(['all', 'online', 'offline']).optional(),
  tempSaved: z.enum(['all', 'yes', 'no']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * 페이지네이션 파라미터 스키마
 */
export const paginationParamsSchema = z.object({
  page: z.number().int().nonnegative().default(0),
  size: z.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
});

/**
 * 날짜 범위 스키마
 */
export const dateRangeSchema = z
  .object({
    startDate: z.string().regex(patterns.date).optional(),
    endDate: z.string().regex(patterns.date).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    { message: '시작일은 종료일보다 이전이어야 합니다' }
  );

/**
 * 비밀번호 패턴 (영문+숫자+특수문자(@$!%*#?&), 8~20자)
 */
export const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,20}$/;

/**
 * 비밀번호 변경 폼 스키마
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해 주세요.'),
  newPassword: z
    .string()
    .min(1, '신규 비밀번호를 입력해 주세요.')
    .regex(passwordPattern, '8~20자, 영문+숫자+특수문자(@$!%*#?&) 조합으로 입력해 주세요.'),
  confirmPassword: z.string().min(1, '비밀번호 확인을 입력해 주세요.'),
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: '현재 비밀번호와 다른 비밀번호를 입력해 주세요.',
  path: ['newPassword'],
}).refine((data) => data.confirmPassword === data.newPassword, {
  message: '신규 비밀번호와 일치하지 않습니다.',
  path: ['confirmPassword'],
});

/**
 * BP 수정 폼 스키마 (마이페이지용)
 */
export const bpEditFormSchema = z.object({
  companyName: z.string().min(1, '회사명을 입력해 주세요.'),
  businessRegistrationNumber: z
    .string()
    .min(1, '사업자등록번호를 입력해 주세요.')
    .regex(/^\d{10}$/, '사업자등록번호는 10자리 숫자만 입력 가능합니다.'),
  address1: z.string().min(1, '주소를 입력해 주세요.'),
  representativeMobilePhone: z
    .string()
    .min(1, '휴대폰번호를 입력해 주세요.')
    .regex(/^01[016789]\d{7,8}$/, '휴대폰번호 형식이 올바르지 않습니다. (예: 01012345678)'),
  representativeEmail: z
    .string()
    .min(1, '이메일을 입력해 주세요.')
    .regex(patterns.email, '이메일 형식이 올바르지 않습니다.'),
  bpType: z.string().min(1, 'BP 타입을 선택해 주세요.'),
});

/**
 * 타입 추출
 */
export type MasterSearchForm = z.infer<typeof masterSearchSchema>;
export type PaginationParams = z.infer<typeof paginationParamsSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
export type BpEditForm = z.infer<typeof bpEditFormSchema>;
