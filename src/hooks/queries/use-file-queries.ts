import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { fileKeys } from './query-keys'

interface DownloadUrlResponse {
  downloadUrl?: string
  url?: string
}

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
