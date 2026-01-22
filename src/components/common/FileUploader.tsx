/**
 * 파일 업로더 공통 컴포넌트
 *
 * - 단일/다중 파일 업로드를 모두 지원합니다.
 * - 기존에 서버에 저장된 파일과, 지금 막 선택한 새 파일을 함께 보여줍니다.
 * - Drag & Drop, 파일 선택, 삭제/전체삭제, 샘플 다운로드(옵션)를 지원합니다.
 *
 * 사용 예시:
 * 1) 단일 파일 (사업자등록증 등)
 *    <FileUploader
 *      mode="single"
 *      value={formState.businessFile}
 *      previews={businessPreviews}
 *      existingFiles={existingBusinessFiles}
 *      onChange={handleBusinessFilesSelect}
 *      onRemoveNew={() => setBusinessFile(null)}
 *      onRemoveExisting={handleRemoveExistingBusinessFile}
 *      onDownloadExisting={handleDownloadExistingFile}
 *    />
 *
 * 2) 여러 파일 (매장 이미지 여러 장)
 *    <FileUploader
 *      mode="multiple"
 *      value={formState.storeImages}
 *      previews={storeImagePreviews}
 *      existingFiles={existingStoreImages}
 *      onChange={handleStoreImagesSelect}
 *      onRemoveNew={handleRemoveNewImage}
 *      onRemoveExisting={handleToggleDeleteImage}
 *      onDownloadExisting={handleDownloadExistingFile}
 *      onRemoveAll={handleRemoveAllStoreImages}
 *    />
 */
import { useMemo } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import type { UploadFile } from '@/types/upload-files'
import Image from 'next/image'

// 업로드 직후 보여줄 미리보기 정보(새 파일용)
interface FilePreviewItem {
  file: File
  url: string
}

// FileUploader가 받을 props 정의
interface FileUploaderProps {
  mode: 'single' | 'multiple'
  value?: File | File[] | null
  previews?: FilePreviewItem[]
  existingFiles?: UploadFile[]
  onChange: (files: File[]) => void
  onRemoveNew: (index: number) => void
  onRemoveExisting: (fileId: number) => void
  onDownloadExisting: (file: UploadFile) => void
  onDownloadNew?: (file: File) => void
  getExistingFileUrl?: (file: UploadFile) => string
  resolveExistingFileUrl?: (file: UploadFile) => Promise<string | null>
  allowDrop?: boolean
  showSampleButton?: boolean
  onSampleDownload?: () => void
  onRemoveAll?: () => void
  disableRemoveAll?: boolean
}

// value가 단일 파일이든 배열이든 항상 배열로 바꿔주는 유틸 함수
const toArray = (value?: File | File[] | null) => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

export const FileUploader = ({
  mode,
  value,
  previews = [],
  existingFiles = [],
  onChange,
  onRemoveNew,
  onRemoveExisting,
  onDownloadExisting,
  onDownloadNew,
  getExistingFileUrl,
  resolveExistingFileUrl,
  allowDrop = true,
  showSampleButton = false,
  onSampleDownload,
  onRemoveAll,
  disableRemoveAll = false,
}: FileUploaderProps) => {
  // 새로 선택된 파일 목록 (항상 배열로 관리)
  const newFiles = toArray(value)
  // 화면에 표시할 총 파일 개수(기존 + 신규)
  const fileCount = existingFiles.length + newFiles.length
  // 부모에서 받은 미리보기 배열을 memo로 고정(불필요한 렌더링 방지)
  const computedPreviews = useMemo(() => previews, [previews])

  // 다중 업로드인지 여부
  const isMultiple = mode === 'multiple'
  // 다중 업로드일 때만 "전체 삭제"를 보여줄지 결정
  const hasRemoveAll = isMultiple && onRemoveAll
  const handleDownloadExisting = async (file: UploadFile) => {
    if (resolveExistingFileUrl) {
      try {
        const url = await resolveExistingFileUrl(file)
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer')
          return
        }
      } catch {
        // ignore and fall back to provided handler
      }
    }

    onDownloadExisting(file)
  }
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    if (files.length === 0) return
    onChange(isMultiple ? files : files.slice(0, 1))
    // 같은 파일을 다시 선택할 수 있도록 input 값을 초기화
    event.target.value = ''
  }
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!allowDrop) return
    // Drag & Drop 허용 시 기본 동작(브라우저 열기)을 막기
    event.preventDefault()
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!allowDrop) return
    event.preventDefault()
    const files = event.dataTransfer.files ? Array.from(event.dataTransfer.files) : []
    if (files.length === 0) return
    onChange(isMultiple ? files : files.slice(0, 1))
  }

  return (
    <div className="file-bx" onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className="file-guide">Drag & Drop으로 파일을 옮겨주세요.</div>
      <div className="filed-check-flx" style={{ alignItems: 'center', gap: '8px' }}>
        <input type="file" multiple={isMultiple} onChange={handleInputChange} />
        {showSampleButton && (
          <button className="btn-form basic" type="button" onClick={onSampleDownload}>
            샘플
          </button>
        )}
        {isMultiple && (
          <span className="form-helper">
            파일 {fileCount}개
          </span>
        )}
        {hasRemoveAll && (
          <span
            onClick={() => {
              if (disableRemoveAll) return
              onRemoveAll()
            }}
            style={{
              marginTop: '5px',
              cursor: disableRemoveAll ? 'not-allowed' : 'pointer',
              color: '#000',
              fontSize: '14px',
              fontStyle: 'bold',
              textDecoration: 'underline',
              opacity: disableRemoveAll ? 0.5 : 1,
            }}
            aria-disabled={disableRemoveAll}
          >
            모두 삭제
          </span>)}
      </div>
      <ul className="file-list">
        {/* 서버에 이미 저장된 파일 목록 */}
        {existingFiles.map((file) => {
          const isImage = file.uploadFileType === 'IMAGE'
          const previewUrl = isImage
            ? getExistingFileUrl
              ? getExistingFileUrl(file)
              : file.publicUrl
            : ''
          return (
            <li key={file.id} className="file-item">
              <div className="file-item-wrap">
                <button className="file-name" type="button" onClick={() => void handleDownloadExisting(file)}>
                  {file.originalFileName}
                </button>
                <button className="file-delete" type="button" onClick={() => onRemoveExisting(file.id)}></button>
                {isImage ? (
                  <span className="file-preview-wrap">
                    <span className="file-preview" />
                    <span className="file-preview-popup">
                      {previewUrl ? (
                        <Image src={previewUrl} alt={file.originalFileName} width={360} height={360} />
                      ) : (
                        <span className="file-preview-empty">이미지를 로드 할 수 없습니다</span>
                      )}
                    </span>
                  </span>
                ) : null}
              </div>
            </li>
          )
        })}
        {/* 사용자가 이번에 선택한 새 파일 목록 */}
        {newFiles.map((file, index) => {
          const preview = computedPreviews[index]
          return (
            <li key={`${file.name}-${index}`} className="file-item">
              <div className="file-item-wrap">
                {preview?.url ? (
                  <span className="file-name plain">{file.name}</span>
                ) : onDownloadNew ? (
                  <button className="file-name" type="button" onClick={() => onDownloadNew(file)}>
                    {file.name}
                  </button>
                ) : (
                  <span className="file-name plain">{file.name}</span>
                )}
                <button className="file-delete" type="button" onClick={() => onRemoveNew(index)}></button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
