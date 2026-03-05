import { useMutation } from '@tanstack/react-query'
import type { BusinessLicenseOcrResponse } from '@/lib/schemas/ocr'

/** 사업자등록증 OCR 요청 mutation */
export const useBusinessLicenseOcr = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<BusinessLicenseOcrResponse> => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/ocr/business-license', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '사업자등록증 인식에 실패했습니다.')
      }

      return response.json()
    },
  })
}
