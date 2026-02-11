import api from '../api'

// 파일 카테고리 타입
export type UploadFileCategory =
  | 'RESIDENT_REGISTRATION'  // 주민등록등본
  | 'FAMILY_RELATION'        // 가족관계증명서
  | 'HEALTH_CHECK'           // 건강진단결과서
  | 'RESUME'                 // 이력서
  | 'EMPLOYMENT_CONTRACT'    // 근로계약서
  | 'WORK_CONTRACT'          // 근로계약서
  | 'WAGE_CONTRACT'          // 임금계약서
  | 'CERTIFICATE'            // 자격증
  | 'ETC_ATTACHMENT'         // 기타 첨부파일

// 참조 타입
export type ReferenceType =
  | 'EMPLOYEE_INFO'
  | 'EMPLOYEE_CERTIFICATE'
  | 'EMPLOYMENT_CONTRACT'
  | 'EMPLOYMENT_CONTRACT_HEADER'
  | 'STORE'
  | 'MENU'
  | 'ORGANIZATION'
  | 'MEMBER'
  | 'PAYROLL_STATEMENT'

// 업로드 응답 타입
export interface UploadFileResponse {
  id: number
  originalFileName: string
  storedFileName: string
  fileSize: number
  contentType: string
  category: UploadFileCategory
  referenceType: ReferenceType
  referenceId: number
  fileUrl?: string
  createdAt: string
}

// 다운로드 URL 응답 타입
export interface DownloadUrlResponse {
  fileId: number
  originalFileName: string
  downloadUrl: string
}

/**
 * 첨부파일 업로드
 */
export async function uploadAttachment(
  file: File,
  category: UploadFileCategory,
  referenceType: ReferenceType,
  referenceId: number
): Promise<UploadFileResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<{ data: UploadFileResponse }>(
    '/api/v1/files/attachments',
    formData,
    {
      params: {
        category,
        referenceType,
        referenceId
      }
    }
  )
  return response.data.data
}

/**
 * 이미지 업로드
 */
export async function uploadImage(
  file: File,
  category: UploadFileCategory,
  referenceType: ReferenceType,
  referenceId: number
): Promise<UploadFileResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<{ data: UploadFileResponse }>(
    '/api/v1/files/images',
    formData,
    {
      params: {
        category,
        referenceType,
        referenceId
      }
    }
  )
  return response.data.data
}

/**
 * 파일 상세 조회
 */
export async function getFile(fileId: number): Promise<UploadFileResponse> {
  const response = await api.get<{ data: UploadFileResponse }>(`/api/v1/files/${fileId}`)
  return response.data.data
}

/**
 * 파일 다운로드 URL 조회
 */
export async function getDownloadUrl(fileId: number): Promise<DownloadUrlResponse> {
  const response = await api.get<{ data: DownloadUrlResponse }>(`/api/v1/files/${fileId}/download-url`)
  return response.data.data
}

/**
 * 파일 삭제
 */
export async function deleteFile(fileId: number): Promise<void> {
  await api.delete(`/api/v1/files/${fileId}`)
}

/**
 * 특정 엔티티에 연결된 파일 목록 조회
 */
export async function getFilesByReference(
  referenceType: ReferenceType,
  referenceId: number,
  category?: UploadFileCategory
): Promise<UploadFileResponse[]> {
  const response = await api.get<{ data: UploadFileResponse[] }>('/api/v1/files/by-reference', {
    params: {
      referenceType,
      referenceId,
      category
    }
  })
  return response.data.data
}

/**
 * 직원 문서 업로드 헬퍼 함수
 */
export async function uploadEmployeeDocument(
  file: File,
  employeeId: number,
  documentType: 'resident' | 'family' | 'health' | 'resume'
): Promise<UploadFileResponse> {
  const categoryMap: Record<string, UploadFileCategory> = {
    resident: 'RESIDENT_REGISTRATION',
    family: 'FAMILY_RELATION',
    health: 'HEALTH_CHECK',
    resume: 'RESUME'
  }

  return uploadAttachment(
    file,
    categoryMap[documentType],
    'EMPLOYEE_INFO',
    employeeId
  )
}
