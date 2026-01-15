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
 * 타입 추출
 */
export type MasterSearchForm = z.infer<typeof masterSearchSchema>;
export type PaginationParams = z.infer<typeof paginationParamsSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
