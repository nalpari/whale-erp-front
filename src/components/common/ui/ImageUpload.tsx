'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Image from 'next/image'

/**
 * 이미지 아이템 타입
 */
export interface ImageItem {
  /** 이미지 고유 ID (기존 이미지용) */
  id?: string | number
  /** 파일명 */
  name: string
  /** 파일 객체 (새로 추가된 이미지) */
  file?: File
  /** 이미지 URL (미리보기용) */
  url?: string
  /** 파일 타입 */
  type?: string
  /** 파일 크기 */
  size?: number
}

/**
 * ImageUpload 컴포넌트 Props
 */
export interface ImageUploadProps {
  /** 라벨 텍스트 */
  label?: string
  /** 필수 입력 여부 */
  required?: boolean
  /** 에러 상태 */
  error?: boolean
  /** 에러 메시지 또는 도움말 */
  helpText?: string
  /** 현재 이미지 목록 */
  images: ImageItem[]
  /** 이미지 추가 핸들러 */
  onAdd: (files: File[]) => void
  /** 이미지 삭제 핸들러 */
  onRemove: (index: number) => void
  /** 이미지 순서 변경 핸들러 */
  onReorder?: (newOrder: ImageItem[]) => void
  /** 이미지 클릭 핸들러 (다운로드 등) */
  onImageClick?: (image: ImageItem, index: number) => void
  /** 다중 이미지 허용 여부 */
  multiple?: boolean
  /** 비활성화 여부 */
  disabled?: boolean
  /** 허용 이미지 타입 (기본값: "image/*") */
  accept?: string
  /** 안내 문구 */
  guideText?: string
  /** 컨테이너 추가 클래스 */
  containerClassName?: string
}

/**
 * 드래그 가능한 이미지 아이템 컴포넌트
 */
function SortableImageItem({
  image,
  index,
  disabled,
  onRemove,
  onImageClick,
}: {
  image: ImageItem
  index: number
  disabled: boolean
  onRemove: (index: number) => void
  onImageClick?: (image: ImageItem, index: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id ?? `image-${index}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleRemoveClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      onRemove(index)
    },
    [index, onRemove]
  )

  const handleImageClick = useCallback(() => {
    if (onImageClick) {
      onImageClick(image, index)
    }
  }, [image, index, onImageClick])

  return (
    <div ref={setNodeRef} style={style} className="file-sumnail-btn">
      <div
        className="sumnail-img"
        onClick={handleImageClick}
        style={{ cursor: onImageClick ? 'pointer' : 'default', position: 'relative' }}
        {...(!disabled ? { ...attributes, ...listeners } : {})}
      >
        {image.url ? (
          <Image
            src={image.url}
            alt={image.name}
            fill
            style={{ objectFit: 'cover', borderRadius: '6px' }}
            sizes="200px"
            unoptimized={image.url.startsWith('blob:') || image.url.startsWith('data:')}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400">이미지 없음</div>
        )}
      </div>
      <div className="sumnail-info">
        <button
          type="button"
          className="sumnail-info-tit"
          onClick={handleImageClick}
          disabled={disabled || !onImageClick}
        >
          {image.name}
        </button>
        {!disabled && (
          <button
            type="button"
            className="file-delete"
            onClick={handleRemoveClick}
            aria-label={`${image.name} 삭제`}
          />
        )}
      </div>
    </div>
  )
}

/**
 * 이미지 업로드 공통 컴포넌트
 * - Drag & Drop 지원 (박스 영역 전체)
 * - 박스 클릭 시 파일 선택 다이얼로그 오픈
 * - 단일/다중 이미지 업로드 지원
 * - 이미지 미리보기 (썸네일)
 * - 드래그&드랍으로 순서 변경 가능
 */
const ImageUpload = forwardRef<HTMLInputElement, ImageUploadProps>(
  (
    {
      label,
      required = false,
      error = false,
      helpText,
      images,
      onAdd,
      onRemove,
      onReorder,
      onImageClick,
      multiple = false,
      disabled = false,
      accept = 'image/*',
      guideText = 'Drag & Drop으로 파일을 옮겨주세요.',
      containerClassName = '',
    },
    ref
  ) => {
    const inputId = useId()
    const inputRef = useRef<HTMLInputElement>(null)
    const actualRef = ref || inputRef

    // 현재 활성 Blob URL 추적 (cleanup용)
    const activeBlobUrlsRef = useRef<string[]>([])

    // 이미지 미리보기 URL 생성 (파생 값 — setState 없이 계산)
    const imageUrls = useMemo(() => {
      const urls: Record<string | number, string> = {}

      images.forEach((image, index) => {
        const key = image.id ?? `image-${index}`
        if (image.url) {
          urls[key] = image.url
        } else if (image.file) {
          urls[key] = URL.createObjectURL(image.file)
        }
      })

      return urls
    }, [images])

    // Blob URL lifecycle 관리 (생성/해제는 effect에서)
    useEffect(() => {
      const currentBlobUrls = Object.values(imageUrls).filter((url) => url.startsWith('blob:'))
      const prevBlobUrls = activeBlobUrlsRef.current

      // 이전에 있었지만 현재 없는 URL 해제
      prevBlobUrls.forEach((url) => {
        if (!currentBlobUrls.includes(url)) {
          URL.revokeObjectURL(url)
        }
      })
      activeBlobUrlsRef.current = currentBlobUrls

      // 언마운트 시 모든 Blob URL 해제
      return () => {
        currentBlobUrls.forEach((url) => URL.revokeObjectURL(url))
      }
    }, [imageUrls])

    // 드래그 센서 설정
    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    // 파일 선택 핸들러
    const handleInputChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        if (disabled) return
        const selectedFiles = event.target.files ? Array.from(event.target.files) : []
        if (selectedFiles.length === 0) return

        // 이미지 파일만 필터링
        const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'))
        if (imageFiles.length === 0) {
          alert('이미지 파일만 업로드 가능합니다.')
          return
        }

        onAdd(multiple ? imageFiles : imageFiles.slice(0, 1))
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
        const droppedFiles = event.dataTransfer.files ? Array.from(event.dataTransfer.files) : []
        if (droppedFiles.length === 0) return

        // 이미지 파일만 필터링
        const imageFiles = droppedFiles.filter((file) => file.type.startsWith('image/'))
        if (imageFiles.length === 0) {
          alert('이미지 파일만 업로드 가능합니다.')
          return
        }

        onAdd(multiple ? imageFiles : imageFiles.slice(0, 1))
      },
      [disabled, multiple, onAdd]
    )

    // 드래그 종료 핸들러 (순서 변경)
    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id || !onReorder) return

        const oldIndex = images.findIndex((img, idx) => {
          const imgId = img.id ?? `image-${idx}`
          return imgId === active.id
        })
        const newIndex = images.findIndex((img, idx) => {
          const imgId = img.id ?? `image-${idx}`
          return imgId === over.id
        })

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(images, oldIndex, newIndex)
          onReorder(reordered)
        }
      },
      [images, onReorder]
    )

    // 이미지 삭제 핸들러
    const handleRemoveClick = useCallback(
      (index: number) => {
        onRemove(index)
      },
      [onRemove]
    )

    // 이미지 클릭 핸들러
    const handleImageClick = useCallback(
      (image: ImageItem, index: number) => {
        if (onImageClick) {
          onImageClick(image, index)
        }
      },
      [onImageClick]
    )

    const imageIds = images.map((img, idx) => img.id ?? `image-${idx}`)

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

        {/* Drag & Drop 영역 + 이미지 목록 */}
        <div
          className={`file-bx sumnail${error ? ' border-red-500' : ''}${disabled ? '' : ' cursor-pointer'}`}
          onClick={handleBoxClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* 안내 문구 */}
          <div className="file-guide">{guideText}</div>

          {/* 이미지 목록 */}
          {images.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={imageIds} strategy={horizontalListSortingStrategy}>
                <div className="file-sumnail-list">
                  {images.map((image, index) => {
                    const imageId = image.id ?? `image-${index}`
                    return (
                      <SortableImageItem
                        key={imageId}
                        image={{
                          ...image,
                          url: imageUrls[imageId] || image.url,
                        }}
                        index={index}
                        disabled={disabled}
                        onRemove={handleRemoveClick}
                        onImageClick={handleImageClick}
                      />
                    )
                  })}
                </div>
              </SortableContext>
            </DndContext>
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

ImageUpload.displayName = 'ImageUpload'

export default ImageUpload
