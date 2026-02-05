'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import { useContractDetail, useDeleteContract, useSendContractEmail } from '@/hooks/queries/use-contract-queries'
import { useAlert } from '@/components/common/ui'

interface EmployContractDetailDataProps {
  contractId?: number
}

// 전자계약 상태 한글 매핑
const electronicContractStatusMap: Record<string, string> = {
  'WRITING': '작성중',
  'PROGRESS': '진행중',
  'COMPLETE': '계약완료',
  'REFUSAL': '거절'
}

// 요일 타입 한글 매핑
const dayTypeMap: Record<string, string> = {
  'WEEKDAY': '평일',
  'MONDAY': '월',
  'TUESDAY': '화',
  'WEDNESDAY': '수',
  'THURSDAY': '목',
  'FRIDAY': '금',
  'SATURDAY': '토',
  'SUNDAY': '일'
}

export default function EmployContractDetailData({ contractId }: EmployContractDetailDataProps) {
  const router = useRouter()
  const { alert, confirm } = useAlert()
  const [headerInfoOpen, setHeaderInfoOpen] = useState(true)
  const [salaryInfoOpen, setSalaryInfoOpen] = useState(true)
  const [workHoursOpen, setWorkHoursOpen] = useState(true)

  // TanStack Query로 데이터 조회
  const { data: contractData, isPending: isLoading, error } = useContractDetail(
    contractId ?? 0,
    !!contractId
  )

  // 삭제 및 이메일 전송 mutation
  const { mutateAsync: deleteContract, isPending: isDeleting } = useDeleteContract()
  const { mutateAsync: sendEmail, isPending: isSendingEmail } = useSendContractEmail()

  const handleDelete = async () => {
    if (!contractId) return

    if (await confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteContract(contractId)
        await alert('계약서가 삭제되었습니다.')
        router.push('/employee/contract')
      } catch (err) {
        console.error('계약서 삭제 실패:', err)
        await alert('계약서 삭제에 실패했습니다.')
      }
    }
  }

  const handleList = () => {
    router.push('/employee/contract')
  }

  const handleSendContract = async () => {
    if (!contractId) return

    if (!contractData?.member) {
      await alert('계약서를 전송할 수 없습니다. 직원(member)이 연결되어 있지 않습니다.')
      return
    }

    if (!contractData.member.email) {
      await alert('직원의 이메일 정보가 없습니다.')
      return
    }

    if (await confirm(`${contractData.member.name}(${contractData.member.email})에게 계약서를 전송하시겠습니까?`)) {
      try {
        await sendEmail(contractId)
        await alert('계약서가 전송되었습니다.')
      } catch (err) {
        console.error('계약서 전송 실패:', err)
        await alert('계약서 전송에 실패했습니다.')
      }
    }
  }

  const handleDownloadContract = async () => {
    await alert('계약서(미날인원본)를 다운로드합니다.')
  }

  const handleEditHeader = () => {
    router.push(`/employee/contract/${contractId}/edit`)
  }

  const handleEditSalary = () => {
    router.push(`/employee/contract/${contractId}/salary`)
  }

  const handleEditWorkHour = () => {
    router.push(`/employee/contract/${contractId}/workinghour`)
  }

  // 4대보험 문자열 생성
  const getInsuranceText = () => {
    if (!contractData?.employmentContractHeader) return '-'
    const header = contractData.employmentContractHeader
    const insurances = []
    if (header.healthInsuranceEnrolled) insurances.push('건강보험')
    if (header.nationalPensionEnrolled) insurances.push('국민연금')
    if (header.employmentInsuranceEnrolled) insurances.push('고용보험')
    if (header.workersCompensationEnrolled) insurances.push('산재보험')
    return insurances.length > 0 ? insurances.join(', ') : '-'
  }

  // 근무 시간 정보 가져오기
  const getWorkHourInfo = (dayType: string) => {
    const workHour = contractData?.workHours?.find(wh => wh.dayType === dayType)
    if (!workHour || !workHour.isWork) {
      return { workTime: '-', breakTime: '-', schedule: '-' }
    }
    return {
      workTime: `${workHour.workStartTime || '-'} ~ ${workHour.workEndTime || '-'}`,
      breakTime: workHour.isBreak ? `${workHour.breakStartTime || '-'} ~ ${workHour.breakEndTime || '-'}` : '-',
      schedule: workHour.everySaturdayWork !== undefined
        ? (workHour.everySaturdayWork ? '매주' : '격주')
        : workHour.everySundayWork !== undefined
          ? (workHour.everySundayWork ? '매주' : '격주')
          : '-'
    }
  }

  // 평일 근무 요일 가져오기
  const getWeekdayDays = () => {
    if (!contractData?.workHours) return '-'
    const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    const workingDays = contractData.workHours
      .filter(wh => weekdays.includes(wh.dayType) && wh.isWork)
      .map(wh => dayTypeMap[wh.dayType] || wh.dayType)

    const weekdayType = contractData.workHours.find(wh => wh.dayType === 'WEEKDAY' && wh.isWork)
    if (weekdayType) {
      return '월,화,수,목,금'
    }

    return workingDays.length > 0 ? workingDays.join(',') : '-'
  }

  // 평일 근무 시간 정보
  const getWeekdayWorkInfo = () => {
    if (!contractData?.workHours) return { workTime: '-', breakTime: '-' }

    const weekdayType = contractData.workHours.find(wh => wh.dayType === 'WEEKDAY' && wh.isWork)
    if (weekdayType) {
      return {
        workTime: `${weekdayType.workStartTime || '-'} ~ ${weekdayType.workEndTime || '-'}`,
        breakTime: weekdayType.isBreak ? `${weekdayType.breakStartTime || '-'} ~ ${weekdayType.breakEndTime || '-'}` : '-'
      }
    }

    const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    const firstWorkDay = contractData.workHours.find(wh => weekdays.includes(wh.dayType) && wh.isWork)
    if (firstWorkDay) {
      return {
        workTime: `${firstWorkDay.workStartTime || '-'} ~ ${firstWorkDay.workEndTime || '-'}`,
        breakTime: firstWorkDay.isBreak ? `${firstWorkDay.breakStartTime || '-'} ~ ${firstWorkDay.breakEndTime || '-'}` : '-'
      }
    }

    return { workTime: '-', breakTime: '-' }
  }

  // 상여금 문자열 생성
  const getBonusText = () => {
    if (!contractData?.salaryInfo?.bonuses || contractData.salaryInfo.bonuses.length === 0) {
      return '-'
    }
    return contractData.salaryInfo.bonuses
      .map(bonus => `${bonus.bonusType}: ${bonus.amount.toLocaleString()}원`)
      .join(' | ')
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="master-detail-data">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          데이터를 불러오는 중...
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="master-detail-data">
        <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
          근로 계약 정보를 불러오는데 실패했습니다.
        </div>
        <div style={{ textAlign: 'center' }}>
          <button className="btn-form basic" onClick={handleList}>목록으로 돌아가기</button>
        </div>
      </div>
    )
  }

  // 데이터 없음
  if (!contractData) {
    return (
      <div className="master-detail-data">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          근로 계약 정보가 없습니다.
        </div>
        <div style={{ textAlign: 'center' }}>
          <button className="btn-form basic" onClick={handleList}>목록으로 돌아가기</button>
        </div>
      </div>
    )
  }

  const header = contractData.employmentContractHeader
  const salaryInfo = contractData.salaryInfo
  const saturdayInfo = getWorkHourInfo('SATURDAY')
  const sundayInfo = getWorkHourInfo('SUNDAY')
  const weekdayInfo = getWeekdayWorkInfo()

  return (
    <div className="master-detail-data">
      {/* 상단 버튼 */}
      <div className="detail-top-btn" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
        <button className="btn-form gray" onClick={handleSendContract} disabled={isSendingEmail}>
          {isSendingEmail ? '전송 중...' : '직원에게 계약서 전송'}
        </button>
        <button className="btn-form gray" onClick={handleDownloadContract}>계약서(미날인원본) 다운로드</button>
        <button className="btn-form gray" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? '삭제 중...' : '삭제'}
        </button>
        <button className="btn-form basic" onClick={handleList}>목록</button>
      </div>

      {/* 근로 계약 Header 정보 */}
      <div className={`slidebox-wrap ${headerInfoOpen ? '' : 'close'}`}>
        <div className="slidebox-header">
          <h2>근로 계약 Header 정보</h2>
          <div className="slidebox-btn-wrap">
            <button className="slidebox-btn" onClick={handleEditHeader}>수정</button>
            <button className="slidebox-btn arr" onClick={() => setHeaderInfoOpen(!headerInfoOpen)} aria-label={headerInfoOpen ? '근로 계약 Header 정보 접기' : '근로 계약 Header 정보 펼치기'}>
              <i className="arr-icon"></i>
            </button>
          </div>
        </div>
        <AnimateHeight duration={300} height={headerInfoOpen ? 'auto' : 0}>
          <div className="slidebox-body">
            <div className="detail-data-wrap">
              <table className="detail-data-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th>전자계약 진행 상태</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {header?.electronicContractStatus ? electronicContractStatusMap[header.electronicContractStatus] || header.electronicContractStatus : '-'} | {header?.contractTypeName || '-'}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>직원명</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {contractData.member?.employeeNumber || '-'} | {contractData.member?.name || contractData.employeeInfoName || '-'}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>근무처 및 업무</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            - | <a href="#" style={{ color: '#007bff', textDecoration: 'underline' }}>-</a> | <a href="#" style={{ color: '#007bff', textDecoration: 'underline' }}>-</a> | {header?.jobDescription || '-'}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>근로계약 내용</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {header?.contractClassificationName || '-'} | {header?.salaryCycleName || '-'} | {header?.contractStartDate || '-'} ~ {header?.contractEndDate || '-'} | {header?.contractDate || '-'}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>4대보험 가입여부</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">{getInsuranceText()}</span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>급여 계산 주기/급여일</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {header?.salaryCycleName || '-'} | {header?.salaryMonthName || '-'} {header?.salaryDay || '-'}일
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>관련서류</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {header?.workContractFile ? (
                              <a
                                href={header.workContractFile.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
                                download
                              >
                                {header.workContractFile.fileName}
                              </a>
                            ) : null}
                            {header?.workContractFile && header?.wageContractFile ? ' | ' : null}
                            {header?.wageContractFile ? (
                              <a
                                href={header.wageContractFile.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
                                download
                              >
                                {header.wageContractFile.fileName}
                              </a>
                            ) : null}
                            {!header?.workContractFile && !header?.wageContractFile ? '-' : null}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </AnimateHeight>
      </div>

      {/* 급여 정보 */}
      <div className={`slidebox-wrap ${salaryInfoOpen ? '' : 'close'}`}>
        <div className="slidebox-header">
          <h2>급여 정보</h2>
          <div className="slidebox-btn-wrap">
            <button className="slidebox-btn" onClick={handleEditSalary}>수정</button>
            <button className="slidebox-btn arr" onClick={() => setSalaryInfoOpen(!salaryInfoOpen)} aria-label={salaryInfoOpen ? '급여 정보 접기' : '급여 정보 펼치기'}>
              <i className="arr-icon"></i>
            </button>
          </div>
        </div>
        <AnimateHeight duration={300} height={salaryInfoOpen ? 'auto' : 0}>
          <div className="slidebox-body">
            <div className="detail-data-wrap">
              <table className="detail-data-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                </colgroup>
                <tbody>
                  {/* 파트타임인 경우 시급 정보만 표시 */}
                  {header?.contractClassification === 'CNTCFWK_003' ? (
                    <tr>
                      <th>급여항목/금액</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">
                              평일 시급 : {(salaryInfo?.weekDayAllowance || 0).toLocaleString()}원 | 연장근무 시급 : {(salaryInfo?.overtimeDayAllowance || 0).toLocaleString()}원 | 휴일근무 시급 : {(salaryInfo?.holidayAllowanceTime || 0).toLocaleString()}원
                            </span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                  ) : (
                    <>
                      <tr>
                        <th>급여 및 통상시급</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">
                                {(salaryInfo?.annualSalary || 0).toLocaleString()}원 | {(salaryInfo?.monthlyTotalSalary || 0).toLocaleString()}원 | {(salaryInfo?.timelySalary || 0).toLocaleString()}원
                              </span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <th>비과세 항목</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">
                                식대 : {(salaryInfo?.mealAllowance || 0).toLocaleString()}원 | 자가운전보조금 : {(salaryInfo?.vehicleAllowance || 0).toLocaleString()}원 | 육아수당 : {(salaryInfo?.childcareAllowance || 0).toLocaleString()}원
                              </span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <th>상여금</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">
                                {getBonusText()}
                              </span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </AnimateHeight>
      </div>

      {/* 계약 근무 시간 */}
      <div className={`slidebox-wrap ${workHoursOpen ? '' : 'close'}`}>
        <div className="slidebox-header">
          <h2>계약 근무 시간</h2>
          <div className="slidebox-btn-wrap">
            <button className="slidebox-btn" onClick={handleEditWorkHour}>수정</button>
            <button className="slidebox-btn arr" onClick={() => setWorkHoursOpen(!workHoursOpen)} aria-label={workHoursOpen ? '계약 근무 시간 접기' : '계약 근무 시간 펼치기'}>
              <i className="arr-icon"></i>
            </button>
          </div>
        </div>
        <AnimateHeight duration={300} height={workHoursOpen ? 'auto' : 0}>
          <div className="slidebox-body">
            <div className="detail-data-wrap">
              <table className="detail-data-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th>평일</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {weekdayInfo.workTime} | {weekdayInfo.breakTime} | {getWeekdayDays()}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>토요일</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {saturdayInfo.workTime} | {saturdayInfo.breakTime} | {saturdayInfo.schedule}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>일요일</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {sundayInfo.workTime} | {sundayInfo.breakTime} | {sundayInfo.schedule}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </AnimateHeight>
      </div>
    </div>
  )
}
