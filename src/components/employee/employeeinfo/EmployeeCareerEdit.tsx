'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import DatePicker from '../../ui/common/DatePicker'
import { getEmployeeCareers, saveEmployeeCareers, deleteAllEmployeeCareers } from '@/lib/api/employee'
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

export default function EmployeeCareerEdit({ employeeId }: EmployeeCareerEditProps) {
  const router = useRouter()
  const [sectionOpen, setSectionOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [careers, setCareers] = useState<CareerFormItem[]>([])

  // 근무처 유형 옵션
  const workplaceTypeOptions: ClassificationItem[] = [
    { code: 'WKPLC_001', name: '본사', sortOrder: 1 },
    { code: 'WKPLC_002', name: '가맹점', sortOrder: 2 },
    { code: 'WKPLC_003', name: '외부', sortOrder: 3 }
  ]

  // 계약 분류 옵션
  const contractClassificationOptions: ClassificationItem[] = [
    { code: 'CNTCF_001', name: '정규직 직원', sortOrder: 1 },
    { code: 'CNTCF_002', name: '계약직 직원', sortOrder: 2 },
    { code: 'CNTCF_003', name: '수습 직원', sortOrder: 3 },
    { code: 'CNTCF_004', name: '파트타임 직원', sortOrder: 4 }
  ]

  // 경력 데이터 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // 경력 정보 조회
        const careerData = await getEmployeeCareers(employeeId)

        if (careerData.length > 0) {
          setCareers(careerData.map(career => ({
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
          })))
        } else {
          // 데이터가 없으면 빈 항목 하나 추가
          setCareers([createEmptyCareer()])
        }
      } catch (error) {
        console.error('데이터 조회 실패:', error)
        setCareers([createEmptyCareer()])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [employeeId])

  // 빈 경력 항목 생성
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

  // 경력 항목 추가
  const handleAddCareer = () => {
    setCareers(prev => [...prev, createEmptyCareer()])
  }

  // 경력 항목 삭제
  const handleRemoveCareer = (index: number) => {
    if (careers.length === 1) {
      // 마지막 항목이면 빈 항목으로 초기화
      setCareers([createEmptyCareer()])
      return
    }
    setCareers(prev => prev.filter((_, i) => i !== index))
  }

  // 경력 항목 값 변경
  const handleCareerChange = (index: number, field: keyof CareerFormItem, value: string | null) => {
    setCareers(prev => prev.map((career, i) =>
      i === index ? { ...career, [field]: value } : career
    ))
  }

  // 전체 삭제
  const handleDeleteAll = async () => {
    if (!confirm('모든 경력 정보를 삭제하시겠습니까?')) {
      return
    }

    try {
      setIsLoading(true)
      await deleteAllEmployeeCareers(employeeId)
      setCareers([createEmptyCareer()])
      alert('모든 경력 정보가 삭제되었습니다.')
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 저장
  const handleSave = async () => {
    // 유효한 경력 정보만 필터링 (회사명이 있는 것만)
    const validCareers = careers.filter(career => career.companyName.trim())

    if (validCareers.length === 0) {
      alert('저장할 경력 정보가 없습니다. 최소 하나의 근무처를 입력해주세요.')
      return
    }

    // 필수값 검증
    for (let i = 0; i < validCareers.length; i++) {
      const career = validCareers[i]
      if (!career.startDate) {
        alert(`${i + 1}번째 경력의 근무 시작일을 입력해주세요.`)
        return
      }
    }

    try {
      setIsLoading(true)

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

      await saveEmployeeCareers(employeeId, { careers: careersToSave })
      alert('저장되었습니다.')
      router.push(`/employee/info/${employeeId}`)
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/employee/info/${employeeId}`)
  }

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
            {careers.map((career, index) => (
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
                          <div className="mx-400">
                            <input
                              type="text"
                              className="input-frame"
                              value={career.companyName}
                              onChange={(e) => handleCareerChange(index, 'companyName', e.target.value)}
                              placeholder="회사명을 입력하세요"
                            />
                          </div>
                          <div className="mx-200">
                            <select
                              className="select-form"
                              value={career.workplaceType ?? ''}
                              onChange={(e) => handleCareerChange(index, 'workplaceType', e.target.value || null)}
                            >
                              <option value="">근무처 유형</option>
                              {workplaceTypeOptions.map((opt) => (
                                <option key={opt.code} value={opt.code}>{opt.name}</option>
                              ))}
                            </select>
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
                      </td>
                    </tr>

                    {/* 근무기간 */}
                    <tr>
                      <th>
                        근무기간 <span className="red">*</span>
                      </th>
                      <td>
                        <div className="filed-flx">
                          <div className="date-picker-wrap">
                            <DatePicker
                              value={career.startDate}
                              onChange={(date) => handleCareerChange(index, 'startDate', date)}
                              placeholder="시작일"
                            />
                          </div>
                          <span style={{ margin: '0 8px' }}>~</span>
                          <div className="date-picker-wrap">
                            <DatePicker
                              value={career.endDate ?? ''}
                              onChange={(date) => handleCareerChange(index, 'endDate', date || null)}
                              placeholder="종료일"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* 계약 분류 */}
                    <tr>
                      <th>
                        계약 분류 <span className="red">*</span>
                      </th>
                      <td>
                        <div className="mx-300">
                          <select
                            className="select-form"
                            value={career.contractClassification ?? ''}
                            onChange={(e) => handleCareerChange(index, 'contractClassification', e.target.value || null)}
                          >
                            <option value="">선택</option>
                            {contractClassificationOptions.map((opt) => (
                              <option key={opt.code} value={opt.code}>{opt.name}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>

                    {/* 직급 / 직책 */}
                    <tr>
                      <th>직급 / 직책</th>
                      <td>
                        <div className="filed-flx">
                          <div className="mx-200">
                            <input
                              type="text"
                              className="input-frame"
                              value={career.rank ?? ''}
                              onChange={(e) => handleCareerChange(index, 'rank', e.target.value || null)}
                              placeholder="직급 입력"
                            />
                          </div>
                          <div className="mx-200">
                            <input
                              type="text"
                              className="input-frame"
                              value={career.position ?? ''}
                              onChange={(e) => handleCareerChange(index, 'position', e.target.value || null)}
                              placeholder="직책 입력"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* 업무 내용 */}
                    <tr>
                      <th>업무 내용</th>
                      <td>
                        <div className="block">
                          <input
                            type="text"
                            className="input-frame"
                            value={career.jobDescription ?? ''}
                            onChange={(e) => handleCareerChange(index, 'jobDescription', e.target.value || null)}
                            placeholder="업무 내용을 입력하세요"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* 퇴사 사유 */}
                    <tr>
                      <th>퇴사 사유</th>
                      <td>
                        <div className="block">
                          <input
                            type="text"
                            className="input-frame"
                            value={career.resignationReason ?? ''}
                            onChange={(e) => handleCareerChange(index, 'resignationReason', e.target.value || null)}
                            placeholder="퇴사 사유를 입력하세요"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {index < careers.length - 1 && (
                  <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px dashed #ddd' }} />
                )}
              </div>
            ))}
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
