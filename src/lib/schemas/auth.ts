import { z } from 'zod';
import { apiResponseSchema } from './api';

/**
 * 로그인 요청 스키마
 */
export const loginRequestSchema = z.object({
  loginId: z
    .string()
    .min(1, '아이디를 입력해주세요')
    .max(50, '아이디는 50자 이내여야 합니다'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요')
    .max(100, '비밀번호는 100자 이내여야 합니다'),
});

/**
 * Authority (조직/권한) 스키마
 */
export const authoritySchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerCode: z.string().optional(),
});

/**
 * 로그인 응답 데이터 스키마
 */
export const loginResponseDataSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  authorities: z.array(authoritySchema),
  passwordChangeRequired: z.boolean().optional(),
});

/**
 * 로그인 API 응답 스키마
 */
export const loginResponseSchema = apiResponseSchema(loginResponseDataSchema);

/**
 * Authority 상세 정보 스키마
 */
export const authorityDetailSchema = z.object({
  detail: z.record(z.string(), z.unknown()),
});

/**
 * Authority 상세 API 응답 스키마
 */
export const authorityDetailResponseSchema = apiResponseSchema(authorityDetailSchema);

/**
 * 로그인 시 저장되는 프로그램별 권한 노드 (LoginAuthorityDetailResponse)
 */
export interface LoginAuthorityProgram {
  id: number
  name: string
  path: string
  level: number
  canRead: boolean | null
  canCreateDelete: boolean | null
  canUpdate: boolean | null
  children: LoginAuthorityProgram[] | null
}

/**
 * LoginAuthorityProgram 재귀 스키마.
 *
 * 인터페이스를 1차 진실로 두고 Zod 는 z.lazy 로 동일 shape 을 표현.
 * 인터페이스/스키마 두 정의를 동기 유지해야 하지만 재귀 타입의 한계로 불가피.
 */
export const loginAuthorityProgramSchema: z.ZodType<LoginAuthorityProgram> = z.lazy(() =>
  z.object({
    id: z.number(),
    name: z.string(),
    path: z.string(),
    level: z.number(),
    canRead: z.boolean().nullable(),
    canCreateDelete: z.boolean().nullable(),
    canUpdate: z.boolean().nullable(),
    children: z.array(loginAuthorityProgramSchema).nullable(),
  })
);

/**
 * GET /api/auth/my-authority 응답 스키마.
 * 백엔드 SelectAuthorityResponse 와 동일 구조 (authority + programs).
 */
export const myAuthorityResponseSchema = apiResponseSchema(
  z.object({
    authority: z.object({
      authorityId: z.number(),
      programs: z.array(loginAuthorityProgramSchema),
    }),
  })
);

/**
 * Auth Store 상태 스키마
 */
export const authStateSchema = z.object({
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  authority: z.custom<LoginAuthorityProgram[]>().nullable(),
  affiliationId: z.string().nullable(),
  ownerCode: z.string().nullable(),
  loginId: z.string().nullable(),
  name: z.string().nullable(),
  mobilePhone: z.string().nullable(),
  avatar: z.string().nullable(),
  passwordChangeRequired: z.boolean(),
});

/**
 * 토큰 페이로드 스키마 (JWT 디코딩 시 사용)
 */
export const tokenPayloadSchema = z.object({
  sub: z.string(),
  exp: z.number(),
  iat: z.number(),
  // 추가 필드는 필요에 따라 확장
});

/**
 * 타입 추출
 */
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponseData = z.infer<typeof loginResponseDataSchema>;
export type Authority = z.infer<typeof authoritySchema>;
export type AuthorityDetail = z.infer<typeof authorityDetailSchema>;
export type AuthState = z.infer<typeof authStateSchema>;
export type TokenPayload = z.infer<typeof tokenPayloadSchema>;
