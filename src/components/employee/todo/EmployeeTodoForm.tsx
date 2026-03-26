'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import Location from '@/components/ui/Location'
import { Input, useAlert } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import DatePicker from '@/components/ui/common/DatePicker'
import RangeDatePicker from '@/components/ui/common/RangeDatePicker'
import {
  useBpHeadOfficeTree,
  useStoreOptions,
  useEmployeeTodoDetail,
  useEmployeeTodoSelectList,
  useCreateEmployeeTodo,
  useUpdateEmployeeTodo,
} from '@/hooks/queries'
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

const toYmd = (date: Date | null) => date ? formatDateYmd(date, '') : ''

interface EmployeeTodoFormProps {
  todoId?: number
}

export default function EmployeeTodoForm({ todoId }: EmployeeTodoFormProps) {
  const router = useRouter()
  const isEditMode = todoId != null
  const { alert, confirm } = useAlert()

  // 계정 유형 판단
  const ownerCode = useAuthStore((s) => s.ownerCode)
  const isHeadOfficeAccount = ownerCode === OWNER_CODE.HEAD_OFFICE
  const isFranchiseAccount = ownerCode === OWNER_CODE.FRANCHISE

  // BP 트리 / 상세 데이터 조회
  const { data: bpTree = [] } = useBpHeadOfficeTree()
  const { data: detail } = useEmployeeTodoDetail(todoId ?? null)

  // 폼 초기값 계산 (파생 값 — setState 없이)
  // - 수정 모드: detail 기반 (key={todoId} 리마운트로 보장)
  // - 등록 모드: 계정 유형별 본사/가맹점 자동 세팅
  const initialForm = useMemo<FormState>(() => {
    if (detail) {
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
    }
    // bpTree가 단일 본사일 때만 자동 세팅, 그 외에는 DEFAULT_FORM 참조를 그대로 반환하여 안정성 확보
    if (bpTree.length !== 1) return DEFAULT_FORM
    const officeId = bpTree[0].id
    const franchiseId = isFranchiseAccount && bpTree[0].franchises.length >= 1
      ? bpTree[0].franchises[0].id
      : null
    return { ...DEFAULT_FORM, officeId, franchiseId }
  }, [detail, isFranchiseAccount, bpTree])

  const [form, setForm] = useState<FormState>(initialForm)
  const [slideboxOpen, setSlideboxOpen] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
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
    form.officeId, form.franchiseId,
  )
  const storeOptions: SelectOption[] = useMemo(
    () => storeOptionList.map((s) => ({ value: String(s.id), label: s.storeName })),
    [storeOptionList],
  )

  // 직원 selectbox — 등록 모드 + 본사 선택 시에만 조회
  const canFetchEmployees = !isEditMode && form.officeId != null
  const {
    data: employeeList,
    isPending: empLoading,
  } = useEmployeeTodoSelectList(
    {
      headOfficeId: form.officeId ?? undefined,
      franchiseId: form.franchiseId ?? undefined,
      storeId: form.storeId ?? undefined,
    },
    canFetchEmployees,
  )
  const employeeOptions: SelectOption[] = useMemo(
    () => (employeeList ?? []).map((e) => ({ value: String(e.employeeInfoId), label: e.employeeName })),
    [employeeList],
  )
  const selectedEmployee = employeeList?.find((e) => e.employeeInfoId === form.employeeInfoId)

  const { mutateAsync: createTodo, isPending: creating } = useCreateEmployeeTodo()
  const { mutateAsync: updateTodo, isPending: updating } = useUpdateEmployeeTodo()
  const [isConfirming, setIsConfirming] = useState(false)
  const isSaving = creating || updating || isConfirming

  const ERROR_MSG = '필수 입력 항목입니다.'

  const handleSave = async () => {
    // 필수값 검증
    const errors: Record<string, string> = {}
    if (!form.officeId) errors.officeId = ERROR_MSG
    if (!form.employeeInfoId) errors.employeeInfoId = ERROR_MSG
    if (!form.content.trim()) errors.content = ERROR_MSG
    if (!form.startDate) errors.startDate = ERROR_MSG
    if (form.hasPeriod && !form.endDate) errors.endDate = ERROR_MSG
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    // confirm 대기 전 body를 미리 생성하여 race condition 방지
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

    setIsConfirming(true)
    const confirmed = await confirm('저장하시겠습니까?')
    setIsConfirming(false)
    if (!confirmed) return

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
                        {/* 본사: 가맹점 계정이면 숨김 (데이터는 form.officeId로 유지) */}
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
                        {/* 가맹점: 본사 계정이면 숨김 (데이터는 form.franchiseId로 유지) */}
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
                  {/* 행3: 직원명 */}
                  <tr>
                    <th>직원명 <span className="red">*</span></th>
                    <td>
                      <div className="filed-flx">
                        <div className="mx-500">
                          {isEditMode ? (
                            <SearchSelect
                              value={detail ? { value: String(detail.employeeInfoId), label: detail.employeeName } : null}
                              options={[]}
                              isDisabled
                              isSearchable={false}
                              isClearable={false}
                            />
                          ) : (
                            <>
                              <SearchSelect
                                value={form.employeeInfoId ? employeeOptions.find((opt) => opt.value === String(form.employeeInfoId)) ?? null : null}
                                options={employeeOptions}
                                placeholder={!canFetchEmployees ? '본사/가맹점을 선택해주세요.' : empLoading ? '직원 조회중...' : '직원 선택'}
                                isDisabled={!canFetchEmployees || empLoading}
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
                            </>
                          )}
                        </div>
                        <span className="form-helper">{isEditMode ? (detail?.employeeNumber ?? '') : (selectedEmployee?.employeeNumber ?? '')}</span>
                      </div>
                    </td>
                  </tr>
                  {/* 행4: 할 일 내용 */}
                  <tr>
                    <th>할 일 내용 <span className="red">*</span></th>
                    <td>
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
                  {/* 행5: 기간 */}
                  <tr>
                    <th>기간 <span className="red">*</span></th>
                    <td>
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
