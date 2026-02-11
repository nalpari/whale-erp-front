'use client'

import {
  forwardRef,
  useCallback,
  useId,
  useRef,
  type ChangeEvent,
  type DragEvent,
} from 'react'

/**
 * 파일 아이템 타입
 */
export interface FileItem {
  /** 파일 고유 ID (기존 파일용) */
  id?: string | number
  /** 파일명 */
  name: string
  /** 파일 객체 (새로 추가된 파일) */
  file?: File
  /** 파일 타입 */
  type?: string
  /** 파일 크기 */
  size?: number
}

/**
 * FileUpload 컴포넌트 Props
 */
export interface FileUploadProps {
  /** 라벨 텍스트 */
  label?: string
  /** 필수 입력 여부 */
  required?: boolean
  /** 에러 상태 */
  error?: boolean
  /** 에러 메시지 또는 도움말 */
  helpText?: string
  /** 현재 파일 목록 */
  files: FileItem[]
  /** 파일 추가 핸들러 */
  onAdd: (files: File[]) => void
  /** 파일 삭제 핸들러 */
  onRemove: (index: number) => void
  /** 파일 클릭 핸들러 (다운로드 등) */
  onFileClick?: (file: FileItem, index: number) => void
  /** 다중 파일 허용 여부 */
  multiple?: boolean
  /** 비활성화 여부 */
  disabled?: boolean
  /** 허용 파일 타입 (예: "image/*", ".pdf,.doc") */
  accept?: string
  /** 안내 문구 */
  guideText?: string
  /** 컨테이너 추가 클래스 */
  containerClassName?: string
}

/**
 * 파일 업로드 공통 컴포넌트
 * - Drag & Drop 지원 (박스 영역 전체)
 * - 박스 클릭 시 파일 선택 다이얼로그 오픈
 * - 단일/다중 파일 업로드 지원
 * - 파일 목록 표시 (파일명, 삭제)
 * - pub 프로젝트 디자인 패턴 적용
 */
const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      label,
      required = false,
      error = false,
      helpText,
      files,
      onAdd,
      onRemove,
      onFileClick,
      multiple = false,
      disabled = false,
      accept,
      guideText = 'Drag & Drop으로 파일을 옮겨주세요.',
      containerClassName = '',
    },
    ref
  ) => {
    const inputId = useId()
    const inputRef = useRef<HTMLInputElement>(null)
    const actualRef = ref || inputRef

    // 파일 선택 핸들러
    const handleInputChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        if (disabled) return
        const selectedFiles = event.target.files ? Array.from(event.target.files) : []
        if (selectedFiles.length === 0) return
        onAdd(multiple ? selectedFiles : selectedFiles.slice(0, 1))
        // 같은 파일 다시 선택 가능하도록 초기화
        event.target.value = ''
      },
      [disabled, multiple, onAdd]
    )

    // 박스 클릭 시 파일 선택 다이얼로그 열기
    const handleBoxClick = useCallback(() => {
      if (disabled) return
      const input = actualRef && typeof actualRef !== 'function' ? actualRef.current : inputRef.current
      input?.click()
    }, [disabled, actualRef])

    // Drag Over 핸들러
    const handleDragOver = useCallback(
      (event: DragEvent<HTMLDivElement>) => {
        if (disabled) return
        event.preventDefault()
        event.stopPropagation()
      },
      [disabled]
    )

    // Drop 핸들러
    const handleDrop = useCallback(
      (event: DragEvent<HTMLDivElement>) => {
        if (disabled) return
        event.preventDefault()
        event.stopPropagation()
        const droppedFiles = event.dataTransfer.files
          ? Array.from(event.dataTransfer.files)
          : []
        if (droppedFiles.length === 0) return
        onAdd(multiple ? droppedFiles : droppedFiles.slice(0, 1))
      },
      [disabled, multiple, onAdd]
    )

    // 파일 클릭 핸들러
    const handleFileClick = useCallback(
      (event: React.MouseEvent, file: FileItem, index: number) => {
        event.stopPropagation() // 박스 클릭 이벤트 방지
        if (onFileClick) {
          onFileClick(file, index)
        }
      },
      [onFileClick]
    )

    // 삭제 버튼 클릭 핸들러
    const handleRemoveClick = useCallback(
      (event: React.MouseEvent, index: number) => {
        event.stopPropagation() // 박스 클릭 이벤트 방지
        onRemove(index)
      },
      [onRemove]
    )

    return (
      <div className={containerClassName}>
        {/* 라벨 */}
        {label && (
          <label
            htmlFor={inputId}
            className="flex items-center gap-1 mb-1 text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="red">*</span>}
          </label>
        )}

        {/* 숨겨진 파일 input */}
        <input
          ref={actualRef}
          type="file"
          id={inputId}
          className="hidden"
          style={{ display: 'none' }}
          multiple={multiple}
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
        />

        {/* Drag & Drop 영역 + 파일 목록 */}
        <div
          className={`file-bx${error ? ' border-red-500' : ''}${disabled ? '' : ' cursor-pointer'}`}
          onClick={handleBoxClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* 안내 문구 */}
          <div className="file-guide">{guideText}</div>

          {/* 파일 목록 */}
          {files.length > 0 && (
            <ul className="file-list">
              {files.map((file, index) => (
                <li key={file.id ?? `${file.name}-${index}`} className="file-item">
                  <div className="file-item-wrap">
                    {/* 파일명 */}
                    <button
                      type="button"
                      className="file-name"
                      onClick={(e) => handleFileClick(e, file, index)}
                      disabled={disabled}
                    >
                      {file.name}
                    </button>

                    {/* 삭제 버튼 */}
                    {!disabled && (
                      <button
                        type="button"
                        className="file-delete"
                        onClick={(e) => handleRemoveClick(e, index)}
                        aria-label={`${file.name} 삭제`}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 에러/도움말 메시지 */}
        {helpText && (
          <div
            className={`${error ? 'warning-txt' : 'form-helper'} mt5`}
            role={error ? 'alert' : undefined}
          >
            {error && '* '}
            {helpText}
          </div>
        )}
      </div>
    )
  }
)

FileUpload.displayName = 'FileUpload'

export default FileUpload
