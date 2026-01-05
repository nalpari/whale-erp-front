# API 환경 설정 설계

## 개요

dev/prod 두 환경의 API 서버에 요청을 보내기 위한 환경 설정 구성.

- dev: https://dev-api.whaleerp.co.kr
- prod: https://api.whaleerp.co.kr

## 결정 사항

| 항목 | 선택 |
|------|------|
| HTTP 클라이언트 | Axios |
| 환경 전환 방식 | 빌드 시점 결정 |
| API 클라이언트 구조 | 단일 Axios 인스턴스 |
| 인터셉터 로직 | 인증 토큰 자동 첨부 |
| 토큰 저장소 | 메모리 (Zustand) |
| 상태 관리 | Zustand |

## 파일 구조

```
whale-erp-front/
├── .env.development          # dev API URL
├── .env.production           # prod API URL
├── .env.example              # 템플릿 (git 추적용)
└── src/
    ├── lib/
    │   └── api.ts            # Axios 인스턴스 + 인터셉터
    └── stores/
        └── auth-store.ts     # Zustand 인증 스토어
```

## 환경 변수

**.env.development:**
```
NEXT_PUBLIC_API_URL=https://dev-api.whaleerp.co.kr
```

**.env.production:**
```
NEXT_PUBLIC_API_URL=https://api.whaleerp.co.kr
```

**.env.example:**
```
NEXT_PUBLIC_API_URL=
```

## Zustand 인증 스토어

**`src/stores/auth-store.ts`:**
```typescript
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
  clearAuth: () => set({ accessToken: null }),
}));
```

## Axios 인스턴스

**`src/lib/api.ts`:**
```typescript
import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터 - 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 - 에러 핸들링
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      // 로그인 페이지로 리다이렉트 등 처리
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 사용 예시

```typescript
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

// 로그인 후 토큰 저장
const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  useAuthStore.getState().setAccessToken(response.data.accessToken);
};

// API 요청 (토큰 자동 첨부됨)
const fetchUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};
```

## 동작 방식

1. `pnpm dev` → `.env.development` 로드 → dev API 사용
2. `pnpm build && pnpm start` → `.env.production` 로드 → prod API 사용
