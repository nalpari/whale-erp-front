'use client'

import '@/components/common/custom-css/FormHelper.css'
import { useCallback, useId, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import { useAlert } from '@/components/common/ui'
import DatePicker from '@/components/ui/common/DatePicker'
import {
  useLegalHolidayList,
  useCreateLegalHoliday,
  useUpsertLegalHoliday,
  useDeleteLegalHoliday,
  holidayKeys,
} from '@/hooks/queries'
import { useQueryClient } from '@tanstack/react-query'
import type { LegalHolidayResponse, LegalHolidayRequest } from '@/types/holiday'

const BREADCRUMBS = ['Home', '시스템 관리', '휴일 관리', '법정공휴일 관리']

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

interface EditableLegalRow {
  tempId: string
  id?: number
  holidayName: string
  hasPeriod: boolean
  startDate: string
  endDate: string
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
  return `legal-temp-${++tempIdCounter}`
}

function responseToRow(item: LegalHolidayResponse): EditableLegalRow {
  return {
    tempId: generateTempId(),
    id: item.id,
    holidayName: item.holidayName,
    hasPeriod: item.hasPeriod,
    startDate: item.startDate,
    endDate: item.endDate ?? '',
  }
}

export default function LegalHolidayDetail() {
  const searchParams = useSearchParams()
  const initialYear = Number(searchParams.get('year')) || currentYear
  const [year, setYear] = useState(initialYear)
  const { data: legalData, isPending: loading } = useLegalHolidayList(year)

  return (
    <div className="data-wrap">
      <Location title="법정공휴일 관리" list={BREADCRUMBS} />
      {loading ? (
        <div className="p-4">데이터를 불러오는 중...</div>
      ) : (
        <LegalHolidayForm
          key={`${year}-${legalData?.length ?? 0}`}
          year={year}
          onYearChange={setYear}
          initialData={legalData ?? []}
        />
      )}
    </div>
  )
}

function LegalHolidayForm({
  year,
  onYearChange,
  initialData,
}: {
  year: number
  onYearChange: (year: number) => void
  initialData: LegalHolidayResponse[]
}) {
  const router = useRouter()
  const baseId = useId()
  const queryClient = useQueryClient()
  const { alert, confirm } = useAlert()

  const { mutateAsync: createLegal, isPending: creating } = useCreateLegalHoliday()
  const { mutateAsync: upsertLegal, isPending: upserting } = useUpsertLegalHoliday()
  const { mutateAsync: deleteLegal, isPending: deleting } = useDeleteLegalHoliday()

  const [rows, setRows] = useState<EditableLegalRow[]>(() =>
    initialData.map(responseToRow)
  )

  const handleAddRow = useCallback(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    setRows((prev) => [
      ...prev,
      {
        tempId: generateTempId(),
        holidayName: '',
        hasPeriod: false,
        startDate: toDateString(today),
        endDate: toDateString(tomorrow),
      },
    ])
  }, [])

  const handleRemoveRow = useCallback((tempId: string) => {
    setRows((prev) => prev.filter((r) => r.tempId !== tempId))
  }, [])

  const handleRowChange = useCallback(
    (tempId: string, field: keyof EditableLegalRow, value: unknown) => {
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

  const validateRows = (): string | null => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row.holidayName.trim()) {
        return `${i + 1}번째 행의 공휴일명을 입력해주세요.`
      }
      if (!row.startDate) {
        return `${i + 1}번째 행의 날짜를 입력해주세요.`
      }
      if (row.hasPeriod && !row.endDate) {
        return `${i + 1}번째 행의 종료일을 입력해주세요.`
      }
      if (row.hasPeriod && row.endDate && row.startDate > row.endDate) {
        return `${i + 1}번째 행의 종료일이 시작일보다 빠릅니다.`
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

    const saveConfirmed = await confirm('저장하시겠습니까?')
    if (!saveConfirmed) return

    const hasExisting = rows.some((r) => r.id)
    const payload: LegalHolidayRequest[] = rows.map((r) => ({
      id: r.id,
      holidayName: r.holidayName,
      hasPeriod: r.hasPeriod,
      startDate: r.startDate,
      endDate: r.hasPeriod ? r.endDate || undefined : undefined,
    }))

    try {
      if (hasExisting) {
        await upsertLegal(payload)
      } else {
        await createLegal({ year, payload, skipDuplicate: true })
      }

      await queryClient.invalidateQueries({ queryKey: holidayKeys.all })
      router.push('/system/holiday')
    } catch (error) {
      const message = error instanceof Error ? error.message : '저장에 실패했습니다.'
      await alert(message)
    }
  }

  const handleDelete = async (row: EditableLegalRow) => {
    if (!row.id) {
      handleRemoveRow(row.tempId)
      return
    }

    const confirmed = await confirm('삭제하시겠습니까?')
    if (!confirmed) return

    await deleteLegal(row.id)
    handleRemoveRow(row.tempId)
  }

  const sortedRows = useMemo(
    () => {
      // 기존 법정공휴일(id 있음)은 startDate로 정렬, 새로 추가한 휴일(id 없음)은 맨 아래 유지
      const existingRows = rows.filter((r) => r.id != null)
      const newRows = rows.filter((r) => r.id == null)
      const sortedExisting = [...existingRows].sort((a, b) => a.startDate.localeCompare(b.startDate))
      return [...sortedExisting, ...newRows]
    },
    [rows]
  )

  const isSaving = creating || upserting || deleting

  const handleListClick = async () => {
    const confirmed = await confirm('입력한 내용을 저장하지 않았습니다. 휴일 관리 목록으로 이동하시겠습니까?')
    if (!confirmed) return

    const params = new URLSearchParams()
    params.set('year', String(year))
    router.push(`/system/holiday?${params.toString()}`)
  }
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
                onChange={(e) => onYearChange(Number(e.target.value))}
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
        </div>

        {/* 법정공휴일 목록 */}
        <div className="content-wrap">
          <div className="day-off-header">
            <div className="day-off-header-tit">법정공휴일</div>
            <div className="auto-right">
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
                <col width="22%" />
                <col width="90px" />
                <col width="38%" />
                <col />
                <col width="42px" />
              </colgroup>
              <tbody>
                {sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px 0' }}>
                      등록된 법정공휴일이 없습니다.
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row) => (
                    <tr key={row.tempId}>
                      {/* 공휴일명 */}
                      <td>
                        <div className="block">
                          <input
                            type="text"
                            className="input-frame"
                            value={row.holidayName}
                            placeholder="공휴일명"
                            onChange={(e) =>
                              handleRowChange(row.tempId, 'holidayName', e.target.value)
                            }
                          />
                        </div>
                      </td>
                      {/* 기간 토글 */}
                      <td>
                        <ToggleSwitch
                          id={`${baseId}-period-${row.tempId}`}
                          label="기간"
                          checked={row.hasPeriod}
                          onChange={(checked) =>
                            handleRowChange(row.tempId, 'hasPeriod', checked)
                          }
                        />
                      </td>
                      {/* 날짜 */}
                      <td>
                        {row.hasPeriod ? (
                          <div className="date-picker-wrap">
                            <DatePicker
                              value={parseDate(row.startDate)}
                              onChange={(date) =>
                                handleRowChange(row.tempId, 'startDate', toDateString(date))
                              }
                              placeholder="시작일"
                            />
                            <span>~</span>
                            <DatePicker
                              value={parseDate(row.endDate)}
                              onChange={(date) =>
                                handleRowChange(row.tempId, 'endDate', toDateString(date))
                              }
                              placeholder="종료일"
                            />
                          </div>
                        ) : (
                          <div className="mx-300">
                            <DatePicker
                              value={parseDate(row.startDate)}
                              onChange={(date) =>
                                handleRowChange(row.tempId, 'startDate', toDateString(date))
                              }
                              placeholder="날짜"
                            />
                          </div>
                        )}
                      </td>
                      {/* 뱃지 */}
                      <td>
                        <div className="day-off-badge r">
                          <i className="do-circle"></i>
                          <span className="do-txt">공휴일</span>
                        </div>
                      </td>
                      {/* 삭제 */}
                      <td>
                        <button
                          className="btn-form outline minus"
                          type="button"
                          onClick={() => handleDelete(row)}
                        ></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleSwitch({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="toggle-wrap">
      <span className="toggle-txt">{label}</span>
      <div className="toggle-btn">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <label className="slider" htmlFor={id}></label>
      </div>
    </div>
  )
}
