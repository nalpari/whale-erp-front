import { z } from 'zod';

/**
 * 기본 API 응답 스키마
 * Backend의 ApiResponse 패턴과 일치
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: dataSchema,
  });

/**
 * 페이징 응답 스키마
 * Backend의 PageResponse 패턴과 일치
 */
export const pageResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    content: z.array(itemSchema),
    totalElements: z.number(),
    totalPages: z.number(),
    size: z.number(),
    number: z.number(),
    first: z.boolean(),
    last: z.boolean(),
    empty: z.boolean(),
  });

/**
 * API 에러 응답 스키마
 */
export const apiErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  code: z.string().optional(),
  errors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});

/**
 * 페이징된 API 응답 스키마 헬퍼
 */
export const pagedApiResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  apiResponseSchema(pageResponseSchema(itemSchema));

/**
 * 타입 추출 헬퍼
 */
export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type ApiError = z.infer<typeof apiErrorSchema>;
