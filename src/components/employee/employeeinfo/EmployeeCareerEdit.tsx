'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import RangeDatePicker, { DateRange } from '../../ui/common/RangeDatePicker'
import { Input, useAlert } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import {
  useEmployeeCareers,
  useSaveEmployeeCareers,
  useDeleteAllEmployeeCareers
} from '@/hooks/queries/use-employee-queries'
import type { EmployeeCareerItem } from '@/types/employee'

interface ClassificationItem {
  code: string
  name: string
  sortOrder: number
}

interface EmployeeCareerEditProps {
  employeeId: number
}

interface CareerFormItem extends EmployeeCareerItem {
  tempId?: string  // 새 항목을 위한 임시 ID
}

// 빈 경력 항목 생성 (컴포넌트 외부로 이동 - React 19 권장)
const createEmptyCareer = (): CareerFormItem => ({
  tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  companyName: '',
  workplaceType: null,
  startDate: '',
  endDate: null,
  contractClassification: null,
  rank: null,
  position: null,
  jobDescription: null,
  resignationReason: null
})

// 근무처 유형 옵션 (상수로 이동)
const workplaceTypeOptions: ClassificationItem[] = [
  { code: 'WKPLC_001', name: '본사', sortOrder: 1 },
  { code: 'WKPLC_002', name: '가맹점', sortOrder: 2 },
  { code: 'WKPLC_003', name: '외부', sortOrder: 3 }
]

// 계약 분류 옵션 (상수로 이동)
const contractClassificationOptions: ClassificationItem[] = [
  { code: 'CNTCF_001', name: '정규직 직원', sortOrder: 1 },
  { code: 'CNTCF_002', name: '계약직 직원', sortOrder: 2 },
  { code: 'CNTCF_003', name: '수습 직원', sortOrder: 3 },
  { code: 'CNTCF_004', name: '파트타임 직원', sortOrder: 4 }
]

export default function EmployeeCareerEdit({ employeeId }: EmployeeCareerEditProps) {
  const router = useRouter()
  const { alert, confirm } = useAlert()
  const [sectionOpen, setSectionOpen] = useState(true)
  const [isValidationAttempted, setIsValidationAttempted] = useState(false)

  // TanStack Query 훅들
  const { data: careersData, isPending: isCareersLoading } = useEmployeeCareers(employeeId)
  const saveCareersMutation = useSaveEmployeeCareers()
  const deleteAllCareersMutation = useDeleteAllEmployeeCareers()

  const isLoading = isCareersLoading || saveCareersMutation.isPending || deleteAllCareersMutation.isPending

  // React 19: useEffect 대신 데이터 변환을 렌더링 시점에서 처리
  const initialCareers: CareerFormItem[] = careersData && careersData.length > 0
    ? careersData.map(career => ({
        id: career.id,
        companyName: career.companyName,
        workplaceType: career.workplaceType ?? null,
        startDate: career.startDate,
        endDate: career.endDate ?? null,
        contractClassification: career.contractClassification ?? null,
        rank: career.rank ?? null,
        position: career.position ?? null,
        jobDescription: career.jobDescription ?? null,
        resignationReason: career.resignationReason ?? null
      }))
    : [createEmptyCareer()]

  // 로컬 수정 상태 (서버 데이터가 변경되면 초기화)
  const [localCareers, setLocalCareers] = useState<CareerFormItem[] | null>(null)
  const [dataVersion, setDataVersion] = useState<number | null>(null)

  // 현재 표시할 데이터 결정 (React 19: derived state)
  const currentVersion = careersData?.length ?? 0
  const careers = (localCareers && dataVersion === currentVersion) ? localCareers : initialCareers

  // 로컬 상태 업데이트 함수
  const updateCareers = (updater: (prev: CareerFormItem[]) => CareerFormItem[]) => {
    setLocalCareers(updater(careers))
    setDataVersion(currentVersion)
  }

  // 경력 항목 추가
  const handleAddCareer = () => {
    updateCareers(prev => [...prev, createEmptyCareer()])
  }

  // 경력 항목 삭제
  const handleRemoveCareer = (index: number) => {
    if (careers.length === 1) {
      updateCareers(() => [createEmptyCareer()])
      return
    }
    updateCareers(prev => prev.filter((_, i) => i !== index))
  }

  // 경력 항목 값 변경
  const handleCareerChange = (index: number, field: keyof CareerFormItem, value: string | null) => {
    updateCareers(prev => prev.map((career, i) =>
      i === index ? { ...career, [field]: value } : career
    ))
  }

  // 전체 삭제
  const handleDeleteAll = async () => {
    if (!(await confirm('모든 경력 정보를 삭제하시겠습니까?'))) {
      return
    }

    try {
      await deleteAllCareersMutation.mutateAsync(employeeId)
      setLocalCareers([createEmptyCareer()])
      setDataVersion(null)
      await alert('모든 경력 정보가 삭제되었습니다.')
    } catch (error) {
      console.error('삭제 실패:', error)
      await alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // 에러 검증 함수 (React 19: 렌더링 시점에서 계산)
  const getCareerErrors = (career: CareerFormItem, _index: number) => {
    if (!isValidationAttempted) return {}
    const errors: Record<string, string> = {}
    if (!career.companyName.trim()) errors.companyName = '근무처를 입력해주세요.'
    if (!career.startDate) errors.startDate = '근무 시작일을 입력해주세요.'
    if (!career.contractClassification) errors.contractClassification = '계약 분류를 선택해주세요.'
    return errors
  }

  // 저장
  const handleSave = async () => {
    setIsValidationAttempted(true)

    // 유효한 경력 정보만 필터링 (회사명이 있는 것만)
    const validCareers = careers.filter(career => career.companyName.trim())

    if (validCareers.length === 0) {
      return
    }

    // 필수값 검증 (에러가 있으면 저장하지 않음)
    let hasErrors = false
    for (const career of validCareers) {
      if (!career.startDate || !career.contractClassification) {
        hasErrors = true
        break
      }
    }

    if (hasErrors) {
      return
    }

    try {
      const careersToSave: EmployeeCareerItem[] = validCareers.map(career => ({
        id: career.id ?? undefined,  // 새 항목은 id가 없음
        companyName: career.companyName,
        workplaceType: career.workplaceType,
        startDate: career.startDate,
        endDate: career.endDate,
        contractClassification: career.contractClassification,
        rank: career.rank,
        position: career.position,
        jobDescription: career.jobDescription,
        resignationReason: career.resignationReason
      }))

      await saveCareersMutation.mutateAsync({
        employeeInfoId: employeeId,
        data: { careers: careersToSave }
      })
      await alert('저장되었습니다.')
      router.push(`/employee/info/${employeeId}`)
    } catch (error) {
      console.error('저장 실패:', error)
      await alert('저장 중 오류가 발생했습니다.')
    }
  }

  const handleCancel = () => {
    router.push(`/employee/info/${employeeId}`)
  }

  // 근무처 유형 SelectOption 변환
  const workplaceTypeSelectOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '근무처 유형' },
    ...workplaceTypeOptions.map(opt => ({
      value: opt.code,
      label: opt.name
    }))
  ], [])

  // 계약 분류 SelectOption 변환
  const contractClassSelectOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '선택' },
    ...contractClassificationOptions.map(opt => ({
      value: opt.code,
      label: opt.name
    }))
  ], [])

  return (
    <div className="master-detail-data">
      {/* 경력 정보 */}
      <div className={`slidebox-wrap ${sectionOpen ? '' : 'close'}`}>
        <div className="slidebox-header">
          <h2>경력 정보</h2>
          <div className="slidebox-btn-wrap">
            <button
              className="btn-form outline"
              onClick={handleDeleteAll}
              disabled={isLoading}
              style={{ marginRight: '8px' }}
            >
              전체 삭제
            </button>
            <button className="btn-form basic" onClick={handleSave} disabled={isLoading}>
              {isLoading ? '저장 중...' : '저장'}
            </button>
            <button className="slidebox-btn arr" onClick={() => setSectionOpen(!sectionOpen)}>
              <i className="arr-icon"></i>
            </button>
          </div>
        </div>
        <AnimateHeight duration={300} height={sectionOpen ? 'auto' : 0}>
          <div className="slidebox-body">
            {careers.map((career, index) => {
              const errors = getCareerErrors(career, index)
              return (
              <div key={career.id ?? career.tempId} style={{ marginBottom: index < careers.length - 1 ? '24px' : 0 }}>
                <table className="default-table">
                  <colgroup>
                    <col width="190px" />
                    <col />
                  </colgroup>
                  <tbody>
                    {/* 근무처 */}
                    <tr>
                      <th>
                        근무처 <span className="red">*</span>
                      </th>
                      <td>
                        <div className="filed-flx">
                          <Input
                            id={`career-${career.id ?? career.tempId}-companyName`}
                            value={career.companyName}
                            onChange={(e) => handleCareerChange(index, 'companyName', e.target.value)}
                            placeholder="회사명을 입력하세요"
                            error={!!errors.companyName}
                            showClear
                            onClear={() => handleCareerChange(index, 'companyName', '')}
                            containerClassName="mx-400"
                          />
                          <div className="mx-200">
                            <SearchSelect
                              options={workplaceTypeSelectOptions}
                              value={workplaceTypeSelectOptions.find(opt => opt.value === (career.workplaceType ?? '')) || null}
                              onChange={(opt) => handleCareerChange(index, 'workplaceType', opt?.value || null)}
                              placeholder="근무처 유형"
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                            <button
                              type="button"
                              className="btn-form basic"
                              onClick={handleAddCareer}
                              style={{
                                minWidth: '36px',
                                width: '36px',
                                height: '36px',
                                padding: '0',
                                borderRadius: '50%',
                                fontSize: '20px',
                                fontWeight: 'bold'
                              }}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              className="btn-form"
                              onClick={() => handleRemoveCareer(index)}
                              style={{
                                minWidth: '36px',
                                width: '36px',
                                height: '36px',
                                padding: '0',
                                borderRadius: '50%',
                                fontSize: '20px',
                                fontWeight: 'bold',
                                backgroundColor: '#dc3545',
                                borderColor: '#dc3545',
                                color: '#fff'
                              }}
                            >
                              -
                            </button>
                          </div>
                        </div>
                        {errors.companyName && (
                          <div className="warning-txt mt5" role="alert">* {errors.companyName}</div>
                        )}
                      </td>
                    </tr>

                    {/* 근무기간 */}
                    <tr>
                      <th>
                        근무기간 <span className="red">*</span>
                      </th>
                      <td>
                        <div className={errors.startDate ? 'has-error' : ''}>
                          <RangeDatePicker
                            startDate={career.startDate ? new Date(career.startDate) : null}
                            endDate={career.endDate ? new Date(career.endDate) : null}
                            onChange={(range: DateRange) => {
                              handleCareerChange(index, 'startDate', range.startDate ? range.startDate.toISOString().split('T')[0] : null)
                              handleCareerChange(index, 'endDate', range.endDate ? range.endDate.toISOString().split('T')[0] : null)
                            }}
                            startDatePlaceholder="시작일"
                            endDatePlaceholder="종료일"
                          />
                        </div>
                        {errors.startDate && (
                          <div className="warning-txt mt5" role="alert">* {errors.startDate}</div>
                        )}
                      </td>
                    </tr>

                    {/* 계약 분류 */}
                    <tr>
                      <th>
                        계약 분류 <span className="red">*</span>
                      </th>
                      <td>
                        <div className="mx-300">
                          <SearchSelect
                            options={contractClassSelectOptions}
                            value={contractClassSelectOptions.find(opt => opt.value === (career.contractClassification ?? '')) || null}
                            onChange={(opt) => handleCareerChange(index, 'contractClassification', opt?.value || null)}
                            placeholder="선택"
                            className={errors.contractClassification ? 'border-red-500' : ''}
                          />
                        </div>
                        {errors.contractClassification && (
                          <div className="warning-txt mt5" role="alert">* {errors.contractClassification}</div>
                        )}
                      </td>
                    </tr>

                    {/* 직급 / 직책 */}
                    <tr>
                      <th>직급 / 직책</th>
                      <td>
                        <div className="filed-flx">
                          <Input
                            id={`career-${career.id ?? career.tempId}-rank`}
                            value={career.rank ?? ''}
                            onChange={(e) => handleCareerChange(index, 'rank', e.target.value || null)}
                            placeholder="직급 입력"
                            showClear
                            onClear={() => handleCareerChange(index, 'rank', null)}
                            containerClassName="mx-200"
                          />
                          <Input
                            id={`career-${career.id ?? career.tempId}-position`}
                            value={career.position ?? ''}
                            onChange={(e) => handleCareerChange(index, 'position', e.target.value || null)}
                            placeholder="직책 입력"
                            showClear
                            onClear={() => handleCareerChange(index, 'position', null)}
                            containerClassName="mx-200"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* 업무 내용 */}
                    <tr>
                      <th>업무 내용</th>
                      <td>
                        <Input
                          id={`career-${career.id ?? career.tempId}-jobDescription`}
                          value={career.jobDescription ?? ''}
                          onChange={(e) => handleCareerChange(index, 'jobDescription', e.target.value || null)}
                          placeholder="업무 내용을 입력하세요"
                          showClear
                          onClear={() => handleCareerChange(index, 'jobDescription', null)}
                          fullWidth
                        />
                      </td>
                    </tr>

                    {/* 퇴사 사유 */}
                    <tr>
                      <th>퇴사 사유</th>
                      <td>
                        <Input
                          id={`career-${career.id ?? career.tempId}-resignationReason`}
                          value={career.resignationReason ?? ''}
                          onChange={(e) => handleCareerChange(index, 'resignationReason', e.target.value || null)}
                          placeholder="퇴사 사유를 입력하세요"
                          showClear
                          onClear={() => handleCareerChange(index, 'resignationReason', null)}
                          fullWidth
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
                {index < careers.length - 1 && (
                  <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px dashed #ddd' }} />
                )}
              </div>
            )})}
          </div>
        </AnimateHeight>
      </div>

      {/* 하단 버튼 */}
      <div className="btn-filed" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
        <button className="btn-form gray" onClick={handleCancel}>취소</button>
        <button className="btn-form basic" onClick={handleSave} disabled={isLoading}>
          {isLoading ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
