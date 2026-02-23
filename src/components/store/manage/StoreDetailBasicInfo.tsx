import '@/components/common/custom-css/FormHelper.css'
import '@/components/store/custom-css/StoreDetailBasicInfo.css'
import type { RefObject } from 'react'
import { useMemo } from 'react'
import AnimateHeight from 'react-animate-height'
import { Tooltip } from 'react-tooltip'
import type { BpHeadOfficeNode, BpFranchiseNode } from '@/types/bp'
import type { FieldErrors, StoreFormState } from '@/types/store'
import { UploadFile } from '@/types/upload-files'
import {
  Input,
  FileUpload,
  RadioButtonGroup,
  type FileItem,
  type RadioOption,
} from '@/components/common/ui'
import AddressSearch, { type AddressData } from '@/components/common/ui/AddressSearch'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'

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
}

const storeOwnerOptions: RadioOption<StoreFormState['storeOwner']>[] = [
  { value: 'HEAD_OFFICE', label: '본사' },
  { value: 'FRANCHISE', label: '가맹점' },
]

const operationStatusOptions: RadioOption<StoreFormState['operationStatus']>[] = [
  { value: 'STOPR_001', label: '운영' },
  { value: 'STOPR_002', label: '미운영' },
]

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
}: StoreDetailBasicInfoProps) => {
  // 본사 옵션
  const officeOptions = useMemo<SelectOption[]>(
    () => bpTree.map((office) => ({ value: String(office.id), label: office.name })),
    [bpTree]
  )

  // 가맹점 옵션
  const franchiseSelectOptions = useMemo<SelectOption[]>(
    () => franchiseOptions.map((franchise) => ({ value: String(franchise.id), label: franchise.name })),
    [franchiseOptions]
  )

  // 로그인 사용자 권한에 따른 비활성화 여부 (bpTree 구조 기반 추론)
  // TODO: auth-store에 소속 조직 타입(organizationType: 'HEAD_OFFICE' | 'FRANCHISE')이
  //       저장되면 bpTree 추론 대신 조직 타입 기반으로 변경
  //       - HEAD_OFFICE: isOfficeFixed=true, isFranchiseFixed=false, isOwnerFixed=false
  //       - FRANCHISE: isOfficeFixed=true, isFranchiseFixed=true, isOwnerFixed=true (FRANCHISE 고정)
  const isOfficeFixed = bpTree.length === 1
  const isFranchiseFixed = isOfficeFixed && bpTree[0]?.franchises.length === 1
  const isOwnerFixed = isOfficeFixed && bpTree[0]?.franchises.length === 0

  // 사업자등록증 파일 목록 (기존 파일 + 새 파일)
  const businessFiles = useMemo<FileItem[]>(() => {
    const files: FileItem[] = []
    // 기존 파일
    if (existingBusinessFile) {
      files.push({
        id: existingBusinessFile.id,
        name: existingBusinessFile.originalFileName,
      })
    }
    // 새 파일
    if (formState.businessFile) {
      files.push({
        name: formState.businessFile.name,
        file: formState.businessFile,
      })
    }
    return files
  }, [existingBusinessFile, formState.businessFile])

  // 점포 이미지 파일 목록 (기존 파일들 + 새 파일들)
  const storeImageFiles = useMemo<FileItem[]>(() => {
    const files: FileItem[] = []
    // 기존 파일들
    existingStoreImages.forEach((file) => {
      files.push({
        id: file.id,
        name: file.originalFileName,
      })
    })
    // 새 파일들
    formState.storeImages.forEach((file: File) => {
      files.push({
        name: file.name,
        file,
      })
    })
    return files
  }, [existingStoreImages, formState.storeImages])

  // 사업자등록증 파일 추가 핸들러
  const handleBusinessFileAdd = (files: File[]) => {
    if (files.length > 0) {
      onBusinessFilesSelect(files)
    }
  }

  // 사업자등록증 파일 삭제 핸들러
  const handleBusinessFileRemove = (index: number) => {
    const file = businessFiles[index]
    if (file.id !== undefined) {
      // 기존 파일
      onRemoveExistingBusinessFile(file.id as number)
    } else {
      // 새 파일
      onRemoveBusinessFile()
    }
  }

  // 사업자등록증 파일 클릭 핸들러 (다운로드)
  const handleBusinessFileClick = (file: FileItem) => {
    if (file.file) {
      // 새 파일: 브라우저에서 다운로드
      const url = URL.createObjectURL(file.file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    } else if (file.id !== undefined && existingBusinessFile) {
      // 기존 파일: 서버에서 다운로드
      onBusinessFileDownload(existingBusinessFile)
    }
  }

  // 점포 이미지 파일 추가 핸들러
  const handleStoreImageAdd = (files: File[]) => {
    if (files.length > 0) {
      onStoreImagesSelect(files)
    }
  }

  // 점포 이미지 파일 삭제 핸들러
  const handleStoreImageRemove = (index: number) => {
    const existingCount = existingStoreImages.length
    if (index < existingCount) {
      // 기존 파일
      const file = existingStoreImages[index]
      onToggleDeleteImage(file.id)
    } else {
      // 새 파일
      const newFileIndex = index - existingCount
      onRemoveNewImage(newFileIndex)
    }
  }

  // 점포 이미지 파일 클릭 핸들러 (다운로드)
  const handleStoreImageClick = (file: FileItem, index: number) => {
    const existingCount = existingStoreImages.length
    if (file.file) {
      // 새 파일: 브라우저에서 다운로드
      const url = URL.createObjectURL(file.file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    } else if (index < existingCount) {
      // 기존 파일: 서버에서 다운로드
      const existingFile = existingStoreImages[index]
      onExistingFileDownload(existingFile)
    }
  }

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
                  <RadioButtonGroup
                    className="filed-check-flx"
                    name="storeOwner"
                    options={storeOwnerOptions}
                    value={formState.storeOwner}
                    onChange={(nextValue) => onStoreOwnerChange(nextValue)}
                    disabled={isOwnerFixed}
                  />
                </td>
              </tr>
              <tr>
                <th>본사/가맹점 선택</th>
                <td>
                  <div className="data-filed store-basic-row">
                    <SearchSelect
                      className="store-select-fixed"
                      value={formState.officeId !== null ? officeOptions.find((opt) => opt.value === String(formState.officeId)) || null : null}
                      options={officeOptions}
                      placeholder="본사 선택"
                      isDisabled={bpLoading || isOfficeFixed}
                      isSearchable={false}
                      isClearable={false}
                      onChange={(option) => onOfficeChange(option ? Number(option.value) : null)}
                    />
                    {formState.storeOwner === 'FRANCHISE' && (
                      <SearchSelect
                        className="store-select-fixed"
                        value={formState.franchiseId !== null ? franchiseSelectOptions.find((opt) => opt.value === String(formState.franchiseId)) || null : null}
                        options={franchiseSelectOptions}
                        placeholder="가맹점 선택"
                        isDisabled={bpLoading || isFranchiseFixed}
                        isSearchable={false}
                        isClearable={false}
                        onChange={(option) => onFranchiseChange(option ? Number(option.value) : null)}
                      />
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
                <th>점포명 <span className="red">*</span></th>
                <td>
                  <div className="filed-check-flx">
                    <Input
                      className="input-grow store-name-input"
                      value={formState.storeName}
                      onChange={(event) => onStoreNameChange(event.target.value)}
                      readOnly={!formState.organizationId}
                      error={!!fieldErrors.storeName}
                      helpText={fieldErrors.storeName}
                    />
                    {isEditMode && (
                      <Input
                        className="input-grow store-name-input"
                        value={formState.storeCode}
                        readOnly
                      />
                    )}
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
                </td>
              </tr>
              <tr>
                <th>운영 여부 <span className="red">*</span></th>
                <td>
                  <div className="filed-check-flx">
                    <RadioButtonGroup
                      name="operationStatus"
                      options={operationStatusOptions}
                      value={formState.operationStatus}
                      onChange={(nextValue) => onOperationStatusChange(nextValue)}
                    />
                    {formState.operationStatusEditedDate && (
                      <span className="form-helper">운영여부 변경일 : {formState.operationStatusEditedDate}</span>
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
                  <FileUpload
                    files={businessFiles}
                    onAdd={handleBusinessFileAdd}
                    onRemove={handleBusinessFileRemove}
                    onFileClick={handleBusinessFileClick}
                    error={!!fieldErrors.businessFile}
                    helpText={fieldErrors.businessFile}
                  />
                </td>
              </tr>
              <tr>
                <th>대표자 <span className="red">*</span></th>
                <td>
                  <Input
                    value={formState.ceoName}
                    onChange={(event) => onCeoNameChange(event.target.value)}
                    error={!!fieldErrors.ceoName}
                    helpText={fieldErrors.ceoName}
                  />
                </td>
              </tr>
              <tr>
                <th>사업자등록번호 <span className="red">*</span></th>
                <td>
                  <div className="filed-check-flx input-inline-help">
                    <Input
                      value={formatBusinessNumberInput(formState.businessNumber)}
                      onChange={(event) => onBusinessNumberChange(event.target.value)}
                      inputMode="numeric"
                      maxLength={12}
                      error={!!fieldErrors.businessNumber}
                      helpText={fieldErrors.businessNumber}
                    />
                    <span className="form-helper input-helper-inline">※ 숫자만 입력 가능</span>
                  </div>
                </td>
              </tr>
              <tr>
                <th>점포 주소 <span className="red">*</span></th>
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
                <th>대표자 핸드폰 번호 <span className="red">*</span></th>
                <td>
                  <div className="filed-check-flx input-inline-help">
                    <Input
                      value={formatPhoneNumberInput(formState.ceoPhone)}
                      onChange={(event) => onCeoPhoneChange(event.target.value)}
                      inputMode="numeric"
                      maxLength={13}
                      error={!!fieldErrors.ceoPhone}
                      helpText={fieldErrors.ceoPhone}
                    />
                    <span className="form-helper input-helper-inline">※ 숫자만 입력 가능</span>
                  </div>
                </td>
              </tr>
              <tr>
                <th>점포 전화번호</th>
                <td>
                  <div className="filed-check-flx input-inline-help">
                    <Input
                      className="input-grow"
                      value={formatPhoneNumberInput(formState.storePhone)}
                      onChange={(event) => onStorePhoneChange(event.target.value)}
                      inputMode="numeric"
                      maxLength={13}
                      error={!!fieldErrors.storePhone}
                      helpText={fieldErrors.storePhone}
                    />
                    <span className="form-helper input-helper-inline">※ 숫자만 입력 가능</span>
                  </div>
                </td>
              </tr>
              <tr>
                <th>점포 이미지</th>
                <td>
                  <FileUpload
                    files={storeImageFiles}
                    onAdd={handleStoreImageAdd}
                    onRemove={handleStoreImageRemove}
                    onFileClick={handleStoreImageClick}
                    multiple
                    error={!!fieldErrors.storeImages}
                    helpText={fieldErrors.storeImages}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AnimateHeight>
    </div>
  )
}
