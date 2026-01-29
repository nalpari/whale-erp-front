import axios from 'axios';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth-store';
import { validateApiResponse } from '@/lib/zod-utils';
import { env } from '@/lib/schemas/env';

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

// 요청 인터셉터 - 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const url = config.url || '';

  // auth 관련 API는 자동 헤더 추가 건너뛰기 (직접 설정한 헤더는 유지)
  if (url.startsWith('/api/auth/')) {
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
    } catch {
      // localStorage 파싱 실패 시 무시
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

// 응답 인터셉터 - 에러 핸들링
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      // 로그인 페이지가 아닌 경우에만 리다이렉트
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
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
