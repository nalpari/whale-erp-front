import '@/components/common/custom-css/FormHelper.css'
import '@/components/store/custom-css/StoreDetailBasicInfo.css'
import type { RefObject } from 'react'
import AnimateHeight from 'react-animate-height'
import { Tooltip } from 'react-tooltip'
import type { BpHeadOfficeNode, BpFranchiseNode } from '@/types/bp'
import type { FieldErrors, StoreFormState } from '@/types/store'
import { UploadFile } from '@/types/upload-files'
import { FileUploader } from '@/components/common/FileUploader'
import AddressSearch, { type AddressData } from '@/components/common/ui/AddressSearch'

// 사업자등록번호 입력값을 000-00-00000 형식으로 보기 좋게 정리
const formatBusinessNumberInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

// 전화번호 입력값을 지역번호/휴대폰 규칙에 맞게 하이픈 처리
const formatPhoneNumberInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''

  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`
    if (digits.length <= 9) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
    }
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

// 점포 기본 정보 섹션 UI 전용 props
// 매장 기본 정보 섹션 UI에서 필요한 props 모음
interface StoreDetailBasicInfoProps {
  // 펼침/접힘 상태
  isOpen: boolean
  // 수정 모드 여부(점포코드 노출 여부에 사용)
  isEditMode: boolean
  formState: StoreFormState
  fieldErrors: FieldErrors
  bpTree: BpHeadOfficeNode[]
  bpLoading: boolean
  franchiseOptions: BpFranchiseNode[]
  addressDetailRef?: RefObject<HTMLInputElement | null>
  /** AddressSearch onChange 핸들러 */
  onAddressChange: (data: AddressData) => void
  existingBusinessFile?: UploadFile
  existingStoreImages: UploadFile[]
  businessFilePreview: string | null
  storeImagePreviews: { file: File; url: string }[]
  // UI 토글/입력 변경 핸들러들
  onToggleOpen: () => void
  onStoreOwnerChange: (owner: StoreFormState['storeOwner']) => void
  onOfficeChange: (nextOfficeId: number | null) => void
  onFranchiseChange: (nextFranchiseId: number | null) => void
  onStoreNameChange: (value: string) => void
  onOperationStatusChange: (value: StoreFormState['operationStatus']) => void
  onSameAsOwnerChange: (checked: boolean, bpId: number | null) => void
  onBusinessFilesSelect: (files: File[]) => void
  onRemoveExistingBusinessFile: (fileId: number) => void
  onBusinessFileDownload: (file: UploadFile) => void
  onRemoveBusinessFile: () => void
  onCeoNameChange: (value: string) => void
  onBusinessNumberChange: (value: string) => void
  onCeoPhoneChange: (value: string) => void
  onStorePhoneChange: (value: string) => void
  onStoreImagesSelect: (files: File[]) => void
  onRemoveNewImage: (index: number) => void
  onToggleDeleteImage: (fileId: number) => void
  onExistingFileDownload: (file: UploadFile) => void
  onRemoveAllStoreImages: () => void
  getFileUrl: (file: UploadFile) => string
  resolveExistingFileUrl: (file: UploadFile) => Promise<string | null>
}

// 점포 기본 정보(소유/조직/사업자/주소/파일) 입력 섹션
// 매장 기본 정보(소유/조직/사업자/주소/이미지) 입력 섹션 컴포넌트
export const StoreDetailBasicInfo = ({
  isOpen,
  isEditMode,
  formState,
  fieldErrors,
  bpTree,
  bpLoading,
  franchiseOptions,
  addressDetailRef,
  onAddressChange,
  existingBusinessFile,
  existingStoreImages,
  businessFilePreview,
  storeImagePreviews,
  onToggleOpen,
  onStoreOwnerChange,
  onOfficeChange,
  onFranchiseChange,
  onStoreNameChange,
  onOperationStatusChange,
  onSameAsOwnerChange,
  onBusinessFilesSelect,
  onRemoveExistingBusinessFile,
  onBusinessFileDownload,
  onRemoveBusinessFile,
  onCeoNameChange,
  onBusinessNumberChange,
  onCeoPhoneChange,
  onStorePhoneChange,
  onStoreImagesSelect,
  onRemoveNewImage,
  onToggleDeleteImage,
  onExistingFileDownload,
  onRemoveAllStoreImages,
  getFileUrl,
  resolveExistingFileUrl,
}: StoreDetailBasicInfoProps) => {
  // 단일 파일 업로더에 맞게 미리보기/기존파일을 배열 형태로 구성
  const businessPreviews =
    businessFilePreview && formState.businessFile
      ? [{ file: formState.businessFile, url: businessFilePreview }]
      : []
  const businessExistingFiles = existingBusinessFile ? [existingBusinessFile] : []

  return (
    <div className={`slidebox-wrap ${isOpen ? '' : 'close'}`}>
      <div className="slidebox-header">
        <h2>점포 정보</h2>
        <div className="slidebox-btn-wrap">
          <button className="slidebox-btn arr" onClick={onToggleOpen}>
            <i className="arr-icon"></i>
          </button>
        </div>
      </div>
      <AnimateHeight duration={300} height={isOpen ? 'auto' : 0}>
        <div className="slidebox-body">
          <table className="default-table">
            <colgroup>
              <col width="160px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>점포 소유</th>
                <td>
                  <div className="filed-check-flx">
                    <div className="radio-form-box">
                      <input
                        type="radio"
                        id="owner-office"
                        name="storeOwner"
                        checked={formState.storeOwner === 'HEAD_OFFICE'}
                        onChange={() => onStoreOwnerChange('HEAD_OFFICE')}
                      />
                      <label htmlFor="owner-office">본사</label>
                    </div>
                    <div className="radio-form-box">
                      <input
                        type="radio"
                        id="owner-franchise"
                        name="storeOwner"
                        checked={formState.storeOwner === 'FRANCHISE'}
                        onChange={() => onStoreOwnerChange('FRANCHISE')}
                      />
                      <label htmlFor="owner-franchise">가맹점</label>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <th>본사/가맹점 선택</th>
                <td>
                  <div className="data-filed store-basic-row">
                    <select
                      className="select-form store-select-fixed"
                      value={formState.officeId ?? ''}
                      onChange={(event) => onOfficeChange(event.target.value ? Number(event.target.value) : null)}
                      disabled={bpLoading}
                    >
                      <option value="">본사 선택</option>
                      {bpTree.map((office) => (
                        <option key={office.id} value={office.id}>
                          {office.name}
                        </option>
                      ))}
                    </select>
                    {formState.storeOwner === 'FRANCHISE' && (
                      <select
                        className="select-form store-select-fixed"
                        value={formState.franchiseId ?? ''}
                        onChange={(event) => onFranchiseChange(event.target.value ? Number(event.target.value) : null)}
                        disabled={bpLoading}
                      >
                        <option value="">가맹점 선택</option>
                        {franchiseOptions.map((franchise) => (
                          <option key={franchise.id} value={franchise.id}>
                            {franchise.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <button className="tooltip-btn store-tooltip-fixed">
                      <span className="tooltip-icon" id="tooltip-btn-anchor"></span>
                      <Tooltip className="tooltip-txt" anchorSelect="#tooltip-btn-anchor">
                        <div>드롭다운 박스에 선택하고자 하는 가맹점 정보가 없는 경우 가맹점 정보를 먼저 등록해 주세요.</div>
                        <div>가맹점은 WHALE ERP와 별도로 ERP 사용에 대한 계약이 체결되어야 합니다.</div>
                      </Tooltip>
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <th>점포명 *</th>
                <td>
                  <div className="filed-check-flx">
                    <input
                      type="text"
                      className="input-frame input-grow store-name-input"
                      value={formState.storeName}
                      onChange={(event) => onStoreNameChange(event.target.value)}
                      readOnly={!formState.organizationId}
                    />
                    {isEditMode && <input type="text" className="input-frame input-grow store-name-input" value={formState.storeCode} readOnly />}
                    {!isEditMode && (
                      <div className="toggle-wrap">
                        <label className="toggle-btn" htmlFor="same-as-owner">
                          <input
                            type="checkbox"
                            id="same-as-owner"
                            checked={formState.sameAsOwner}
                            onChange={(event) => void onSameAsOwnerChange(event.target.checked, formState.organizationId)}
                          />
                          <span className="slider" />
                        </label>
                        <span className="toggle-txt">사업자 정보와 동일</span>
                      </div>
                    )}
                  </div>
                  {fieldErrors.storeName && <div className="warning-txt">{fieldErrors.storeName}</div>}
                </td>
              </tr>
              <tr>
                <th>운영여부</th>
                <td>
                  <div className="filed-check-flx">
                    <div className="radio-form-box">
                      <input
                        type="radio"
                        id="status-operating"
                        name="operationStatus"
                        checked={formState.operationStatus === 'STOPR_001'}
                        onChange={() => onOperationStatusChange('STOPR_001')}
                      />
                      <label htmlFor="status-operating">운영</label>
                    </div>
                    <div className="radio-form-box">
                      <input
                        type="radio"
                        id="status-stopped"
                        name="operationStatus"
                        checked={formState.operationStatus === 'STOPR_002'}
                        onChange={() => onOperationStatusChange('STOPR_002')}
                      />
                      <label htmlFor="status-stopped">미운영</label>
                    </div>
                    {formState.operationStatusEditedDate && (
                      <span className="form-helper">운영여부 변경일: {formState.operationStatusEditedDate}</span>
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <th>사업자등록증</th>
                <td>
                  <div className="store-business-guide">
                    <span className="store-business-guide-text">
                      ※ 사업자등록증 등록 시 대표자, 사업자등록번호, 점포주소가 자동 입력됩니다.
                    </span>
                  </div>
                  <FileUploader
                    mode="single"
                    value={formState.businessFile}
                    previews={businessPreviews}
                    existingFiles={businessExistingFiles}
                    onChange={onBusinessFilesSelect}
                    onRemoveNew={() => onRemoveBusinessFile()}
                    onRemoveExisting={onRemoveExistingBusinessFile}
                    onDownloadExisting={onBusinessFileDownload}
                    getExistingFileUrl={getFileUrl}
                    resolveExistingFileUrl={resolveExistingFileUrl}
                  />
                  {fieldErrors.businessFile && (
                    <div className="warning-txt">{fieldErrors.businessFile}</div>
                  )}
                </td>
              </tr>
              <tr>
                <th>대표자 *</th>
                <td>
                  <input
                    type="text"
                    className="input-frame"
                    value={formState.ceoName}
                    onChange={(event) => onCeoNameChange(event.target.value)}
                  />
                  {fieldErrors.ceoName && <div className="warning-txt">{fieldErrors.ceoName}</div>}
                </td>
              </tr>
              <tr>
                <th>사업자등록번호 *</th>
                <td>
                  <div className="filed-check-flx input-inline-help">
                    <input
                      type="text"
                      className="input-frame"
                      value={formatBusinessNumberInput(formState.businessNumber)}
                      onChange={(event) => onBusinessNumberChange(event.target.value)}
                      inputMode="numeric"
                      maxLength={12}
                    />
                    <span className="form-helper input-helper-inline">※ 숫자만 입력 가능</span>
                  </div>
                  {fieldErrors.businessNumber && <div className="warning-txt">{fieldErrors.businessNumber}</div>}
                </td>
              </tr>
              <tr>
                <th>점포 주소 *</th>
                <td>
                  <AddressSearch
                    value={{
                      address: formState.storeAddress,
                      addressDetail: formState.storeAddressDetail,
                      zonecode: formState.postalCode,
                    }}
                    onChange={onAddressChange}
                      detailInputRef={addressDetailRef}
                    error={!!fieldErrors.storeAddress}
                    helpText={fieldErrors.storeAddress}
                    addressPlaceholder="주소를 선택하세요"
                    detailPlaceholder="상세 주소"
                  />
                </td>
              </tr>
              <tr>
                <th>대표자 핸드폰 번호 *</th>
                <td>
                  <div className="filed-check-flx input-inline-help">
                    <input
                      type="text"
                      className="input-frame"
                      value={formatPhoneNumberInput(formState.ceoPhone)}
                      onChange={(event) => onCeoPhoneChange(event.target.value)}
                      inputMode="numeric"
                      maxLength={13}
                    />
                    <span className="form-helper input-helper-inline">※ 숫자만 입력 가능</span>
                  </div>
                  {fieldErrors.ceoPhone && <div className="warning-txt">{fieldErrors.ceoPhone}</div>}
                </td>
              </tr>
              <tr>
                <th>점포 전화번호</th>
                <td>
                  <div className="filed-check-flx input-inline-help">
                    <input
                      type="text"
                      className="input-frame input-grow"
                      value={formatPhoneNumberInput(formState.storePhone)}
                      onChange={(event) => onStorePhoneChange(event.target.value)}
                      inputMode="numeric"
                      maxLength={13}
                    />
                    <span className="form-helper input-helper-inline">※ 숫자만 입력 가능</span>
                  </div>
                  {fieldErrors.storePhone && <div className="warning-txt">{fieldErrors.storePhone}</div>}
                </td>
              </tr>
              <tr>
                <th>점포 이미지</th>
                <td>
                  <FileUploader
                    mode="multiple"
                    value={formState.storeImages}
                    previews={storeImagePreviews}
                    existingFiles={existingStoreImages}
                    onChange={onStoreImagesSelect}
                    onRemoveNew={onRemoveNewImage}
                    onRemoveExisting={onToggleDeleteImage}
                    onDownloadExisting={onExistingFileDownload}
                    onRemoveAll={onRemoveAllStoreImages}
                    getExistingFileUrl={getFileUrl}
                    resolveExistingFileUrl={resolveExistingFileUrl}
                  />
                  {fieldErrors.storeImages && (
                    <div className="warning-txt">{fieldErrors.storeImages}</div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AnimateHeight>
    </div>
  )
}
