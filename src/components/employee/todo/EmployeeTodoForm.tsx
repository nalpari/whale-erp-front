'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import Location from '@/components/ui/Location'
import { Input, useAlert } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import DatePicker from '@/components/ui/common/DatePicker'
import RangeDatePicker from '@/components/ui/common/RangeDatePicker'
import CubeLoader from '@/components/common/ui/CubeLoader'
import {
  useBpHeadOfficeTree,
  useStoreOptions,
  useEmployeeTodoDetail,
  useEmployeeTodoSelectList,
  useCreateEmployeeTodo,
  useUpdateEmployeeTodo,
} from '@/hooks/queries'
import { useQueryError } from '@/hooks/useQueryError'
import { formatDateYmd } from '@/util/date-util'
import { useAuthStore } from '@/stores/auth-store'
import { OWNER_CODE } from '@/constants/owner-code'
import type { EmployeeTodoCreateRequest } from '@/types/employee-todo'

const BREADCRUMBS = ['Home', '직원 관리', '직원별 TO-DO 관리']

interface FormState {
  officeId: number | null
  franchiseId: number | null
  storeId: number | null
  employeeInfoId: number | null
  content: string
  hasPeriod: boolean
  startDate: Date | null
  endDate: Date | null
}

const DEFAULT_FORM: FormState = {
  officeId: null,
  franchiseId: null,
  storeId: null,
  employeeInfoId: null,
  content: '',
  hasPeriod: true,
  startDate: null,
  endDate: null,
}

interface EmployeeTodoFormProps {
  todoId?: number
}

export default function EmployeeTodoForm({ todoId }: EmployeeTodoFormProps) {
  const router = useRouter()
  const isEditMode = todoId != null
  const { alert, confirm } = useAlert()

  // 상세 데이터 조회 (수정 모드)
  const { data: detail, isPending: detailLoading, error: detailError } = useEmployeeTodoDetail(todoId ?? null)
  const detailErrorMessage = useQueryError(detailError)

  // 폼 초기화 (detail 로드 시)
  const initialForm = useMemo<FormState>(() => {
    if (!detail) return DEFAULT_FORM
    return {
      officeId: detail.headOfficeId,
      franchiseId: detail.franchiseId,
      storeId: detail.storeId,
      employeeInfoId: detail.employeeInfoId,
      content: detail.content,
      hasPeriod: detail.hasPeriod,
      startDate: detail.startDate ? new Date(detail.startDate) : null,
      endDate: detail.endDate ? new Date(detail.endDate) : null,
    }
  }, [detail])

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [formInitialized, setFormInitialized] = useState(false)
  const [slideboxOpen, setSlideboxOpen] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // detail이 로드되면 폼 초기화
  if (isEditMode && detail && !formInitialized) {
    setForm(initialForm)
    setFormInitialized(true)
  }

  // 계정 유형 판단
  const ownerCode = useAuthStore((s) => s.ownerCode)
  const isHeadOfficeAccount = ownerCode === OWNER_CODE.HEAD_OFFICE
  const isFranchiseAccount = ownerCode === OWNER_CODE.FRANCHISE

  // BP 트리 / 점포 옵션
  const { data: bpTree = [] } = useBpHeadOfficeTree()

  // 등록 모드: 본사/가맹점 계정이면 bpTree 로드 후 자동 세팅
  const [autoSelectDone, setAutoSelectDone] = useState(false)
  if (!isEditMode && !autoSelectDone && bpTree.length > 0) {
    if (isHeadOfficeAccount && bpTree.length === 1) {
      setForm((prev) => ({ ...prev, officeId: bpTree[0].id }))
      setAutoSelectDone(true)
    } else if (isFranchiseAccount && bpTree.length === 1 && bpTree[0].franchises.length === 1) {
      setForm((prev) => ({
        ...prev,
        officeId: bpTree[0].id,
        franchiseId: bpTree[0].franchises[0].id,
      }))
      setAutoSelectDone(true)
    } else if (bpTree.length >= 1) {
      setAutoSelectDone(true)
    }
  }
  const officeOptions: SelectOption[] = useMemo(
    () => bpTree.map((o) => ({ value: String(o.id), label: o.name })),
    [bpTree],
  )
  const franchiseOptions: SelectOption[] = useMemo(() => {
    if (form.officeId == null) return []
    const office = bpTree.find((o) => o.id === form.officeId)
    return office?.franchises.map((f) => ({ value: String(f.id), label: f.name })) ?? []
  }, [bpTree, form.officeId])
  const { data: storeOptionList = [], isPending: storeLoading } = useStoreOptions(
    form.officeId, form.franchiseId, !isEditMode,
  )
  const storeOptions: SelectOption[] = useMemo(
    () => storeOptionList.map((s) => ({ value: String(s.id), label: s.storeName })),
    [storeOptionList],
  )

  // 직원 selectbox — 등록 모드에서만 조회, 본사/가맹점/점포 변경 시 자동 refetch
  const {
    data: employeeList,
    isPending: empLoading,
  } = useEmployeeTodoSelectList(
    {
      headOfficeId: form.officeId ?? undefined,
      franchiseId: form.franchiseId ?? undefined,
      storeId: form.storeId ?? undefined,
    },
    !isEditMode,
  )
  const employeeOptions: SelectOption[] = useMemo(
    () => (employeeList ?? []).map((e) => ({ value: String(e.employeeInfoId), label: e.employeeName })),
    [employeeList],
  )
  const selectedEmployee = employeeList?.find((e) => e.employeeInfoId === form.employeeInfoId)

  const { mutateAsync: createTodo, isPending: creating } = useCreateEmployeeTodo()
  const { mutateAsync: updateTodo, isPending: updating } = useUpdateEmployeeTodo()
  const isSaving = creating || updating

  const toYmd = (date: Date | null) => date ? formatDateYmd(date, '') : ''

  const ERROR_MSG = '필수 입력 항목입니다.'

  const handleSave = async () => {
    // 필수값 검증
    const errors: Record<string, string> = {}
    if (!form.employeeInfoId) errors.employeeInfoId = ERROR_MSG
    if (!form.content.trim()) errors.content = ERROR_MSG
    if (!form.startDate) errors.startDate = ERROR_MSG
    if (form.hasPeriod && !form.endDate) errors.endDate = ERROR_MSG
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    const confirmed = await confirm('저장하시겠습니까?')
    if (!confirmed) return

    const body: EmployeeTodoCreateRequest = {
      headOfficeId: form.officeId!,
      franchiseId: form.franchiseId ?? undefined,
      storeId: form.storeId ?? undefined,
      employeeInfoId: form.employeeInfoId!,
      content: form.content.trim(),
      hasPeriod: form.hasPeriod,
      startDate: toYmd(form.startDate),
      endDate: form.hasPeriod ? toYmd(form.endDate) : undefined,
    }

    try {
      if (isEditMode) {
        await updateTodo({ id: todoId, body })
      } else {
        await createTodo(body)
      }
      router.push('/employee/todo')
    } catch {
      await alert('저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const handleGoBack = async () => {
    const confirmed = await confirm('취소하시겠습니까?')
    if (!confirmed) return
    router.push('/employee/todo')
  }

  if (isEditMode && detailLoading) {
    return (
      <div className="data-wrap">
        <Location title="TO-DO 관리" list={BREADCRUMBS} />
        <div className="cube-loader-overlay"><CubeLoader /></div>
      </div>
    )
  }

  if (isEditMode && detailErrorMessage) {
    return (
      <div className="data-wrap">
        <Location title="TO-DO 관리" list={BREADCRUMBS} />
        <div className="warning-txt">{detailErrorMessage}</div>
      </div>
    )
  }

  return (
    <div className="data-wrap">
      <Location title="TO-DO 관리" list={BREADCRUMBS} />
      <div className="master-detail-data">
        <div className={`slidebox-wrap ${slideboxOpen ? '' : 'close'}`}>
          <div className="slidebox-header">
            <h2>할 일 정보</h2>
            <div className="slidebox-btn-wrap">
              <button className="slidebox-btn" type="button" onClick={handleGoBack}>취소</button>
              <button className="slidebox-btn" type="button" onClick={handleSave} disabled={isSaving}>저장</button>
              <button className="slidebox-btn arr" type="button" onClick={() => setSlideboxOpen(!slideboxOpen)}>
                <i className="arr-icon" />
              </button>
            </div>
          </div>
          <AnimateHeight duration={300} height={slideboxOpen ? 'auto' : 0}>
            <div className="slidebox-body">
              <table className="default-table">
                <colgroup>
                  <col width="160px" />
                  <col />
                </colgroup>
                <tbody>
                  {/* 행1: 본사 / 가맹점 */}
                  <tr>
                    <th>{isFranchiseAccount ? '가맹점' : isHeadOfficeAccount ? '본사' : '본사 / 가맹점'}</th>
                    <td>
                      <div className="filed-flx">
                        {/* 본사: 가맹점 계정이면 숨김 */}
                        {!isFranchiseAccount && (
                          <div className="mx-500">
                            <SearchSelect
                              value={form.officeId != null ? officeOptions.find((opt) => opt.value === String(form.officeId)) ?? null : null}
                              options={officeOptions}
                              placeholder="본사 선택"
                              isDisabled={isEditMode || isHeadOfficeAccount}
                              isSearchable={!isEditMode && !isHeadOfficeAccount}
                              isClearable={false}
                              onChange={(option) =>
                                setForm((prev) => ({
                                  ...prev,
                                  officeId: option ? Number(option.value) : null,
                                  franchiseId: null,
                                  storeId: null,
                                  employeeInfoId: null,
                                }))
                              }
                            />
                          </div>
                        )}
                        {/* 가맹점: 본사 계정이면 숨김 */}
                        {!isHeadOfficeAccount && (
                          <div className="mx-500">
                            <SearchSelect
                              value={form.franchiseId != null ? franchiseOptions.find((opt) => opt.value === String(form.franchiseId)) ?? null : null}
                              options={franchiseOptions}
                              placeholder="가맹점 선택"
                              isDisabled={isEditMode || isFranchiseAccount}
                              isSearchable={!isEditMode && !isFranchiseAccount}
                              isClearable={false}
                              onChange={(option) =>
                                setForm((prev) => ({
                                  ...prev,
                                  franchiseId: option ? Number(option.value) : null,
                                  storeId: null,
                                  employeeInfoId: null,
                                }))
                              }
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* 행2: 점포 */}
                  <tr>
                    <th>점포</th>
                    <td>
                      <div className="filed-flx">
                        <div className="mx-500">
                          <SearchSelect
                            value={form.storeId != null ? storeOptions.find((opt) => opt.value === String(form.storeId)) ?? null : null}
                            options={storeOptions}
                            placeholder="점포 선택"
                            isDisabled={isEditMode || storeLoading}
                            isSearchable={!isEditMode}
                            isClearable={!isEditMode}
                            isLoading={storeLoading}
                            onChange={(option) =>
                              setForm((prev) => ({
                                ...prev,
                                storeId: option ? Number(option.value) : null,
                                employeeInfoId: null,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                  {/* 행2: 직원명 */}
                  <tr>
                    <th>직원명 <span className="red">*</span></th>
                    <td >
                      <div className="filed-flx">
                        <div className="mx-500">
                          <SearchSelect
                            value={form.employeeInfoId ? employeeOptions.find((opt) => opt.value === String(form.employeeInfoId)) ?? null : null}
                            options={employeeOptions}
                            placeholder={empLoading ? '직원 조회중...' : '직원 선택'}
                            isDisabled={empLoading}
                            isSearchable
                            isClearable
                            error={!!fieldErrors.employeeInfoId}
                            onChange={(option) => {
                              setForm((prev) => ({
                                ...prev,
                                employeeInfoId: option ? Number(option.value) : null,
                              }))
                              if (option) setFieldErrors((prev) => { const { employeeInfoId: _, ...rest } = prev; return rest })
                            }}
                          />
                          {fieldErrors.employeeInfoId && <div className="warning-txt mt5" role="alert">* {fieldErrors.employeeInfoId}</div>}
                        </div>
                        <span className="form-helper">{selectedEmployee?.employeeNumber ?? ''}</span>
                      </div>
                    </td>
                  </tr>
                  {/* 행3: 할 일 내용 */}
                  <tr>
                    <th>할 일 내용 <span className="red">*</span></th>
                    <td >
                      <Input
                        value={form.content}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, content: e.target.value }))
                          if (e.target.value.trim()) setFieldErrors((prev) => { const { content: _, ...rest } = prev; return rest })
                        }}
                        placeholder="할 일 내용을 입력해주세요"
                        error={!!fieldErrors.content}
                        helpText={fieldErrors.content}
                      />
                    </td>
                  </tr>
                  {/* 행4: 기간 */}
                  <tr>
                    <th>기간 <span className="red">*</span></th>
                    <td >
                      <div className="filed-check-flx">
                        <div className="toggle-wrap">
                          <label className="toggle-btn" htmlFor="todo-has-period">
                            <input
                              type="checkbox"
                              id="todo-has-period"
                              checked={form.hasPeriod}
                              onChange={(e) => setForm((prev) => ({
                                ...prev,
                                hasPeriod: e.target.checked,
                                endDate: e.target.checked ? prev.endDate : null,
                              }))}
                            />
                            <span className="slider" />
                          </label>
                          <span className="toggle-txt">기간 설정</span>
                        </div>
                        {form.hasPeriod ? (
                          <RangeDatePicker
                            startDate={form.startDate}
                            endDate={form.endDate}
                            onChange={(range) => {
                              setForm((prev) => ({
                                ...prev,
                                startDate: range.startDate,
                                endDate: range.endDate,
                              }))
                              if (range.startDate) setFieldErrors((prev) => { const { startDate: _, ...rest } = prev; return rest })
                              if (range.endDate) setFieldErrors((prev) => { const { endDate: _, ...rest } = prev; return rest })
                            }}
                            startDatePlaceholder="시작일"
                            endDatePlaceholder="종료일"
                          />
                        ) : (
                          <DatePicker
                            value={form.startDate}
                            onChange={(date) => {
                              setForm((prev) => ({ ...prev, startDate: date }))
                              if (date) setFieldErrors((prev) => { const { startDate: _, ...rest } = prev; return rest })
                            }}
                            placeholder="시작일"
                          />
                        )}
                      </div>
                      {(fieldErrors.startDate || fieldErrors.endDate) && (
                        <div className="warning-txt mt5" role="alert">* {fieldErrors.startDate || fieldErrors.endDate}</div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </AnimateHeight>
        </div>
      </div>
    </div>
  )
}
