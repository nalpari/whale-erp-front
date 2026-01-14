import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터 - 토큰 자동 첨부
api.interceptors.request.use((config) => {
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
    config.headers['affiliation'] = affiliationId;
  }
  return config;
});

// 응답 인터셉터 - 에러 핸들링
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  }
);

export default api;
