import { z } from 'zod';

/**
 * 클라이언트 환경변수 스키마
 * NEXT_PUBLIC_ 접두사를 가진 환경변수만 클라이언트에서 접근 가능
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url('유효한 API URL이 필요합니다'),
});

/**
 * 서버 환경변수 스키마 (필요시 확장)
 */
export const serverEnvSchema = z.object({
  // 서버 전용 환경변수 추가
});

/**
 * 클라이언트 환경변수 타입
 */
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * 환경변수 검증 및 반환
 * 빌드 타임에 환경변수 누락을 감지
 */
export function validateClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  });

  if (!result.success) {
    console.error('환경변수 검증 실패:', result.error.flatten().fieldErrors);
    throw new Error('필수 환경변수가 설정되지 않았습니다');
  }

  return result.data;
}

/**
 * 검증된 환경변수 (런타임에 사용)
 */
export const env = {
  get NEXT_PUBLIC_API_URL() {
    return process.env.NEXT_PUBLIC_API_URL ?? '';
  },
};
