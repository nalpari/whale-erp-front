import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { fileKeys } from './query-keys'

/**
 * 파일 다운로드 URL 응답 타입.
 * - 일부 API는 downloadUrl, 일부는 url 키로 내려주므로 둘 다 허용한다.
 */
interface DownloadUrlResponse {
  downloadUrl?: string
  url?: string
}

/**
 * 파일 다운로드 URL 조회 훅.
 * - 서버 응답 형태가 달라도 문자열 URL로 정규화하여 반환한다.
 */
export const useFileDownloadUrl = (fileId: number | null, enabled = true) => {
  return useQuery({
    queryKey: fileKeys.downloadUrl(fileId!),
    queryFn: async () => {
      const response = await api.get(`/api/v1/files/${fileId}/download-url`)
      const payload = response.data?.data ?? response.data
      const downloadUrl =
        payload && typeof payload === 'object'
          ? (payload as DownloadUrlResponse).downloadUrl ?? (payload as DownloadUrlResponse).url
          : typeof payload === 'string'
            ? payload
            : null
      return downloadUrl
    },
    enabled: enabled && !!fileId,
    staleTime: 60 * 1000,
  })
}
