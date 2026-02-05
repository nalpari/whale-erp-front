'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import {
  useEmployeeDetail,
  useEmployeeCareers,
  useEmployeeCertificates,
  useDeleteEmployee,
  useSendEmployeeRegistrationEmail
} from '@/hooks/queries/use-employee-queries'
import { getDownloadUrl, getFile } from '@/lib/api/file'
import { useAlert } from '@/components/common/ui'

// 파일 정보 인터페이스
interface FileInfo {
  id: number
  originalFileName: string
}

interface EmployeeDetailDataProps {
  employeeId?: number
}

export default function EmployeeDetailData({ employeeId }: EmployeeDetailDataProps) {
  const router = useRouter()
  const { alert, confirm } = useAlert()
  const [headerInfoOpen, setHeaderInfoOpen] = useState(true)
  const [loginInfoOpen, setLoginInfoOpen] = useState(true)
  const [careerInfoOpen, setCareerInfoOpen] = useState(true)
  const [certInfoOpen, setCertInfoOpen] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)
  // 파일 정보 상태 (파일명 표시용)
  const [fileInfos, setFileInfos] = useState<{
    residentRegistration?: FileInfo
    familyRelation?: FileInfo
    healthCheck?: FileInfo
    resume?: FileInfo
  }>({})

  // TanStack Query 훅들
  const {
    data: employee,
    isPending: isEmployeeLoading,
    error: employeeError
  } = useEmployeeDetail(employeeId)

  const { data: careersData } = useEmployeeCareers(employeeId ?? 0, !!employeeId)
  const { data: certificatesData } = useEmployeeCertificates(employeeId ?? 0, !!employeeId)
  const deleteEmployeeMutation = useDeleteEmployee()
  const sendEmailMutation = useSendEmployeeRegistrationEmail()

  const careers = careersData ?? []
  const certificates = certificatesData ?? []
  const loading = isEmployeeLoading
  const error = employeeError ? '직원 정보를 불러오는데 실패했습니다.' : null

  // 파일 정보 조회
  useEffect(() => {
    const fetchFileInfos = async () => {
      if (!employee) return

      const filePromises: Promise<void>[] = []
      const newFileInfos: typeof fileInfos = {}

      if (employee.residentRegistrationFileId) {
        filePromises.push(
          getFile(employee.residentRegistrationFileId)
            .then(file => { newFileInfos.residentRegistration = { id: file.id, originalFileName: file.originalFileName } })
            .catch(() => {})
        )
      }
      if (employee.familyRelationFileId) {
        filePromises.push(
          getFile(employee.familyRelationFileId)
            .then(file => { newFileInfos.familyRelation = { id: file.id, originalFileName: file.originalFileName } })
            .catch(() => {})
        )
      }
      if (employee.healthCheckFileId) {
        filePromises.push(
          getFile(employee.healthCheckFileId)
            .then(file => { newFileInfos.healthCheck = { id: file.id, originalFileName: file.originalFileName } })
            .catch(() => {})
        )
      }
      if (employee.resumeFileId) {
        filePromises.push(
          getFile(employee.resumeFileId)
            .then(file => { newFileInfos.resume = { id: file.id, originalFileName: file.originalFileName } })
            .catch(() => {})
        )
      }

      await Promise.all(filePromises)
      setFileInfos(newFileInfos)
    }

    fetchFileInfos()
  }, [employee])

  // 날짜 포맷 함수
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return dateString.split('T')[0]
  }

  const handleDelete = async () => {
    if (!employeeId) return

    if (await confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteEmployeeMutation.mutateAsync(employeeId)
        await alert('직원 정보가 삭제되었습니다.')
        router.push('/employee/info')
      } catch (err) {
        console.error('직원 삭제 실패:', err)
        await alert('직원 삭제에 실패했습니다.')
      }
    }
  }

  const handleList = () => {
    router.push('/employee/info')
  }

  const handleEdit = () => {
    router.push(`/employee/info/${employeeId}/edit`)
  }

  const handleCareerEdit = () => {
    router.push(`/employee/info/${employeeId}/career`)
  }

  const handleCertificateEdit = () => {
    router.push(`/employee/info/${employeeId}/certificate`)
  }

  const handleLoginEdit = () => {
    router.push(`/employee/info/${employeeId}/login`)
  }

  const handleSendRegistrationEmail = async () => {
    if (!employeeId) return

    if (!employee?.email) {
      await alert('직원의 이메일 주소가 없습니다.')
      return
    }

    if (!(await confirm('직원 회원 가입 요청 메일을 전송하시겠습니까?'))) {
      return
    }

    try {
      setSendingEmail(true)
      await sendEmailMutation.mutateAsync(employeeId)
      await alert('직원 회원 가입 요청 메일이 전송되었습니다.')
    } catch (err: unknown) {
      console.error('이메일 전송 실패:', err)
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || '이메일 전송에 실패했습니다.'
        : '이메일 전송에 실패했습니다.'
      await alert(errorMessage)
    } finally {
      setSendingEmail(false)
    }
  }

  // 파일 다운로드 핸들러
  const handleFileDownload = async (fileId: number | null | undefined, fileName: string) => {
    if (!fileId) return

    try {
      const response = await getDownloadUrl(fileId)
      // 새 탭에서 다운로드 URL 열기
      window.open(response.downloadUrl, '_blank')
    } catch (err) {
      console.error('파일 다운로드 URL 조회 실패:', err)
      await alert(`${fileName} 다운로드에 실패했습니다.`)
    }
  }

  if (loading) {
    return (
      <div className="master-detail-data">
        <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="master-detail-data">
        <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>{error}</div>
      </div>
    )
  }

  return (
    <div className="master-detail-data">
      {/* 상단 버튼 */}
      <div className="detail-top-btn" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
        <button className="btn-form gray" onClick={handleDelete}>삭제</button>
        <button className="btn-form basic" onClick={handleList}>목록</button>
      </div>

      {/* 직원 Header 정보 관리 */}
      <div className={`slidebox-wrap ${headerInfoOpen ? '' : 'close'}`}>
        <div className="slidebox-header">
          <h2>직원 Header 정보 관리</h2>
          <div className="slidebox-btn-wrap">
            <button className="slidebox-btn" onClick={handleEdit}>수정</button>
            <button className="slidebox-btn arr" onClick={() => setHeaderInfoOpen(!headerInfoOpen)}>
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
                    <th>근무 여부</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {employee?.workStatusName || employee?.workStatus || '-'}
                            {employee?.memo && <> | {employee.memo}</>}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>직원 개인 정보</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {employee?.employeeNumber || '-'} | {employee?.employeeName || '-'} | {employee?.positionName || employee?.position || '-'} | {formatDate(employee?.birthDate)} | {employee?.mobilePhone || '-'} | {employee?.email || '-'}
                          </span>
                        </li>
                        {(employee?.address || employee?.addressDetail) && (
                          <li className="detail-data-item">
                            <span className="detail-data-text">
                              {employee?.zipCode && `(${employee.zipCode}) `}{employee?.address || ''} {employee?.addressDetail || ''}
                            </span>
                          </li>
                        )}
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>근무처</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {employee?.headOfficeOrganizationName || '-'} | {employee?.franchiseOrganizationName || '-'} | {employee?.storeName || '-'}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>직원분류/계약분류</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {employee?.employeeClassificationName || employee?.employeeClassification || '-'} | {employee?.contractClassificationName || employee?.contractClassification || '-'}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>계좌 정보</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {employee?.salaryBank || '-'} | {employee?.salaryAccountNumber || '-'} | {employee?.salaryAccountHolder || '-'}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>주민등록등본</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          {employee?.residentRegistrationFileId ? (
                            <button
                              type="button"
                              onClick={() => handleFileDownload(employee.residentRegistrationFileId, '주민등록등본')}
                              style={{ color: '#dc3545', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              {fileInfos.residentRegistration?.originalFileName || '주민등록등본'}
                            </button>
                          ) : (
                            <span className="detail-data-text">-</span>
                          )}
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>가족관계증명서</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          {employee?.familyRelationFileId ? (
                            <button
                              type="button"
                              onClick={() => handleFileDownload(employee.familyRelationFileId, '가족관계증명서')}
                              style={{ color: '#dc3545', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              {fileInfos.familyRelation?.originalFileName || '가족관계증명서'}
                            </button>
                          ) : (
                            <span className="detail-data-text">-</span>
                          )}
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>건강진단결과서</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          {employee?.healthCheckFileId ? (
                            <button
                              type="button"
                              onClick={() => handleFileDownload(employee.healthCheckFileId, '건강진단결과서')}
                              style={{ color: '#dc3545', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              {fileInfos.healthCheck?.originalFileName || '건강진단결과서'}
                            </button>
                          ) : (
                            <span className="detail-data-text">-</span>
                          )}
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>건강진단결과서 만료일</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">{formatDate(employee?.healthCheckExpiryDate)}</span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>이력서</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          {employee?.resumeFileId ? (
                            <button
                              type="button"
                              onClick={() => handleFileDownload(employee.resumeFileId, '이력서')}
                              style={{ color: '#dc3545', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              {fileInfos.resume?.originalFileName || '이력서'}
                            </button>
                          ) : (
                            <span className="detail-data-text">-</span>
                          )}
                        </li>
                      </ul>
                    </td>
                  </tr>
                  {employee?.resignationDate && (
                    <tr>
                      <th>퇴사일</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">{formatDate(employee?.resignationDate)}</span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </AnimateHeight>
      </div>

      {/* 로그인 정보 및 권한 */}
      <div className={`slidebox-wrap ${loginInfoOpen ? '' : 'close'}`}>
        <div className="slidebox-header">
          <h2>로그인 정보 및 권한</h2>
          <div className="slidebox-btn-wrap">
            <button className="slidebox-btn" onClick={handleLoginEdit}>수정</button>
            <button className="slidebox-btn arr" onClick={() => setLoginInfoOpen(!loginInfoOpen)}>
              <i className="arr-icon"></i>
            </button>
          </div>
        </div>
        <AnimateHeight duration={300} height={loginInfoOpen ? 'auto' : 0}>
          <div className="slidebox-body">
            <div className="detail-data-wrap">
              <table className="detail-data-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                </colgroup>
                <tbody>
                  {employee?.memberId && (
                    <tr>
                      <th>로그인 ID 및 권한</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">
                              {employee?.memberLoginId || '-'} | {employee?.memberAuthorityNames?.length ? employee.memberAuthorityNames.join(', ') : '-'}
                            </span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <th>승인정보</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {employee?.memberId
                              ? `가입완료 | 가입일 : ${employee.memberCreatedAt?.split('T')[0] ?? '-'}`
                              : employee?.isEmailSend
                                ? `요청완료 | 요청일 : ${employee.emailSendDate?.split('T')[0] ?? '-'}`
                                : '가입요청전'
                            }
                            {' | '}
                          </span>
                          {!employee?.memberId && employee?.email && (
                            <button
                              className="detail-data-btn"
                              onClick={handleSendRegistrationEmail}
                              disabled={sendingEmail}
                            >
                              {sendingEmail ? '전송 중...' : '직원 회원 가입 요청 메일 전송'}
                            </button>
                          )}
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

      {/* 경력 정보 */}
      <div className={`slidebox-wrap ${careerInfoOpen ? '' : 'close'}`}>
        <div className="slidebox-header">
          <h2>경력 정보</h2>
          <div className="slidebox-btn-wrap">
            <button className="slidebox-btn" onClick={handleCareerEdit}>수정</button>
            <button className="slidebox-btn arr" onClick={() => setCareerInfoOpen(!careerInfoOpen)}>
              <i className="arr-icon"></i>
            </button>
          </div>
        </div>
        <AnimateHeight duration={300} height={careerInfoOpen ? 'auto' : 0}>
          <div className="slidebox-body">
            <div className="detail-data-wrap">
              <table className="detail-data-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                </colgroup>
                <tbody>
                  {careers.length > 0 ? (
                    careers.map((career, index) => (
                      <tr key={career.id}>
                        <th>경력 #{index + 1}</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">
                                {career.companyName} | {career.startDate}{career.endDate ? ` ~ ${career.endDate}` : ''} | {career.contractClassificationName || career.contractClassification || '-'}
                                {career.jobDescription && <> | <u>{career.jobDescription}</u></>}
                              </span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <th>경력</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">등록된 경력 정보가 없습니다.</span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </AnimateHeight>
      </div>

      {/* 자격증 정보 */}
      <div className={`slidebox-wrap ${certInfoOpen ? '' : 'close'}`}>
        <div className="slidebox-header">
          <h2>자격증 정보</h2>
          <div className="slidebox-btn-wrap">
            <button className="slidebox-btn" onClick={handleCertificateEdit}>수정</button>
            <button className="slidebox-btn arr" onClick={() => setCertInfoOpen(!certInfoOpen)}>
              <i className="arr-icon"></i>
            </button>
          </div>
        </div>
        <AnimateHeight duration={300} height={certInfoOpen ? 'auto' : 0}>
          <div className="slidebox-body">
            <div className="detail-data-wrap">
              <table className="detail-data-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                </colgroup>
                <tbody>
                  {certificates.length > 0 ? (
                    certificates.map((cert, index) => (
                      <tr key={cert.id}>
                        <th>자격증 #{index + 1}</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">
                                {cert.certificateName}
                                {cert.validityStartDate && cert.validityEndDate
                                  ? ` | ${cert.validityStartDate}~${cert.validityEndDate}`
                                  : ''}
                                {cert.acquisitionDate && ` | ${cert.acquisitionDate}`}
                                {cert.issuingOrganization && ` | ${cert.issuingOrganization}`}
                                {cert.certificateFileName && cert.certificateFileId && (
                                  <>
                                    {' | '}
                                    <button
                                      type="button"
                                      onClick={() => handleFileDownload(cert.certificateFileId, cert.certificateFileName || '')}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#0066cc',
                                        textDecoration: 'underline',
                                        cursor: 'pointer',
                                        padding: 0,
                                        font: 'inherit'
                                      }}
                                    >
                                      {cert.certificateFileName}
                                    </button>
                                  </>
                                )}
                              </span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <th>자격증</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">등록된 자격증 정보가 없습니다.</span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </AnimateHeight>
      </div>

      {/* 등록 및 수정 이력 */}
      <div className="detail-data-info-wrap">
        <table className="default-table">
          <colgroup>
            <col width="180px" />
            <col />
            <col width="180px" />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>등록일</th>
              <td>
                <div className="data-filed">
                  <input type="text" className="input-frame" value={formatDate(employee?.createdAt)} disabled />
                </div>
              </td>
              <th>최근수정일</th>
              <td>
                <div className="data-filed">
                  <input type="text" className="input-frame" value={formatDate(employee?.updatedAt)} disabled />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
