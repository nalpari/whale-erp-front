import axios from 'axios';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth-store';
import { validateApiResponse } from '@/lib/zod-utils';
import { env } from '@/lib/schemas/env';
import { queryClient } from '@/lib/query-client';
import { authKeys } from '@/hooks/queries/query-keys';

/**
 * Axios 에러 타입 (클라이언트 측)
 */
type AxiosApiError = {
  response?: {
    data?: {
      message?: string
    }
  }
  name?: string
}

/**
 * API 에러에서 메시지 추출
 */
export function getErrorMessage(error: unknown, fallback = '알 수 없는 오류가 발생했습니다.'): string {
  const apiError = error as AxiosApiError;
  return apiError.response?.data?.message ?? fallback;
}

/**
 * /api/auth/ 하위 경로 중 JWT 인증이 필요한 (= public auth 가 아닌) endpoint 목록.
 *
 * - public auth endpoint (login/refresh/find-login-id 등) 는 JWT 를 자동 첨부하지 않고,
 *   401 시 토큰 refresh 도 시도하지 않는다.
 * - 아래 경로들은 JWT 가 필요한 auth endpoint 라 public auth 와 동일한 분기에서 제외되어야 한다.
 *
 * startsWith 로 정확 매칭 (includes 는 부분 문자열 오판단 위험).
 */
const JWT_REQUIRED_AUTH_PATHS = [
  '/api/auth/change-password',
  '/api/auth/my-authority',
] as const;

/**
 * 주어진 URL 이 "인증 헤더 자동 첨부 / 401 refresh 재시도" 를 건너뛰어야 하는
 * public auth endpoint 인지 판정.
 *
 * /api/auth/ 로 시작하되 JWT_REQUIRED_AUTH_PATHS 에 속하지 않으면 public auth.
 */
function isPublicAuthPath(url: string): boolean {
  if (!url.startsWith('/api/auth/')) return false;
  return !JWT_REQUIRED_AUTH_PATHS.some((path) => url.startsWith(path));
}

/**
 * URL 이 my-authority 자기 호출인지 판정.
 * 403 invalidate 무한 루프 방지에 사용.
 */
function isMyAuthorityCall(url: string): boolean {
  return url.startsWith('/api/auth/my-authority');
}

const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * 스키마 검증이 포함된 GET 요청
 */
export async function getWithSchema<T>(
  url: string,
  schema: z.ZodType<T>,
  config?: Parameters<typeof api.get>[1]
): Promise<T> {
  const response = await api.get(url, config);
  return validateApiResponse(schema, response.data);
}

/**
 * 스키마 검증이 포함된 POST 요청
 */
export async function postWithSchema<T>(
  url: string,
  data: unknown,
  schema: z.ZodType<T>,
  config?: Parameters<typeof api.post>[2]
): Promise<T> {
  const response = await api.post(url, data, config);
  return validateApiResponse(schema, response.data);
}

/**
 * 스키마 검증이 포함된 PUT 요청
 */
export async function putWithSchema<T>(
  url: string,
  data: unknown,
  schema: z.ZodType<T>,
  config?: Parameters<typeof api.put>[2]
): Promise<T> {
  const response = await api.put(url, data, config);
  return validateApiResponse(schema, response.data);
}

/**
 * 스키마 검증이 포함된 PATCH 요청
 */
export async function patchWithSchema<T>(
  url: string,
  data: unknown,
  schema: z.ZodType<T>,
  config?: Parameters<typeof api.patch>[2]
): Promise<T> {
  const response = await api.patch(url, data, config);
  return validateApiResponse(schema, response.data);
}

// 요청 인터셉터 - 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const url = config.url || '';

  // public auth API 는 자동 헤더 추가 건너뛰기 (직접 설정한 헤더는 유지)
  // JWT 필요한 auth endpoint (change-password, my-authority) 는 일반 흐름으로 진행
  if (isPublicAuthPath(url)) {
    if (typeof window !== 'undefined') {
      config.headers['currentPath'] = window.location.pathname;
    }
    return config;
  }

  let { accessToken, affiliationId } = useAuthStore.getState();

  // store가 아직 hydrate되지 않은 경우 localStorage에서 직접 읽기
  if (!accessToken && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        accessToken = parsed.state?.accessToken;
        affiliationId = affiliationId || parsed.state?.affiliationId;
      }
    } catch (e) {
      console.warn('[api interceptor] localStorage 인증 정보 읽기 실패:', e)
    }
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (affiliationId) {
    config.headers['affiliationId'] = affiliationId;
  }
  if (typeof window !== 'undefined') {
    config.headers['currentPath'] = window.location.pathname;
  }
  return config;
});

// 토큰 갱신 상태 관리
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });
  failedQueue = [];
}

function forceLogout() {
  useAuthStore.getState().clearAuth();
  // 이전 사용자의 서버 캐시가 다음 로그인 세션에 누수되지 않도록 전체 클리어.
  queryClient.clear();
  if (typeof window !== 'undefined') {
    document.cookie = 'auth-token=; path=/; max-age=0';
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }
}

// 응답 인터셉터 - 401 시 토큰 자동 갱신, 403 시 권한 캐시 무효화
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 403 (권한 거부) → 관리자가 권한을 변경했을 가능성
    // my-authority 캐시 무효화 → useMyAuthority 가 자동 refetch → LNB 갱신
    // 자기 호출(/api/auth/my-authority)은 제외 (무한 루프 방지)
    if (error.response?.status === 403) {
      const url = originalRequest?.url || '';
      if (!isMyAuthorityCall(url)) {
        queryClient.invalidateQueries({ queryKey: authKeys.myAuthority() });
      }
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // public auth API (refresh, login 등) 에서 401 이면 바로 로그아웃
    // JWT 필요한 auth endpoint (change-password, my-authority) 는 아래 refresh 흐름으로 이어짐
    const url = originalRequest.url || '';
    if (isPublicAuthPath(url)) {
      forceLogout();
      return Promise.reject(error);
    }

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      forceLogout();
      return Promise.reject(error);
    }

    // 이미 갱신 중이면 큐에 추가하고 대기
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            originalRequest._retry = true;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const response = await axios.post(
        `${env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const newAccessToken = response.data.data.accessToken;
      useAuthStore.getState().setAccessToken(newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      processQueue(null, newAccessToken);

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * 아이디 찾기 API
 */
export async function findLoginId(name: string, email: string): Promise<string> {
  const response = await api.post('/api/auth/find-login-id', { name, email });
  return response.data.data.loginId;
}

export default api;
