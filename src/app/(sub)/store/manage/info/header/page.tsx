'use client'
import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import { useStoreActions, useStoreDetail } from '@/hooks/use-store'
import { OperatingHourInfo, StoreDetailResponse, StoreFileInfo } from '@/types/store'

interface OperatingFormState {
  dayType: OperatingHourInfo['dayType']
  isOperating: boolean
  openTime: string
  closeTime: string
  breakTimeEnabled: boolean
  breakStartTime: string
  breakEndTime: string
}

interface StoreFormState {
  storeOwner: 'HEAD_OFFICE' | 'FRANCHISE'
  organizationId: string
  storeName: string
  storeCode: string
  operationStatus: 'STOPR_001' | 'STOPR_002'
  operationStatusEditedDate: string
  businessNumber: string
  ceoName: string
  ceoPhone: string
  storePhone: string
  storeAddress: string
  storeAddressDetail: string
  sameAsOwner: boolean
  operating: Record<OperatingHourInfo['dayType'], OperatingFormState>
  businessFile: File | null
  storeImages: File[]
  existingFiles: StoreFileInfo[]
  deleteImages: number[]
}

const buildDefaultOperating = (dayType: OperatingHourInfo['dayType']): OperatingFormState => ({
  dayType,
  isOperating: true,
  openTime: '07:00',
  closeTime: '22:00',
  breakTimeEnabled: true,
  breakStartTime: '15:00',
  breakEndTime: '17:00',
})

const buildInitialForm = (): StoreFormState => ({
  storeOwner: 'HEAD_OFFICE',
  organizationId: '',
  storeName: '',
  storeCode: '',
  operationStatus: 'STOPR_001',
  operationStatusEditedDate: '',
  businessNumber: '',
  ceoName: '',
  ceoPhone: '',
  storePhone: '',
  storeAddress: '',
  storeAddressDetail: '',
  sameAsOwner: false,
  operating: {
    WEEKDAY: buildDefaultOperating('WEEKDAY'),
    SATURDAY: buildDefaultOperating('SATURDAY'),
    SUNDAY: buildDefaultOperating('SUNDAY'),
  },
  businessFile: null,
  storeImages: [],
  existingFiles: [],
  deleteImages: [],
})

const isTimeRangeValid = (start: string, end: string) => {
  if (!start || !end) return false
  return start < end
}

const dayTypeLabel = (dayType: OperatingHourInfo['dayType']) => {
  if (dayType === 'WEEKDAY') return '평일'
  if (dayType === 'SATURDAY') return '토요일'
  return '일요일'
}

export default function StoreInfoHeaderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeIdParam = searchParams.get('id')
  const storeId = storeIdParam ? Number(storeIdParam) : null
  const isEditMode = !!storeId

  const { data: detail, loading } = useStoreDetail(storeId)

  const breadcrumbs = useMemo(
    () => ['Home', '가맹점 및 점포 관리', '점포 정보 관리', isEditMode ? '점포 수정' : '점포 등록'],
    [isEditMode]
  )

  return (
    <div className="data-wrap">
      <Location title={isEditMode ? '점포 수정' : '점포 등록'} list={breadcrumbs} />
      {isEditMode && loading && !detail && <div className="data-loading">점포 정보를 불러오는 중...</div>}
      {(!isEditMode || detail) && (
        <StoreHeaderForm
          key={detail?.storeInfo.id ?? (storeId ? `loading-${storeId}` : 'new')}
          detail={detail}
          isEditMode={isEditMode}
          onBack={() => router.push('/store/manage/info')}
          onHoliday={() => router.push('/system/holiday')}
          onAfterSave={(nextId) => router.push(`/store/manage/info/detail?id=${nextId}`)}
        />
      )}
    </div>
  )
}

interface StoreHeaderFormProps {
  detail?: StoreDetailResponse | null
  isEditMode: boolean
  onBack: () => void
  onHoliday: () => void
  onAfterSave: (nextId: number) => void
}

function StoreHeaderForm({ detail, isEditMode, onBack, onHoliday, onAfterSave }: StoreHeaderFormProps) {
  const [formState, setFormState] = useState<StoreFormState>(() =>
    detail ? mapDetailToForm(detail, buildInitialForm()) : buildInitialForm()
  )
  const [errors, setErrors] = useState<string[]>([])

  const { create, update, saving, error: actionError } = useStoreActions()

  const handleOperatingChange = (
    dayType: OperatingHourInfo['dayType'],
    next: Partial<OperatingFormState>
  ) => {
    setFormState((prev) => ({
      ...prev,
      operating: {
        ...prev.operating,
        [dayType]: {
          ...prev.operating[dayType],
          ...next,
        },
      },
    }))
  }

  const handleSubmit = async () => {
    const validationErrors = validateForm(formState)
    setErrors(validationErrors)
    if (validationErrors.length) return

    const payload = buildPayload(formState)
    const files = {
      businessFile: formState.businessFile,
      storeImages: formState.storeImages,
      deleteImages: formState.deleteImages,
    }

    try {
      const data = isEditMode && detail?.storeInfo.id
        ? await update(detail.storeInfo.id, payload, files)
        : await create(payload, files)

      onAfterSave(data.storeInfo.id)
    } catch {
      return
    }
  }

  return (
    <>
      {(errors.length > 0 || actionError) && (
        <div className="form-helper error">
          {actionError && <div>{actionError}</div>}
          {errors.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </div>
      )}
      <div className="detail-wrap">
        <div className="detail-header">
          <div className="detail-title">점포 Header 정보</div>
          <div className="detail-actions">
            <button className="btn-form gray" type="button" onClick={onBack}>
              목록
            </button>
            <button className="btn-form basic" type="button" onClick={handleSubmit} disabled={saving}>
              저장
            </button>
          </div>
        </div>

        <table className="default-table">
          <colgroup>
            <col width="160px" />
            <col />
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
                      onChange={() => setFormState((prev) => ({ ...prev, storeOwner: 'HEAD_OFFICE' }))}
                    />
                    <label htmlFor="owner-office">본사</label>
                  </div>
                  <div className="radio-form-box">
                    <input
                      type="radio"
                      id="owner-franchise"
                      name="storeOwner"
                      checked={formState.storeOwner === 'FRANCHISE'}
                      onChange={() => setFormState((prev) => ({ ...prev, storeOwner: 'FRANCHISE' }))}
                    />
                    <label htmlFor="owner-franchise">가맹점</label>
                  </div>
                </div>
              </td>
              <th>운영여부</th>
              <td>
                <div className="filed-check-flx">
                  <div className="radio-form-box">
                    <input
                      type="radio"
                      id="status-operating"
                      name="operationStatus"
                      checked={formState.operationStatus === 'STOPR_001'}
                      onChange={() =>
                        setFormState((prev) => ({ ...prev, operationStatus: 'STOPR_001' }))
                      }
                    />
                    <label htmlFor="status-operating">운영</label>
                  </div>
                  <div className="radio-form-box">
                    <input
                      type="radio"
                      id="status-stopped"
                      name="operationStatus"
                      checked={formState.operationStatus === 'STOPR_002'}
                      onChange={() =>
                        setFormState((prev) => ({ ...prev, operationStatus: 'STOPR_002' }))
                      }
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
              <th>본사/가맹점 선택 *</th>
              <td>
                <div className="data-filed">
                  <input
                    type="text"
                    className="input-frame"
                    value={formState.organizationId}
                    onChange={(event) => setFormState((prev) => ({ ...prev, organizationId: event.target.value }))}
                    placeholder="조직 ID 입력"
                  />
                </div>
              </td>
              <th>점포 코드</th>
              <td>
                <div className="data-filed">
                  <input type="text" className="input-frame" value={formState.storeCode} readOnly />
                </div>
              </td>
            </tr>
            <tr>
              <th>점포명 *</th>
              <td>
                <div className="data-filed">
                  <input
                    type="text"
                    className="input-frame"
                    value={formState.storeName}
                    onChange={(event) => setFormState((prev) => ({ ...prev, storeName: event.target.value }))}
                  />
                </div>
              </td>
              <th>사업자등록증</th>
              <td>
                <input
                  type="file"
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, businessFile: event.target.files?.[0] ?? null }))
                  }
                />
              </td>
            </tr>
            <tr>
              <th>대표자 *</th>
              <td>
                <input
                  type="text"
                  className="input-frame"
                  value={formState.ceoName}
                  onChange={(event) => setFormState((prev) => ({ ...prev, ceoName: event.target.value }))}
                />
              </td>
              <th>사업자등록번호 *</th>
              <td>
                <input
                  type="text"
                  className="input-frame"
                  value={formState.businessNumber}
                  onChange={(event) => setFormState((prev) => ({ ...prev, businessNumber: event.target.value }))}
                  inputMode="numeric"
                />
              </td>
            </tr>
            <tr>
              <th>점포 주소 *</th>
              <td>
                <input
                  type="text"
                  className="input-frame"
                  value={formState.storeAddress}
                  onChange={(event) => setFormState((prev) => ({ ...prev, storeAddress: event.target.value }))}
                />
              </td>
              <th>상세 주소</th>
              <td>
                <input
                  type="text"
                  className="input-frame"
                  value={formState.storeAddressDetail}
                  onChange={(event) => setFormState((prev) => ({ ...prev, storeAddressDetail: event.target.value }))}
                />
              </td>
            </tr>
            <tr>
              <th>대표자 휴대폰 *</th>
              <td>
                <input
                  type="text"
                  className="input-frame"
                  value={formState.ceoPhone}
                  onChange={(event) => setFormState((prev) => ({ ...prev, ceoPhone: event.target.value }))}
                  inputMode="numeric"
                />
              </td>
              <th>점포 전화번호</th>
              <td>
                <input
                  type="text"
                  className="input-frame"
                  value={formState.storePhone}
                  onChange={(event) => setFormState((prev) => ({ ...prev, storePhone: event.target.value }))}
                  inputMode="numeric"
                />
              </td>
            </tr>
            <tr>
              <th>점포 이미지</th>
              <td colSpan={3}>
                <input
                  type="file"
                  multiple
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      storeImages: event.target.files ? Array.from(event.target.files) : [],
                    }))
                  }
                />
                {formState.existingFiles.length > 0 && (
                  <div className="file-list">
                    {formState.existingFiles.map((file) => (
                      <div key={file.id} className="file-item">
                        <span>{file.originalFileName}</span>
                        <button
                          type="button"
                          className="btn-form outline"
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              deleteImages: prev.deleteImages.includes(file.id)
                                ? prev.deleteImages
                                : [...prev.deleteImages, file.id],
                            }))
                          }
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="detail-section">
          <div className="detail-section-title">점포 운영시간 정보</div>
          <table className="default-table">
            <colgroup>
              <col width="160px" />
              <col />
              <col width="160px" />
              <col />
            </colgroup>
            <tbody>
              {(['WEEKDAY', 'SATURDAY', 'SUNDAY'] as OperatingHourInfo['dayType'][]).map((dayType) => {
                const current = formState.operating[dayType]
                return (
                  <tr key={dayType}>
                    <th>{dayTypeLabel(dayType)}</th>
                    <td>
                      <div className="filed-check-flx">
                        <div className="radio-form-box">
                          <input
                            type="radio"
                            id={`${dayType}-operating`}
                            name={`${dayType}-status`}
                            checked={current.isOperating}
                            onChange={() => handleOperatingChange(dayType, { isOperating: true })}
                          />
                          <label htmlFor={`${dayType}-operating`}>운영</label>
                        </div>
                        <div className="radio-form-box">
                          <input
                            type="radio"
                            id={`${dayType}-stopped`}
                            name={`${dayType}-status`}
                            checked={!current.isOperating}
                            onChange={() => handleOperatingChange(dayType, { isOperating: false })}
                          />
                          <label htmlFor={`${dayType}-stopped`}>미운영</label>
                        </div>
                      </div>
                    </td>
                    <th>운영 시간</th>
                    <td>
                      <div className="time-range">
                        <input
                          type="time"
                          value={current.openTime}
                          onChange={(event) => handleOperatingChange(dayType, { openTime: event.target.value })}
                        />
                        <span>~</span>
                        <input
                          type="time"
                          value={current.closeTime}
                          onChange={(event) => handleOperatingChange(dayType, { closeTime: event.target.value })}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {(['WEEKDAY', 'SATURDAY', 'SUNDAY'] as OperatingHourInfo['dayType'][]).map((dayType) => {
                const current = formState.operating[dayType]
                return (
                  <tr key={`${dayType}-break`}>
                    <th>{dayTypeLabel(dayType)} Break</th>
                    <td>
                      <div className="filed-check-flx">
                        <div className="radio-form-box">
                          <input
                            type="radio"
                            id={`${dayType}-break-on`}
                            name={`${dayType}-break`}
                            checked={current.breakTimeEnabled}
                            onChange={() => handleOperatingChange(dayType, { breakTimeEnabled: true })}
                          />
                          <label htmlFor={`${dayType}-break-on`}>운영</label>
                        </div>
                        <div className="radio-form-box">
                          <input
                            type="radio"
                            id={`${dayType}-break-off`}
                            name={`${dayType}-break`}
                            checked={!current.breakTimeEnabled}
                            onChange={() => handleOperatingChange(dayType, { breakTimeEnabled: false })}
                          />
                          <label htmlFor={`${dayType}-break-off`}>미운영</label>
                        </div>
                      </div>
                    </td>
                    <th>Break 시간</th>
                    <td>
                      <div className="time-range">
                        <input
                          type="time"
                          value={current.breakStartTime}
                          onChange={(event) =>
                            handleOperatingChange(dayType, { breakStartTime: event.target.value })
                          }
                        />
                        <span>~</span>
                        <input
                          type="time"
                          value={current.breakEndTime}
                          onChange={(event) => handleOperatingChange(dayType, { breakEndTime: event.target.value })}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="detail-actions">
            <button className="btn-form outline" type="button" onClick={onHoliday}>
              휴일관리로 이동
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const mapDetailToForm = (detail: StoreDetailResponse, prev: StoreFormState): StoreFormState => {
  const operating = { ...prev.operating }
  detail.operating.forEach((item) => {
    operating[item.dayType] = {
      ...operating[item.dayType],
      isOperating: item.isOperating,
      openTime: item.openTime ?? operating[item.dayType].openTime,
      closeTime: item.closeTime ?? operating[item.dayType].closeTime,
      breakTimeEnabled: item.breakTimeEnabled ?? Boolean(item.breakStartTime && item.breakEndTime),
      breakStartTime: item.breakStartTime ?? operating[item.dayType].breakStartTime,
      breakEndTime: item.breakEndTime ?? operating[item.dayType].breakEndTime,
    }
  })

  return {
    ...prev,
    storeOwner: (detail.storeInfo.storeOwner as StoreFormState['storeOwner']) ?? prev.storeOwner,
    organizationId:
      detail.storeInfo.storeOwner === 'FRANCHISE'
        ? detail.storeInfo.franchiseId
          ? String(detail.storeInfo.franchiseId)
          : prev.organizationId
        : detail.storeInfo.officeId
          ? String(detail.storeInfo.officeId)
          : prev.organizationId,
    storeName: detail.storeInfo.storeName ?? prev.storeName,
    storeCode: detail.storeInfo.storeCode ?? prev.storeCode,
    operationStatus: (detail.storeInfo.operationStatus as StoreFormState['operationStatus']) ?? prev.operationStatus,
    operationStatusEditedDate: detail.storeInfo.statusUpdatedDate ?? prev.operationStatusEditedDate,
    businessNumber: detail.storeInfo.businessNumber ?? prev.businessNumber,
    ceoName: detail.storeInfo.ceoName ?? prev.ceoName,
    ceoPhone: detail.storeInfo.ceoPhone ?? prev.ceoPhone,
    storePhone: detail.storeInfo.storePhone ?? prev.storePhone,
    storeAddress: detail.storeInfo.storeAddress ?? prev.storeAddress,
    storeAddressDetail: detail.storeInfo.storeAddressDetail ?? prev.storeAddressDetail,
    operating,
    existingFiles: detail.files ?? [],
  }
}

const buildPayload = (formState: StoreFormState) => {
  const operatingHours = (Object.values(formState.operating) as OperatingFormState[]).map((item) => ({
    dayType: item.dayType,
    isOperating: item.isOperating,
    openTime: item.isOperating ? item.openTime : null,
    closeTime: item.isOperating ? item.closeTime : null,
    breakTimeEnabled: item.breakTimeEnabled,
    breakStartTime: item.breakTimeEnabled ? item.breakStartTime : null,
    breakEndTime: item.breakTimeEnabled ? item.breakEndTime : null,
  }))

  return {
    storeOwner: formState.storeOwner,
    organizationId: Number(formState.organizationId),
    operationStatus: formState.operationStatus,
    storeName: formState.storeName,
    businessNumber: formState.businessNumber,
    storeAddress: formState.storeAddress,
    storeAddressDetail: formState.storeAddressDetail || null,
    ceoName: formState.ceoName,
    ceoPhone: formState.ceoPhone,
    storePhone: formState.storePhone || null,
    operatingHours,
  }
}

const validateForm = (formState: StoreFormState) => {
  const validationErrors: string[] = []

  if (!formState.organizationId.trim()) validationErrors.push('본사/가맹점 조직 ID를 입력하세요.')
  if (!formState.storeName.trim()) validationErrors.push('점포명을 입력하세요.')
  if (!formState.businessNumber.trim()) validationErrors.push('사업자등록번호를 입력하세요.')
  if (!formState.ceoName.trim()) validationErrors.push('대표자명을 입력하세요.')
  if (!formState.ceoPhone.trim()) validationErrors.push('대표자 휴대폰 번호를 입력하세요.')
  if (!formState.storeAddress.trim()) validationErrors.push('점포 주소를 입력하세요.')

  ;(['WEEKDAY', 'SATURDAY', 'SUNDAY'] as OperatingHourInfo['dayType'][]).forEach((dayType) => {
    const item = formState.operating[dayType]
    if (item.isOperating && !isTimeRangeValid(item.openTime, item.closeTime)) {
      validationErrors.push(`${dayTypeLabel(dayType)} 운영 시간을 확인하세요.`)
    }
    if (item.breakTimeEnabled && !isTimeRangeValid(item.breakStartTime, item.breakEndTime)) {
      validationErrors.push(`${dayTypeLabel(dayType)} Break Time을 확인하세요.`)
    }
  })

  return validationErrors
}
