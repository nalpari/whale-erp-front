import { QueryCache, QueryClient } from '@tanstack/react-query'
import axios from 'axios'

export const queryClient = new QueryClient({
  // 조회(useQuery) 실패를 운영 추적용으로 일괄 로깅한다.
  // TanStack Query v5는 useQuery에 onError 콜백이 없으므로 전역 QueryCache에서 처리한다.
  // 조회는 GET이라 쿼리 키/메시지에 민감 정보(비밀번호 등)가 포함되지 않는다.
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error('[query] 조회 실패', {
        queryKey: query.queryKey,
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        code: axios.isAxiosError(error) ? error.code : undefined,
        message: error instanceof Error ? error.message : String(error),
      })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      throwOnError: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
