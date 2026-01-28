'use client'
import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import { useStoreDetail, useCreateStore, useUpdateStore } from '@/hooks/queries'
import { useBp } from '@/hooks/useBp'
import type { StoreDetailResponse, FieldErrors, StoreFormState } from '@/types/store'
import { StoreDetailBasicInfo } from '@/components/store/manage/StoreDetailBasicInfo'
import { StoreDetailOperatingHours } from '@/components/store/manage/StoreDetailOperatingHours'
import {
  buildPayload,
  normalizeBusinessNumber,
  normalizePhoneNumber,
  toWeekdayLabel,
  useStoreDetailForm,
  validateForm,
  weekdayKeys,
} from '@/hooks/store/useStoreDetailForm'
import { useStoreFiles } from '@/hooks/store/useStoreFiles'
import { UploadFile } from '@/types/upload-files'
import { formatDateYmd } from '@/util/date-util'

// 점포 상세/등록 페이지 진입 컴포넌트
export default function StoreDetail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeIdParam = searchParams.get('id')
  const storeId = storeIdParam ? Number(storeIdParam) : null
  const isEditMode = !!storeId

  const { data: detail, isPending: loading } = useStoreDetail(storeId)

  const breadcrumbs = useMemo(() => ['Home', '가맹점 및 점포 관리', '점포 정보 관리'], [])

  return (
    <div className="data-wrap">
      <Location title="점포 정보 관리" list={breadcrumbs} />
      {isEditMode && loading && !detail && <div className="data-loading">점포 정보를 불러오는 중...</div>}
      {(!isEditMode || detail) && (
        <StoreDetailForm
          key={detail?.storeInfo.id ?? (storeId ? `loading-${storeId}` : 'new')}
          detail={detail}
          isEditMode={isEditMode}
          onHoliday={() => router.push('/system/holiday')}
          onAfterSave={() => router.push('/store/info')}
        />
      )}
    </div>
  )
}

// 상세 폼 내부 컴포넌트 props
interface StoreDetailFormProps {
  detail?: StoreDetailResponse | null
  isEditMode: boolean
  onHoliday: () => void
  onAfterSave: () => void
}

// 상세 폼(저장/검증/입력 포함) 본체
function StoreDetailForm({ detail, isEditMode, onHoliday, onAfterSave }: StoreDetailFormProps) {
  const { data: bpTree, loading: bpLoading, getBpDetail } = useBp()

  const {
    formState,
    setFormState,
    storeInfoOpen,
    setStoreInfoOpen,
    operatingOpen,
    setOperatingOpen,
    addressDetailRef,
    franchiseOptions,
    handleOfficeChange,
    handleFranchiseChange,
    handleAddressSearch,
    handleOperatingChange,
    handleSameAsOwnerChange,
    handleWeekdayToggle,
    handleStoreOwnerChange,
  } = useStoreDetailForm({
    detail,
    isEditMode,
    bpTree,
    getBpDetail,
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formErrors, setFormErrors] = useState<string[]>([])

  const { mutateAsync: createStore, isPending: createPending } = useCreateStore()
  const { mutateAsync: updateStore, isPending: updatePending } = useUpdateStore()
  const saving = createPending || updatePending

  const {
    existingStoreImages,
    existingBusinessFile,
    storeImagePreviews,
    businessFilePreview,
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
  } = useStoreFiles(formState, setFormState)

  // 저장 요청(검증 -> confirm -> API 호출)
  const handleSubmit = async () => {
    const validationErrors = validateForm(formState)
    setFieldErrors(validationErrors.fieldErrors)
    setFormErrors(validationErrors.formErrors)
    if (Object.keys(validationErrors.fieldErrors).length || validationErrors.formErrors.length) return

    if (!window.confirm('저장하시겠습니까?')) return

    const existingFileIds = new Set(formState.existingFiles.map((file: UploadFile) => file.id))
    const payload = buildPayload(formState)
    const files = {
      businessFile: formState.businessFile,
      storeImages: formState.storeImages,
      deleteImages: formState.deleteImages.filter((id: number) => existingFileIds.has(id)),
    }

    try {
      if (isEditMode && detail?.storeInfo.id) {
        await updateStore({ storeId: detail.storeInfo.id, payload, files })
      } else {
        await createStore({ payload, files })
      }

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('store-search-state')
      }
      onAfterSave()
    } catch {
      window.alert('점포 저장/삭제에 실패했습니다. 잠시 후 다시 시도해주세요')
      return
    }
  }

  return (
    <>
      {formErrors.length > 0 && (
        <div className="form-helper error">
          {formErrors.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </div>
      )}
      <div className="detail-wrap">
        <div className="detail-header">
          <div className="detail-actions" style={{ justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
            <button className="btn-form basic" type="button" onClick={handleSubmit} disabled={saving}>
              저장
            </button>
          </div>
        </div>

        <StoreDetailBasicInfo
          isOpen={storeInfoOpen}
          isEditMode={isEditMode}
          formState={formState}
          fieldErrors={fieldErrors}
          bpTree={bpTree}
          bpLoading={bpLoading}
          franchiseOptions={franchiseOptions}
          addressDetailRef={addressDetailRef}
          existingBusinessFile={existingBusinessFile}
          existingStoreImages={existingStoreImages}
          businessFilePreview={businessFilePreview}
          storeImagePreviews={storeImagePreviews}
          onToggleOpen={() => setStoreInfoOpen((prev: boolean) => !prev)}
          onStoreOwnerChange={handleStoreOwnerChange}
          onOfficeChange={handleOfficeChange}
          onFranchiseChange={handleFranchiseChange}
          onStoreNameChange={(value) => setFormState((prev: StoreFormState) => ({ ...prev, storeName: value }))}
          onOperationStatusChange={(value) => setFormState((prev: StoreFormState) => ({ ...prev, operationStatus: value }))}
          onSameAsOwnerChange={handleSameAsOwnerChange}
          onRemoveBusinessFile={handleRemoveBusinessFile}
          onRemoveExistingBusinessFile={handleRemoveExistingBusinessFile}
          onBusinessFileDownload={handleBusinessFileDownload}
          onBusinessFilesSelect={handleBusinessFilesSelect}
          onCeoNameChange={(value) => setFormState((prev: StoreFormState) => ({ ...prev, ceoName: value }))}
          onBusinessNumberChange={(value) =>
            setFormState((prev: StoreFormState) => ({
              ...prev,
              businessNumber: normalizeBusinessNumber(value),
            }))
          }
          onStoreAddressDetailChange={(value) => setFormState((prev: StoreFormState) => ({ ...prev, storeAddressDetail: value }))}
          onCeoPhoneChange={(value) =>
            setFormState((prev: StoreFormState) => ({
              ...prev,
              ceoPhone: normalizePhoneNumber(value),
            }))
          }
          onStorePhoneChange={(value) =>
            setFormState((prev: StoreFormState) => ({
              ...prev,
              storePhone: normalizePhoneNumber(value),
            }))
          }
          onStoreImagesSelect={handleStoreImagesSelect}
          onRemoveNewImage={handleRemoveNewImage}
          onToggleDeleteImage={toggleDeleteImage}
          onAddressSearch={handleAddressSearch}
          onExistingFileDownload={handleExistingFileDownload}
          onRemoveAllStoreImages={handleRemoveAllStoreImages}
          getFileUrl={getFileUrl}
          resolveExistingFileUrl={resolveExistingFileUrl}
        />

        <StoreDetailOperatingHours
          isOpen={operatingOpen}
          formState={formState}
          weekdayKeys={weekdayKeys}
          toWeekdayLabel={toWeekdayLabel}
          onToggleOpen={() => setOperatingOpen((prev: boolean) => !prev)}
          onOperatingChange={handleOperatingChange}
          onWeekdayToggle={handleWeekdayToggle}
          onHoliday={onHoliday}
        />
      </div>
      <div className="detail-data-info-wrap" style={{ marginTop: '20px' }}>
        <table className="default-table">
          <colgroup>
            <col width="120px" />
            <col />
            <col width="120px" />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>등록자</th>
              <td>
                <div className="data-filed">
                  <input type="text" className="input-frame" defaultValue={detail?.storeInfo.createdBy} disabled />
                </div>
              </td>
              <th>등록일시</th>
              <td>
                <div className="data-filed">
                  <input type="text" className="input-frame" defaultValue={formatDateYmd(detail?.storeInfo.createdAt)} disabled />
                </div>
              </td>
            </tr>
            <tr>
              <th>최종 수정자</th>
              <td>
                <div className="data-filed">
                  <input type="text" className="input-frame" defaultValue={detail?.storeInfo.updatedBy} disabled />
                </div>
              </td>
              <th>최종 수정일시</th>
              <td>
                <div className="data-filed">
                  <input type="text" className="input-frame" defaultValue={formatDateYmd(detail?.storeInfo.updatedAt)} disabled />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
