/**
 * 매장 정보 폼의 파일 상태/이벤트를 관리하는 훅
 *
 * - 기존 파일(서버)과 새 파일(로컬)을 함께 관리합니다.
 * - 삭제 요청 목록(deleteImages)을 유지해서 저장 시 서버에 반영합니다.
 * - 미리보기 URL을 생성/해제합니다.
 */
import { useEffect, useMemo, useRef } from 'react'
import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import type { StoreFormState } from '@/types/store'
import type { UploadFile } from '@/types/upload-files'
import api from '@/lib/api'

// 업로드 카테고리 기준으로 점포 이미지 판별
const isStoreImage = (file: UploadFile) =>
  file.uploadFileCategory === 'STORE_IMAGE'

// 업로드 카테고리 기준으로 사업자등록증 파일 판별
const isBusinessFile = (file: UploadFile) =>
  file.uploadFileCategory === 'BUSINESS_REGISTRATION'

// 점포 파일(사업자등록증/점포이미지) 상태와 미리보기를 관리하는 훅
export const useStoreFiles = (
  formState: StoreFormState,
  setFormState: Dispatch<SetStateAction<StoreFormState>>,
) => {
  // 이전 미리보기 URL 추적(메모리 누수 방지)
  const prevStoreImageUrlsRef = useRef<string[]>([])
  const prevBusinessFileUrlRef = useRef<string | null>(null)

  // 삭제 예정이 아닌 기존 점포 이미지
  // 삭제 목록에 없는 "기존 매장 이미지"만 추려서 보여줌
  const existingStoreImages = useMemo(
    () => formState.existingFiles.filter((file: UploadFile) => isStoreImage(file) && !formState.deleteImages.includes(file.id)),
    [formState.existingFiles, formState.deleteImages],
  )

  // 기존 사업자등록증 파일(1개)
  // 기존 사업자등록증 파일(1개만 존재)
  const existingBusinessFile = useMemo(() => {
    if (formState.businessFile) return undefined
    const file = formState.existingFiles.find(isBusinessFile)
    if (!file) return undefined
    if (formState.deleteImages.includes(file.id)) return undefined
    return file
  }, [formState.businessFile, formState.deleteImages, formState.existingFiles])

  // 신규 업로드 이미지 미리보기 URL 생성
  // 새로 선택한 매장 이미지 미리보기 URL 생성
  const storeImagePreviews = useMemo(
    () => formState.storeImages.map((file: File) => ({ file, url: URL.createObjectURL(file) })),
    [formState.storeImages],
  )

  // 신규 업로드 사업자등록증 미리보기 URL 생성
  // 새로 선택한 사업자등록증 미리보기 URL 생성
  const businessFilePreview = useMemo(() => {
    if (!formState.businessFile) return null
    return URL.createObjectURL(formState.businessFile)
  }, [formState.businessFile])

  // 매장 이미지 미리보기 URL 변경 시 이전 URL 해제
  useEffect(() => {
    const previousUrls = prevStoreImageUrlsRef.current
    previousUrls.forEach((url) => URL.revokeObjectURL(url))
    const nextUrls = storeImagePreviews.map((item) => item.url)
    prevStoreImageUrlsRef.current = nextUrls
    return () => {
      nextUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [storeImagePreviews])

  // 사업자등록증 미리보기 URL 변경 시 이전 URL 해제
  useEffect(() => {
    const previousUrl = prevBusinessFileUrlRef.current
    if (previousUrl && previousUrl !== businessFilePreview) {
      URL.revokeObjectURL(previousUrl)
    }
    prevBusinessFileUrlRef.current = businessFilePreview
    return () => {
      const currentUrl = prevBusinessFileUrlRef.current
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [businessFilePreview])

  // 기존 사업자등록증을 새 파일로 교체했는지 추적
  const replacedBusinessFileIdRef = useRef<number | null>(null)

  // 매장 이미지 여러 장 추가
  const appendStoreImages = (files: File[]) => {
    if (files.length === 0) return
    setFormState((prev: StoreFormState) => ({ ...prev, storeImages: [...prev.storeImages, ...files] }))
  }

  // 기존 파일 삭제 목록에 추가
  const markDeleteFile = (fileId: number) => {
    setFormState((prev: StoreFormState) => ({
      ...prev,
      deleteImages: prev.deleteImages.includes(fileId) ? prev.deleteImages : [...prev.deleteImages, fileId],
    }))
  }

  // 기존 사업자등록증이 있으면 삭제 목록에 넣어 교체 준비
  const replaceExistingBusinessFileIfNeeded = () => {
    if (!existingBusinessFile?.id) return
    if (formState.deleteImages.includes(existingBusinessFile.id)) return
    replacedBusinessFileIdRef.current = existingBusinessFile.id
    markDeleteFile(existingBusinessFile.id)
  }

  // 사업자등록증 파일 선택
  // 사업자등록증 파일 선택(input 변경)
  const handleBusinessFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    if (!file) return
    replaceExistingBusinessFileIfNeeded()
    setFormState((prev: StoreFormState) => ({ ...prev, businessFile: file }))
  }

  // 점포 이미지 추가 선택
  // 매장 이미지 추가 선택(input 변경)
  const handleStoreImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    appendStoreImages(files)
    event.target.value = ''
  }

  // 신규 이미지 중 선택 제거
  // 새로 추가한 매장 이미지 하나 제거
  const handleRemoveNewImage = (index: number) => {
    setFormState((prev: StoreFormState) => ({
      ...prev,
      storeImages: prev.storeImages.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  // 기존 이미지 삭제 토글(요청 시 deleteImages에 포함)
  // 기존 매장 이미지 삭제 토글(삭제 목록에 넣거나 빼기)
  const toggleDeleteImage = (fileId: number) => {
    setFormState((prev: StoreFormState) => ({
      ...prev,
      deleteImages: prev.deleteImages.includes(fileId)
        ? prev.deleteImages.filter((id: number) => id !== fileId)
        : [...prev.deleteImages, fileId],
    }))
  }

  // 서버에서 내려주는 공개 URL 반환
  // 서버에서 내려준 공개 URL 반환(없으면 빈 문자열)
  const getFileUrl = (file: UploadFile) => file.publicUrl ?? ''


  // "전체 삭제" 클릭 시 신규 이미지 제거 + 기존 이미지 삭제 목록에 추가
  const handleRemoveAllStoreImages = () => {
    setFormState((prev: StoreFormState) => {
      const existingStoreImageIds = prev.existingFiles
        .filter((file: UploadFile) => isStoreImage(file))
        .map((file: UploadFile) => file.id)
      const nextDeleteImages = existingStoreImageIds.reduce((acc: number[], fileId: number) => {
        if (acc.includes(fileId)) return acc
        return [...acc, fileId]
      }, prev.deleteImages)
      return {
        ...prev,
        storeImages: [],
        deleteImages: nextDeleteImages,
      }
    })
  }

  // FileUploader용: 사업자등록증 파일 선택
  const handleBusinessFilesSelect = (files: File[]) => {
    const file = files[0]
    if (!file) return
    replaceExistingBusinessFileIfNeeded()
    setFormState((prev: StoreFormState) => ({ ...prev, businessFile: file }))
  }

  // FileUploader용: 매장 이미지 여러 장 선택
  const handleStoreImagesSelect = (files: File[]) => {
    appendStoreImages(files)
  }

  // 새로 선택한 사업자등록증 제거 (기존 파일 복구 포함)
  const handleRemoveBusinessFile = () => {
    setFormState((prev: StoreFormState) => {
      const replacedId = replacedBusinessFileIdRef.current
      const nextDeleteImages = replacedId
        ? prev.deleteImages.filter((id: number) => id !== replacedId)
        : prev.deleteImages
      return { ...prev, businessFile: null, deleteImages: nextDeleteImages }
    })
    replacedBusinessFileIdRef.current = null
  }

  // 기존 사업자등록증 삭제 버튼 처리
  const handleRemoveExistingBusinessFile = (fileId: number) => {
    markDeleteFile(fileId)
    replacedBusinessFileIdRef.current = null
  }

  // 기존 파일 다운로드(이미지/첨부 파일 처리 분기)
  const handleExistingFileDownload = async (file: UploadFile) => {
    if (file.uploadFileType !== 'ATTACHMENT') {
      const url = getFileUrl(file)
      if (url) {
        window.open(url, '_blank', 'noopener')
      }
      return
    }
    try {
      const response = await api.get(`/api/v1/files/${file.id}/download-url`)
      const payload = response.data?.data ?? response.data
      const downloadUrl =
        (payload && typeof payload === 'object'
          ? (payload as { downloadUrl?: string; url?: string }).downloadUrl ?? (payload as { url?: string }).url
          : null) ?? (typeof payload === 'string' ? payload : null)
      if (downloadUrl) {
        window.open(downloadUrl, '_blank', 'noopener')
      }
    } catch {
      console.error('파일 다운로드 URL 조회 실패')
      return
    }
  }

  // 기존 파일 미리보기 URL을 얻기 (공개 URL 없으면 다운로드 URL 요청)
  const resolveExistingFileUrl = async (file: UploadFile) => {
    const url = getFileUrl(file)
    if (url) return url
    try {
      const response = await api.get(`/api/v1/files/${file.id}/download-url`)
      const payload = response.data?.data ?? response.data   
      const resolved =
        (payload && typeof payload === 'object'
          ? (payload as { downloadUrl?: string; url?: string }).downloadUrl ?? (payload as { url?: string }).url
          : null) ?? (typeof payload === 'string' ? payload : null)
      return resolved ?? null
    } catch {
      console.error('기존 파일 URL 조회 실패')
      return null
    }
  }

  // 사업자등록증도 기존 파일 다운로드 로직을 그대로 사용
  const handleBusinessFileDownload = (file: UploadFile) => handleExistingFileDownload(file)

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
    handleBusinessFilesSelect,
    handleStoreImagesSelect,
    handleRemoveAllStoreImages,
    handleRemoveBusinessFile,
    handleRemoveExistingBusinessFile,
    handleExistingFileDownload,
    resolveExistingFileUrl,
    handleBusinessFileDownload,
  }
}
