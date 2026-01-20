/**
 * 업로드 파일 타입
 */
// 업로드 파일 타입(이미지/첨부파일)
export type UploadFileType = 'ATTACHMENT' | 'IMAGE'

/**
 * 업로드 파일 카테고리 타입
 */
// 업로드 파일 카테고리
export type UploadFileCategory =
    | 'STORE_RENT_CONTRACT'
    | 'BUSINESS_REGISTRATION'
    | 'BUSINESS_LICENSE'
    | 'STORE_FLOOR_PLAN'
    | 'EMPLOYMENT_CONTRACT'
    | 'PAYROLL_STATEMENT'
    | 'ETC_ATTACHMENT'
    | 'WORK_CONTRACT'
    | 'WAGE_CONTRACT'
    | 'PAYROLL_ATTACHMENT'
    | 'MENU_IMAGE'
    | 'ORGANIZATION_LOGO_EXPANDED'
    | 'ORGANIZATION_LOGO_COLLAPSED'
    | 'STORE_IMAGE'
    | 'ETC_IMAGE'
    | 'CONTRACT_SIGNATURE'


// 파일이 참조하는 도메인(어떤 화면/엔티티에 속하는지)
export type ReferenceType =
    | 'STORE'
    | 'ORGANIZATION'
    | 'MENU'
    | 'MEMBER'
    | 'EMPLOYMENT_CONTRACT_HEADER'
    | 'EMPLOYMENT_CONTRACT'
    | 'PAYROLL_STATEMENT'

/**
 * 업로드 파일 인터페이스
 */
// 업로드 파일 메타데이터
export interface UploadFile {
    id: number
    originalFileName: string
    storedFileName: string
    fileSize: number
    contentType: string
    fileExtension: string
    uploadFileType: UploadFileType
    uploadFileCategory: UploadFileCategory
    referenceType: ReferenceType
    referenceId: number
    isPublic: boolean
    publicUrl: string
    createdAt: Date
}
