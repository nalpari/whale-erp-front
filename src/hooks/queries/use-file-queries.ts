import { useQuery } from '@tanstack/react-query'
import { fileKeys } from './query-keys'
import { getFile, getDownloadUrl } from '@/lib/api/file'

/**
 * 파일 정보 조회 훅.
 */
export const useFileInfo = (fileId: number, enabled = true) => {
  return useQuery({
    queryKey: [...fileKeys.all, 'info', fileId] as const,
    queryFn: () => getFile(fileId),
    enabled: enabled && !!fileId,
    staleTime: 5 * 60 * 1000, // 5분 캐시
  })
}

/**
 * 파일 다운로드 URL 조회 훅.
 * - 전체 DownloadUrlResponse 객체를 반환한다.
 */
export const useFileDownloadUrl = (fileId: number, enabled = true) => {
  return useQuery({
    queryKey: fileKeys.downloadUrl(fileId),
    queryFn: () => getDownloadUrl(fileId),
    enabled: enabled && !!fileId,
    staleTime: 60 * 1000, // 1분 캐시 (다운로드 URL은 만료될 수 있음)
  })
}
