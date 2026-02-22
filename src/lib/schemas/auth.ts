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
});

/**
 * 로그인 응답 데이터 스키마
 */
export const loginResponseDataSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  authorities: z.array(authoritySchema),
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
 * Auth Store 상태 스키마
 */
export const authStateSchema = z.object({
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  authority: z.custom<LoginAuthorityProgram[]>().nullable(),
  affiliationId: z.string().nullable(),
  loginId: z.string().nullable(),
  name: z.string().nullable(),
  mobilePhone: z.string().nullable(),
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
