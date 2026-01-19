import type { ChangeEvent, RefObject } from 'react'
import AnimateHeight from 'react-animate-height'
import { Tooltip } from 'react-tooltip'
import type { BpHeadOfficeNode, BpFranchiseNode } from '@/hooks/useBp'
import type { FieldErrors, StoreFormState } from '@/types/store'
import { UploadFile } from '@/types/upload-files'

// 점포 기본 정보 섹션 UI 전용 props
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
  addressDetailRef: RefObject<HTMLInputElement | null>
  existingBusinessFile?: UploadFile
  existingStoreImages: UploadFile[]
  businessFilePreview: string | null
  storeImagePreviews: { file: File; url: string }[]
  // UI 토글/입력 변경 핸들러들
  onToggleOpen: () => void
  onStoreOwnerChange: (owner: StoreFormState['storeOwner']) => void
  onOfficeChange: (nextOfficeId: string) => void
  onFranchiseChange: (nextFranchiseId: string) => void
  onStoreNameChange: (value: string) => void
  onOperationStatusChange: (value: StoreFormState['operationStatus']) => void
  onSameAsOwnerChange: (checked: boolean) => void
  onBusinessFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRemoveBusinessFile: () => void
  onCeoNameChange: (value: string) => void
  onBusinessNumberChange: (value: string) => void
  onStoreAddressDetailChange: (value: string) => void
  onCeoPhoneChange: (value: string) => void
  onStorePhoneChange: (value: string) => void
  onStoreImagesChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRemoveNewImage: (index: number) => void
  onToggleDeleteImage: (fileId: number) => void
  onAddressSearch: () => void
  getFileUrl: (file: UploadFile) => string
}

// 점포 기본 정보(소유/조직/사업자/주소/파일) 입력 섹션
export const StoreDetailBasicInfo = ({
  isOpen,
  isEditMode,
  formState,
  fieldErrors,
  bpTree,
  bpLoading,
  franchiseOptions,
  addressDetailRef,
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
  onBusinessFileChange,
  onRemoveBusinessFile,
  onCeoNameChange,
  onBusinessNumberChange,
  onStoreAddressDetailChange,
  onCeoPhoneChange,
  onStorePhoneChange,
  onStoreImagesChange,
  onRemoveNewImage,
  onToggleDeleteImage,
  onAddressSearch,
  getFileUrl,
}: StoreDetailBasicInfoProps) => (
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
              <th>본사/가맹점 선택 *</th>
              <td>
                <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    className="select-form"
                    value={formState.officeId}
                    onChange={(event) => onOfficeChange(event.target.value)}
                    style={{ width: '300px', flexShrink: 0 }}
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
                      className="select-form"
                      style={{ width: '300px', flexShrink: 0 }}
                      value={formState.franchiseId}
                      onChange={(event) => onFranchiseChange(event.target.value)}
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
                  <button className="tooltip-btn" style={{ flexShrink: 0 }}>
                    <span className="tooltip-icon" id="tooltip-btn-anchor"></span>
                    <Tooltip className="tooltip-txt" anchorSelect="#tooltip-btn-anchor">
                      <div>드롭다운 박스에 선택하고자 하는 가맹점 정보가 없는 경우 가맹점 정보를 먼저 등록해 주세요.</div>
                      <div>가맹점은 WHALE ERP와 별도로 ERP 사용에 대한 계약이 체결되어야 합니다.</div>
                    </Tooltip>
                  </button>
                </div>
                {fieldErrors.organizationId && (
                  <div className="form-helper error">{fieldErrors.organizationId}</div>
                )}
              </td>
            </tr>
            <tr>
              <th>점포명 *</th>
              <td>
                <div className="filed-check-flx">
                  <input
                    type="text"
                    className="input-frame"
                    value={formState.storeName}
                    onChange={(event) => onStoreNameChange(event.target.value)}
                  />
                  {isEditMode && <input type="text" className="input-frame" value={formState.storeCode} readOnly />}
                  <div className="toggle-wrap">
                    <label className="toggle-btn" htmlFor="same-as-owner">
                      <input
                        type="checkbox"
                        id="same-as-owner"
                        checked={formState.sameAsOwner}
                        onChange={(event) => onSameAsOwnerChange(event.target.checked)}
                      />
                      <span className="slider" />
                    </label>
                    <span className="toggle-txt">사업자 정보와 동일</span>
                  </div>
                </div>
                {fieldErrors.storeName && <div className="form-helper error">{fieldErrors.storeName}</div>}
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
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', color: '#aaa' }}>
                    ※ 사업자등록증 등록 시 대표자, 사업자등록번호, 점포주소가 자동 입력됩니다.
                  </span>
                </div>
                <div className="file-bx">
                  <div className="file-guide">Drag & Drop으로 파일을 옮겨주세요.</div>
                  <input type="file" onChange={onBusinessFileChange} />
                  <ul className="file-list">
                    {existingBusinessFile && (
                      <li className="file-item">
                        <div className="file-item-wrap">
                          {getFileUrl(existingBusinessFile) ? (
                            <a
                              className="file-name"
                              href={getFileUrl(existingBusinessFile)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {existingBusinessFile.originalFileName}
                            </a>
                          ) : (
                            <span className="file-name">{existingBusinessFile.originalFileName}</span>
                          )}
                        </div>
                      </li>
                    )}
                    {formState.businessFile && (
                      <li className="file-item">
                        <div className="file-item-wrap">
                          {businessFilePreview ? (
                            <a className="file-name" href={businessFilePreview} target="_blank" rel="noopener noreferrer">
                              {formState.businessFile.name}
                            </a>
                          ) : (
                            <span className="file-name">{formState.businessFile.name}</span>
                          )}
                          <button className="file-delete" type="button" onClick={onRemoveBusinessFile}></button>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
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
                  disabled={formState.sameAsOwner}
                />
                {fieldErrors.ceoName && <div className="form-helper error">{fieldErrors.ceoName}</div>}
              </td>
            </tr>
            <tr>
              <th>사업자등록번호 *</th>
              <td>
                <input
                  type="text"
                  className="input-frame"
                  value={formState.businessNumber}
                  onChange={(event) => onBusinessNumberChange(event.target.value)}
                  inputMode="numeric"
                  disabled={formState.sameAsOwner}
                />
                {fieldErrors.businessNumber && <div className="form-helper error">{fieldErrors.businessNumber}</div>}
              </td>
            </tr>
            <tr>
              <th>점포 주소 *</th>
              <td>
                <div className="filed-flx g8" style={{ alignItems: 'center' }}>
                  <button className="btn-form gray" type="button" onClick={onAddressSearch}>
                    주소찾기
                  </button>
                  <input
                    type="text"
                    className="input-frame"
                    value={formState.storeAddress}
                    readOnly
                    placeholder="주소를 선택하세요"
                  />
                  <input
                    type="text"
                    className="input-frame"
                    value={formState.storeAddressDetail}
                    onChange={(event) => onStoreAddressDetailChange(event.target.value)}
                    ref={addressDetailRef}
                    placeholder="상세 주소"
                  />
                </div>
                {fieldErrors.storeAddress && <div className="form-helper error">{fieldErrors.storeAddress}</div>}
              </td>
            </tr>
            <tr>
              <th>대표자 핸드폰 번호 *</th>
              <td>
                <input
                  type="text"
                  className="input-frame"
                  value={formState.ceoPhone}
                  onChange={(event) => onCeoPhoneChange(event.target.value)}
                  inputMode="numeric"
                  disabled={formState.sameAsOwner}
                />
                {fieldErrors.ceoPhone && <div className="form-helper error">{fieldErrors.ceoPhone}</div>}
              </td>
            </tr>
            <tr>
              <th>점포 전화번호</th>
              <td>
                <input
                  type="text"
                  className="input-frame"
                  value={formState.storePhone}
                  onChange={(event) => onStorePhoneChange(event.target.value)}
                  inputMode="numeric"
                  disabled={formState.sameAsOwner}
                />
              </td>
            </tr>
            <tr>
              <th>점포 이미지</th>
              <td>
                <div className="file-bx">
                  <div className="file-guide">Drag & Drop으로 파일을 옮겨주세요.</div>
                  <input type="file" multiple onChange={onStoreImagesChange} />
                  <ul className="file-list">
                    {existingStoreImages.map((file) => (
                      <li key={file.id} className="file-item">
                        <div className="file-item-wrap">
                          {getFileUrl(file) ? (
                            <a className="file-name" href={getFileUrl(file)} target="_blank" rel="noopener noreferrer">
                              {file.originalFileName}
                            </a>
                          ) : (
                            <span className="file-name">{file.originalFileName}</span>
                          )}
                          <button className="file-delete" type="button" onClick={() => onToggleDeleteImage(file.id)}></button>
                        </div>
                      </li>
                    ))}
                    {storeImagePreviews.map(({ file, url }, index) => (
                      <li key={`${file.name}-${index}`} className="file-item">
                        <div className="file-item-wrap">
                          <a className="file-name" href={url} target="_blank" rel="noopener noreferrer">
                            {file.name}
                          </a>
                          <button className="file-delete" type="button" onClick={() => onRemoveNewImage(index)}></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AnimateHeight>
  </div>
)
