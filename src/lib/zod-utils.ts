import { z } from 'zod';

/**
 * Zod 에러를 사용자 친화적인 메시지로 변환
 */
export function formatZodError(error: z.core.$ZodError): string {
  return error.issues.map((e) => e.message).join(', ');
}

/**
 * Zod 에러를 필드별 에러 객체로 변환
 */
export function formatZodFieldErrors(error: z.core.$ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  error.issues.forEach((e) => {
    const path = e.path.join('.');
    if (path && !fieldErrors[path]) {
      fieldErrors[path] = e.message;
    }
  });
  return fieldErrors;
}

/**
 * 안전한 파싱 - 에러 시 기본값 반환
 */
export function safeParseWithDefault<T>(
  schema: z.ZodType<T>,
  data: unknown,
  defaultValue: T
): T {
  const result = schema.safeParse(data);
  return result.success ? result.data : defaultValue;
}

/**
 * API 응답 검증
 * 개발 모드에서만 검증, 프로덕션에서는 패스스루
 */
export function validateApiResponse<T>(
  schema: z.ZodType<T>,
  data: unknown
): T {
  if (process.env.NODE_ENV === 'development') {
    const result = schema.safeParse(data);
    if (!result.success) {
      console.warn('API 응답 스키마 불일치:', result.error.issues);
    }
  }
  return data as T;
}

/**
 * 폼 데이터 검증 훅용 헬퍼
 */
export function createFormValidator<T>(schema: z.ZodType<T>) {
  return {
    validate: (data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
      const result = schema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, errors: formatZodFieldErrors(result.error) };
    },
  };
}

/**
 * 타입 가드 생성
 */
export function createTypeGuard<T>(schema: z.ZodType<T>) {
  return (data: unknown): data is T => schema.safeParse(data).success;
}
