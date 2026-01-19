import { useEffect, useMemo } from 'react'
import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import type { StoreFormState } from '@/types/store'
import type { UploadFile } from '@/types/upload-files'

// 업로드 카테고리 기준으로 점포 이미지 판별
const isStoreImage = (file: UploadFile) =>
  file.referenceType === 'STORE'

// 업로드 카테고리 기준으로 사업자등록증 파일 판별
const isBusinessFile = (file: UploadFile) =>
  file.uploadFileCategory === 'BUSINESS_REGISTRATION'

// 점포 파일(사업자등록증/점포이미지) 상태와 미리보기를 관리하는 훅
export const useStoreFiles = (
  formState: StoreFormState,
  setFormState: Dispatch<SetStateAction<StoreFormState>>,
) => {
  // 삭제 예정이 아닌 기존 점포 이미지
  const existingStoreImages = useMemo(
    () => formState.existingFiles.filter((file: UploadFile) => isStoreImage(file) && !formState.deleteImages.includes(file.id)),
    [formState.existingFiles, formState.deleteImages],
  )

  // 기존 사업자등록증 파일(1개)
  const existingBusinessFile = useMemo(() => formState.existingFiles.find(isBusinessFile), [formState.existingFiles])

  // 신규 업로드 이미지 미리보기 URL 생성
  const storeImagePreviews = useMemo(
    () => formState.storeImages.map((file: File) => ({ file, url: URL.createObjectURL(file) })),
    [formState.storeImages],
  )

  // 신규 업로드 사업자등록증 미리보기 URL 생성
  const businessFilePreview = useMemo(() => {
    if (!formState.businessFile) return null
    return URL.createObjectURL(formState.businessFile)
  }, [formState.businessFile])

  // 컴포넌트 언마운트 시 미리보기 URL 해제
  useEffect(() => {
    return () => {
      storeImagePreviews.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [storeImagePreviews])

  // 사업자등록증 미리보기 URL 해제
  useEffect(() => {
    return () => {
      if (businessFilePreview) {
        URL.revokeObjectURL(businessFilePreview)
      }
    }
  }, [businessFilePreview])

  // 사업자등록증 파일 선택
  const handleBusinessFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((prev: StoreFormState) => ({ ...prev, businessFile: event.target.files?.[0] ?? null }))
  }

  // 점포 이미지 추가 선택
  const handleStoreImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    if (files.length === 0) return
    setFormState((prev: StoreFormState) => ({ ...prev, storeImages: [...prev.storeImages, ...files] }))
    event.target.value = ''
  }

  // 신규 이미지 중 선택 제거
  const handleRemoveNewImage = (index: number) => {
    setFormState((prev: StoreFormState) => ({
      ...prev,
      storeImages: prev.storeImages.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  // 기존 이미지 삭제 토글(요청 시 deleteImages에 포함)
  const toggleDeleteImage = (fileId: number) => {
    setFormState((prev: StoreFormState) => ({
      ...prev,
      deleteImages: prev.deleteImages.includes(fileId)
        ? prev.deleteImages.filter((id: number) => id !== fileId)
        : [...prev.deleteImages, fileId],
    }))
  }

  // 서버에서 내려주는 공개 URL 반환
  const getFileUrl = (file: UploadFile) => file.publicUrl ?? ''

  return {
    existingStoreImages,
    existingBusinessFile,
    storeImagePreviews,
    businessFilePreview,
    handleBusinessFileChange,
    handleStoreImagesChange,
    handleRemoveNewImage,
    toggleDeleteImage,
    getFileUrl,
  }
}
