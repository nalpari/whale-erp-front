'use client'

import '@/components/common/custom-css/FormHelper.css'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import { useAlert } from '@/components/common/ui'
import DatePicker from '@/components/ui/common/DatePicker'
import { useHolidayOwner, useCreateHoliday, useUpdateHoliday, useDeleteHoliday, useStoreOptions, holidayKeys } from '@/hooks/queries'
import { useQueryClient } from '@tanstack/react-query'
import type {
  HolidayResponse,
  HolidayResponseInfo,
  HolidayInfoRequest,
  HolidayOwnType,
  ApplyChildType,
  ParentHolidayOperatingSetting,
} from '@/types/holiday'

const BREADCRUMBS = ['Home', '시스템 관리', '휴일 관리', '휴일 상세']

const APPLY_CHILD_OPTIONS: { value: ApplyChildType; label: string }[] = [
  { value: 'HEAD_OFFICE', label: '본사' },
  { value: 'ALL_HEAD_OFFICE_STORES', label: '전체 본사 점포' },
  { value: 'ALL_FRANCHISE_STORES', label: '전체 가맹점 점포' },
]

const BADGE_CONFIG: Record<string, { className: string; label: string }> = {
  LEGAL: { className: 'r', label: '공휴일' },
  HEAD_OFFICE: { className: 'p', label: '본사 휴일' },
  FRANCHISE: { className: 'p', label: '가맹점 휴일' },
  STORE: { className: 'g', label: '점포 휴일' },
}

interface EditableHolidayRow {
  tempId: string
  holidayId?: number
  holidayName: string
  isOperating: boolean
  hasPeriod: boolean
  startDate: string
  endDate: string
  applyChildTypes: ApplyChildType[]
  holidayType?: HolidayOwnType
  isInherited: boolean
}

function toDateString(date: Date | null): string {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDate(str: string): Date | null {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

let tempIdCounter = 0
function generateTempId(): string {
  return `temp-${++tempIdCounter}`
}

function infoToRow(info: HolidayResponseInfo, ownerType: HolidayOwnType): EditableHolidayRow {
  return {
    tempId: generateTempId(),
    holidayId: info.id,
    holidayName: info.holidayName,
    isOperating: info.isOperating,
    hasPeriod: info.hasPeriod,
    startDate: info.startDate,
    endDate: info.endDate ?? '',
    applyChildTypes: info.applyChildTypes ?? [],
    holidayType: info.holidayType,
    isInherited: info.holidayType !== ownerType,
  }
}

function buildInitialParentSettings(data: HolidayResponse): ParentHolidayOperatingSetting[] {
  if (data.holidayOwnType !== 'STORE') return []
  return data.infos
    .filter((info) => info.holidayType !== 'STORE')
    .map((info) => ({
      holidaySourceType: info.holidayType === 'LEGAL' ? 'LEGAL' as const : 'BRANCH' as const,
      holidaySourceId: info.id,
      isOperating: info.isOperating,
    }))
}

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

export default function HolidayDetail() {
  const searchParams = useSearchParams()
  const year = Number(searchParams.get('year')) || currentYear
  const headOfficeId = searchParams.get('headOfficeId') ? Number(searchParams.get('headOfficeId')) : undefined
  const franchiseId = searchParams.get('franchiseId') ? Number(searchParams.get('franchiseId')) : undefined
  const storeId = searchParams.get('storeId') ? Number(searchParams.get('storeId')) : undefined
  const orgId = franchiseId ?? headOfficeId
  const hasOwner = !!orgId || !!storeId

  const { data: holidayData, isPending: loading } = useHolidayOwner(
    { year, orgId, storeId },
    hasOwner
  )

  return (
    <div className="data-wrap">
      <Location title="휴일 관리" list={BREADCRUMBS} />
      {loading ? (
        <div className="p-4">데이터를 불러오는 중...</div>
      ) : (
        <HolidayDetailForm
          key={`${year}-${orgId}-${storeId}`}
          year={year}
          headOfficeId={headOfficeId}
          franchiseId={franchiseId}
          storeId={storeId}
          holidayData={holidayData ?? null}
        />
      )}
    </div>
  )
}

function HolidayDetailForm({
  year,
  headOfficeId,
  franchiseId,
  storeId,
  holidayData,
}: {
  year: number
  headOfficeId?: number
  franchiseId?: number
  storeId?: number
  holidayData: HolidayResponse | null
}) {
  const orgId = franchiseId ?? headOfficeId
  const router = useRouter()
  const baseId = useId()
  const queryClient = useQueryClient()
  const { alert, confirm } = useAlert()

  const { mutateAsync: createHoliday, isPending: creating } = useCreateHoliday()
  const { mutateAsync: updateHoliday, isPending: updating } = useUpdateHoliday()
  const { mutateAsync: deleteHoliday, isPending: deleting } = useDeleteHoliday()

  const ownerType: HolidayOwnType = holidayData?.holidayOwnType ?? (storeId ? 'STORE' : 'HEAD_OFFICE')
  const ownerName = holidayData?.ownerName ?? ''
  const isStore = ownerType === 'STORE'

  const handleYearChange = useCallback((newYear: number) => {
    const params = new URLSearchParams()
    params.set('year', String(newYear))
    if (headOfficeId) params.set('headOfficeId', String(headOfficeId))
    if (franchiseId) params.set('franchiseId', String(franchiseId))
    if (storeId) params.set('storeId', String(storeId))
    router.replace(`/system/holiday/detail?${params.toString()}`)
  }, [headOfficeId, franchiseId, storeId, router])
  const [rows, setRows] = useState<EditableHolidayRow[]>(() =>
    holidayData ? holidayData.infos.map((info) => infoToRow(info, holidayData.holidayOwnType)) : []
  )
  const [parentSettings, setParentSettings] = useState<ParentHolidayOperatingSetting[]>(() =>
    holidayData ? buildInitialParentSettings(holidayData) : []
  )
  const [holidayEnabled, setHolidayEnabled] = useState(false)

  const ownRows = useMemo(() => rows.filter((r) => !r.isInherited), [rows])

  // 토글 ON → ownerType만 표시, OFF → 전체(상속 포함) 표시
  const sectionRows = useMemo(
    () => {
      const filtered = holidayEnabled ? ownRows : rows
      return [...filtered].sort((a, b) => a.startDate.localeCompare(b.startDate))
    },
    [holidayEnabled, ownRows, rows]
  )

  const handleAddRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        tempId: generateTempId(),
        holidayName: '',
        isOperating: false,
        hasPeriod: false,
        startDate: '',
        endDate: '',
        applyChildTypes: [],
        isInherited: false,
      },
    ])
  }, [])

  const handleRemoveRow = useCallback((tempId: string) => {
    setRows((prev) => prev.filter((r) => r.tempId !== tempId))
  }, [])

  const handleRowChange = useCallback(
    (tempId: string, field: keyof EditableHolidayRow, value: unknown) => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.tempId !== tempId) return r
          const updated = { ...r, [field]: value }
          if (field === 'hasPeriod' && !value) {
            updated.endDate = ''
          }
          return updated
        })
      )
    },
    []
  )

  const handleParentOperatingChange = useCallback(
    (holidayId: number, holidayType: HolidayOwnType, isOperating: boolean) => {
      const sourceType: ParentHolidayOperatingSetting['holidaySourceType'] =
        holidayType === 'LEGAL' ? 'LEGAL' : 'BRANCH'

      setParentSettings((prev) => {
        const existing = prev.find(
          (s) => s.holidaySourceId === holidayId && s.holidaySourceType === sourceType
        )
        if (existing) {
          return prev.map((s) =>
            s.holidaySourceId === holidayId && s.holidaySourceType === sourceType
              ? { ...s, isOperating }
              : s
          )
        }
        return [...prev, { holidaySourceType: sourceType, holidaySourceId: holidayId, isOperating }]
      })

      setRows((prev) =>
        prev.map((r) => {
          if (r.isInherited && r.holidayId === holidayId && r.holidayType === holidayType) {
            return { ...r, isOperating }
          }
          return r
        })
      )
    },
    []
  )

  const validateRows = (): string | null => {
    for (let i = 0; i < ownRows.length; i++) {
      const row = ownRows[i]
      if (!row.holidayName.trim()) {
        return `${i + 1}번째 행의 휴일명을 입력해주세요.`
      }
      if (!row.startDate) {
        return `${i + 1}번째 행의 날짜를 입력해주세요.`
      }
      if (row.hasPeriod && !row.endDate) {
        return `${i + 1}번째 행의 종료일을 입력해주세요.`
      }
    }
    return null
  }

  const handleSave = async () => {
    const validationError = validateRows()
    if (validationError) {
      await alert(validationError)
      return
    }

    const ownerId = storeId ?? orgId
    if (!ownerId) return

    const holidayInfos: HolidayInfoRequest[] = ownRows.map((r) => ({
      holidayId: r.holidayId,
      holidayName: r.holidayName,
      isOperating: r.isOperating,
      hasPeriod: r.hasPeriod,
      startDate: r.startDate,
      endDate: r.hasPeriod ? r.endDate || undefined : undefined,
      applyChildTypes: !isStore && r.applyChildTypes.length > 0 ? r.applyChildTypes : undefined,
    }))

    const payload = {
      ownerType,
      ownerId,
      holidayInfos,
      parentHolidaySettings: isStore && parentSettings.length > 0 ? parentSettings : undefined,
    }

    const isUpdate = ownRows.some((r) => r.holidayId)

    if (isUpdate) {
      await updateHoliday(payload)
    } else {
      await createHoliday({ year, payload })
    }

    await queryClient.invalidateQueries({ queryKey: holidayKeys.all })
    await alert('저장되었습니다.')
    router.push('/system/holiday')
  }

  const handleDelete = async (row: EditableHolidayRow) => {
    if (!row.holidayId) {
      handleRemoveRow(row.tempId)
      return
    }

    const confirmed = await confirm('삭제하시겠습니까?')
    if (!confirmed) return

    await deleteHoliday({ type: row.holidayType ?? ownerType, id: row.holidayId })
    handleRemoveRow(row.tempId)
  }

  const handleListClick = async () => {
    const confirmed = await confirm('변경 사항이 저장되지 않았습니다. 목록으로 이동하시겠습니까?')
    if (!confirmed) return

    const params = new URLSearchParams()
    params.set('year', String(year))
    if (orgId) params.set('orgId', String(orgId))
    if (storeId) params.set('storeId', String(storeId))
    router.push(`/system/holiday?${params.toString()}`)
  }

  const isSaving = creating || updating || deleting

  const sectionTitle = isStore ? ownerName : `${ownerName} 휴일`
  const toggleLabel = isStore ? '점포 휴일' : '본사휴일'

  return (
    <div className="contents-wrap">
      <div className="contents-body">
        {/* 상단: 연도 선택 + 버튼 */}
        <div className="content-wrap">
          <div className="flx-bx mb10">
            <div className="mx-160">
              <select
                className="select-form"
                value={year}
                onChange={(e) => handleYearChange(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="auto-right g8">
              <button
                className="btn-form gray"
                type="button"
                onClick={handleListClick}
              >
                목록
              </button>
              <button
                className="btn-form basic"
                type="button"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
          {/* 본사/점포 정보 */}
          <table className="default-table">
            <colgroup>
              <col width="140px" />
              <col />
              {holidayData?.franchiseName && (
                <>
                  <col width="140px" />
                  <col />
                </>
              )}
            </colgroup>
            <tbody>
              <tr>
                <th>본사</th>
                <td>
                  <div className="block">
                    <input
                      type="text"
                      className="input-frame"
                      readOnly
                      value={holidayData?.headOfficeName ?? ownerName}
                    />
                  </div>
                </td>
                {holidayData?.franchiseName && (
                  <>
                    <th>가맹점</th>
                    <td>
                      <div className="block">
                        <input
                          type="text"
                          className="input-frame"
                          readOnly
                          value={holidayData.franchiseName}
                        />
                      </div>
                    </td>
                  </>
                )}
              </tr>
              <tr>
                <th>점포 선택</th>
                <td>
                  <div className="block">
                    <StoreSelect
                      headOfficeId={headOfficeId}
                      franchiseId={franchiseId}
                      storeId={storeId}
                      onStoreChange={(selectedStoreId) => {
                        const params = new URLSearchParams()
                        params.set('year', String(year))
                        if (headOfficeId) params.set('headOfficeId', String(headOfficeId))
                        if (franchiseId) params.set('franchiseId', String(franchiseId))
                        if (selectedStoreId) {
                          params.set('storeId', String(selectedStoreId))
                        }
                        router.replace(`/system/holiday/detail?${params.toString()}`)
                      }}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 휴일 섹션: 점포 미선택 시 본사 휴일, 점포 선택 시 점포 휴일 */}
        <div className="content-wrap">
          <div className="day-off-header">
            <div className="day-off-header-tit">{sectionTitle}</div>
            <div className="auto-right">
              <ToggleSwitch
                id={`${baseId}-own-toggle`}
                label={toggleLabel}
                checked={holidayEnabled}
                onChange={setHolidayEnabled}
              />
              <button
                className="btn-form outline add"
                type="button"
                onClick={handleAddRow}
              ></button>
            </div>
          </div>
          <div className="day-off-list">
            <table className="day-off-table">
              <colgroup>
                <col width="18%" />
                <col width="90px" />
                <col width="32%" />
                <col width="90px" />
                <col />
                <col width="42px" />
              </colgroup>
              <tbody>
                {sectionRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px 0' }}>
                      등록된 휴일이 없습니다.
                    </td>
                  </tr>
                ) : (
                  sectionRows.map((row) => {
                    const isReadOnly = row.holidayType !== ownerType && !!row.holidayType
                    const badge = BADGE_CONFIG[row.holidayType ?? ownerType]
                    return (
                      <tr key={row.tempId}>
                        {/* 휴일명 */}
                        <td>
                          <div className="block">
                            <input
                              type="text"
                              className="input-frame"
                              value={row.holidayName}
                              placeholder="휴일명"
                              readOnly={isReadOnly}
                              onChange={
                                isReadOnly
                                  ? undefined
                                  : (e) => handleRowChange(row.tempId, 'holidayName', e.target.value)
                              }
                            />
                          </div>
                        </td>
                        {/* 기간 토글 */}
                        <td>
                          {isReadOnly ? null : (
                            <ToggleSwitch
                              id={`${baseId}-period-${row.tempId}`}
                              label="기간"
                              checked={row.hasPeriod}
                              onChange={(checked) =>
                                handleRowChange(row.tempId, 'hasPeriod', checked)
                              }
                            />
                          )}
                        </td>
                        {/* 날짜 */}
                        <td>
                          {row.hasPeriod ? (
                            <div className="date-picker-wrap">
                              <DatePicker
                                value={parseDate(row.startDate)}
                                onChange={
                                  isReadOnly
                                    ? undefined
                                    : (date) => handleRowChange(row.tempId, 'startDate', toDateString(date))
                                }
                                placeholder="시작일"
                              />
                              <span>~</span>
                              <DatePicker
                                value={parseDate(row.endDate)}
                                onChange={
                                  isReadOnly
                                    ? undefined
                                    : (date) => handleRowChange(row.tempId, 'endDate', toDateString(date))
                                }
                                placeholder="종료일"
                              />
                            </div>
                          ) : (
                            <div className="mx-300">
                              <DatePicker
                                value={parseDate(row.startDate)}
                                onChange={
                                  isReadOnly
                                    ? undefined
                                    : (date) => handleRowChange(row.tempId, 'startDate', toDateString(date))
                                }
                                placeholder="날짜"
                              />
                            </div>
                          )}
                        </td>
                        {/* 영업 토글 + 뱃지 or 하위 적용 버튼 */}
                        {isReadOnly ? (
                          <>
                            <td>
                              <ToggleSwitch
                                id={`${baseId}-op-${row.tempId}`}
                                label="영업"
                                checked={row.isOperating}
                                onChange={(checked) => {
                                  if (row.isInherited && row.holidayId && row.holidayType) {
                                    handleParentOperatingChange(row.holidayId, row.holidayType, checked)
                                  } else {
                                    handleRowChange(row.tempId, 'isOperating', checked)
                                  }
                                }}
                              />
                            </td>
                            <td>
                              {badge && (
                                <div className={`day-off-badge ${badge.className}`}>
                                  <i className="do-circle"></i>
                                  <span className="do-txt">{badge.label}</span>
                                </div>
                              )}
                            </td>
                          </>
                        ) : !isStore ? (
                          <td colSpan={2}>
                            <div className="filed-flx g8">
                              {APPLY_CHILD_OPTIONS.map((opt) => {
                                const isChecked = row.applyChildTypes.includes(opt.value)
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    className={`btn-form outline s${isChecked ? ' act' : ''}`}
                                    onClick={() => {
                                      const next = isChecked
                                        ? row.applyChildTypes.filter((v) => v !== opt.value)
                                        : [...row.applyChildTypes, opt.value]
                                      handleRowChange(row.tempId, 'applyChildTypes', next)
                                    }}
                                  >
                                    {opt.label}
                                  </button>
                                )
                              })}
                            </div>
                          </td>
                        ) : (
                          <>
                            <td></td>
                            <td>
                              {badge && (
                                <div className={`day-off-badge ${badge.className}`}>
                                  <i className="do-circle"></i>
                                  <span className="do-txt">{badge.label}</span>
                                </div>
                              )}
                            </td>
                          </>
                        )}
                        {/* 삭제 버튼 */}
                        <td>
                          {!isReadOnly && (
                            <button
                              className="btn-form outline minus"
                              type="button"
                              onClick={() => handleDelete(row)}
                            ></button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StoreSelect({
  headOfficeId,
  franchiseId,
  storeId,
  onStoreChange,
}: {
  headOfficeId?: number
  franchiseId?: number
  storeId?: number
  onStoreChange: (storeId: number | null) => void
}) {
  const { data: storeOptions = [] } = useStoreOptions(headOfficeId, franchiseId, true)
  const isSingleStore = !!franchiseId && storeOptions.length === 1

  // 가맹점 소속 점포가 1개인 경우 자동 선택
  useEffect(() => {
    if (isSingleStore && storeId == null && storeOptions[0]?.id != null) {
      onStoreChange(storeOptions[0].id)
    }
  }, [isSingleStore, storeId, storeOptions, onStoreChange])

  return (
    <select
      className="select-form"
      value={storeId != null ? String(storeId) : (isSingleStore && storeOptions[0]?.id != null ? String(storeOptions[0].id) : '')}
      disabled={isSingleStore}
      onChange={(e) => {
        const val = e.target.value
        onStoreChange(val ? Number(val) : null)
      }}
    >
      <option value="">전체</option>
      {storeOptions.map((s) => (
        <option key={s.id} value={String(s.id)}>
          {s.storeName}
        </option>
      ))}
    </select>
  )
}

function ToggleSwitch({
  id,
  label,
  checked,
  onChange,
  readOnly,
}: {
  id: string
  label: string
  checked: boolean
  onChange?: (checked: boolean) => void
  readOnly?: boolean
}) {
  return (
    <div className="toggle-wrap">
      <span className="toggle-txt">{label}</span>
      <div className="toggle-btn">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => {
            if (!readOnly) onChange?.(e.target.checked)
          }}
          readOnly={readOnly}
        />
        <label className="slider" htmlFor={id}></label>
      </div>
    </div>
  )
}
