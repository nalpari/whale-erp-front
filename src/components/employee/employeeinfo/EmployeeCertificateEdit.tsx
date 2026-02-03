'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import DatePicker from '../../ui/common/DatePicker'
import {
  useEmployeeCertificates,
  useSaveEmployeeCertificatesWithFiles,
  useDeleteAllEmployeeCertificates
} from '@/hooks/queries/use-employee-queries'
import type { EmployeeCertificateItem } from '@/types/employee'

interface EmployeeCertificateEditProps {
  employeeId: number
}

interface CertificateFormItem extends EmployeeCertificateItem {
  tempId?: string  // 새 항목을 위한 임시 ID
  file?: File | null  // 새로 업로드할 파일
  existingFileName?: string | null  // 기존 파일명
}

export default function EmployeeCertificateEdit({ employeeId }: EmployeeCertificateEditProps) {
  const router = useRouter()
  const [sectionOpen, setSectionOpen] = useState(true)
  const [certificates, setCertificates] = useState<CertificateFormItem[]>([])

  // TanStack Query 훅들
  const { data: certificatesData, isPending: isCertificatesLoading } = useEmployeeCertificates(employeeId)
  const saveCertificatesMutation = useSaveEmployeeCertificatesWithFiles()
  const deleteAllCertificatesMutation = useDeleteAllEmployeeCertificates()

  const isLoading = isCertificatesLoading || saveCertificatesMutation.isPending || deleteAllCertificatesMutation.isPending

  // 자격증 데이터 초기화
  useEffect(() => {
    if (certificatesData && certificatesData.length > 0) {
      setCertificates(certificatesData.map(cert => ({
        id: cert.id,
        certificateName: cert.certificateName,
        validityStartDate: cert.validityStartDate ?? null,
        validityEndDate: cert.validityEndDate ?? null,
        acquisitionDate: cert.acquisitionDate,
        issuingOrganization: cert.issuingOrganization ?? null,
        certificateFileId: cert.certificateFileId ?? null,
        existingFileName: cert.certificateFileName ?? null
      })))
    } else if (certificatesData) {
      // 데이터가 없으면 빈 항목 하나 추가
      setCertificates([createEmptyCertificate()])
    }
  }, [certificatesData])

  // 빈 자격증 항목 생성
  const createEmptyCertificate = (): CertificateFormItem => ({
    tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    certificateName: '',
    validityStartDate: null,
    validityEndDate: null,
    acquisitionDate: '',
    issuingOrganization: null,
    certificateFileId: null
  })

  // 자격증 항목 추가
  const handleAddCertificate = () => {
    setCertificates(prev => [...prev, createEmptyCertificate()])
  }

  // 자격증 항목 삭제
  const handleRemoveCertificate = (index: number) => {
    if (certificates.length === 1) {
      // 마지막 항목이면 빈 항목으로 초기화
      setCertificates([createEmptyCertificate()])
      return
    }
    setCertificates(prev => prev.filter((_, i) => i !== index))
  }

  // 자격증 항목 값 변경
  const handleCertificateChange = (index: number, field: keyof CertificateFormItem, value: string | number | null) => {
    setCertificates(prev => prev.map((cert, i) =>
      i === index ? { ...cert, [field]: value } : cert
    ))
  }

  // 파일 선택 핸들러
  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setCertificates(prev => prev.map((cert, i) =>
      i === index ? { ...cert, file, existingFileName: file ? file.name : cert.existingFileName } : cert
    ))
  }

  // 파일 삭제 핸들러
  const handleFileRemove = (index: number) => {
    setCertificates(prev => prev.map((cert, i) =>
      i === index ? { ...cert, file: null, certificateFileId: null, existingFileName: null } : cert
    ))
    // input 초기화
    const inputElement = document.getElementById(`cert-file-${index}`) as HTMLInputElement
    if (inputElement) {
      inputElement.value = ''
    }
  }

  // 전체 삭제
  const handleDeleteAll = async () => {
    if (!confirm('모든 자격증 정보를 삭제하시겠습니까?')) {
      return
    }

    try {
      await deleteAllCertificatesMutation.mutateAsync(employeeId)
      setCertificates([createEmptyCertificate()])
      alert('모든 자격증 정보가 삭제되었습니다.')
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // 저장
  const handleSave = async () => {
    // 유효한 자격증 정보만 필터링 (자격증명이 있는 것만)
    const validCertificates = certificates.filter(cert => cert.certificateName.trim())

    if (validCertificates.length === 0) {
      alert('저장할 자격증 정보가 없습니다. 최소 하나의 자격증명을 입력해주세요.')
      return
    }

    // 필수값 검증
    for (let i = 0; i < validCertificates.length; i++) {
      const cert = validCertificates[i]
      if (!cert.acquisitionDate) {
        alert(`${i + 1}번째 자격증의 취득일을 입력해주세요.`)
        return
      }
    }

    try {
      // 파일 목록 수집 및 fileIndex 할당
      const files: File[] = []
      const certificatesToSave = validCertificates.map(cert => {
        let fileIndex: number | null = null

        // 새로 선택된 파일이 있으면 파일 목록에 추가하고 인덱스 할당
        if (cert.file) {
          fileIndex = files.length
          files.push(cert.file)
        }

        return {
          id: cert.id ?? undefined,
          certificateName: cert.certificateName,
          validityStartDate: cert.validityStartDate,
          validityEndDate: cert.validityEndDate,
          acquisitionDate: cert.acquisitionDate,
          issuingOrganization: cert.issuingOrganization,
          certificateFileId: cert.file ? null : cert.certificateFileId,  // 새 파일이 있으면 기존 fileId는 null
          fileIndex
        }
      })

      await saveCertificatesMutation.mutateAsync({
        employeeInfoId: employeeId,
        data: { certificates: certificatesToSave },
        files
      })
      alert('저장되었습니다.')
      router.push(`/employee/info/${employeeId}`)
    } catch (error) {
      console.error('저장 실패:', error)
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('저장 중 오류가 발생했습니다.')
      }
    }
  }

  const handleCancel = () => {
    router.push(`/employee/info/${employeeId}`)
  }

  return (
    <div className="master-detail-data">
      {/* 자격증 정보 */}
      <div className={`slidebox-wrap ${sectionOpen ? '' : 'close'}`}>
        <div className="slidebox-header">
          <h2>자격증 정보</h2>
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
            {certificates.map((cert, index) => (
              <div key={cert.id ?? cert.tempId} style={{ marginBottom: index < certificates.length - 1 ? '24px' : 0 }}>
                <table className="default-table">
                  <colgroup>
                    <col width="190px" />
                    <col />
                  </colgroup>
                  <tbody>
                    {/* 자격증명 */}
                    <tr>
                      <th>
                        자격증명 <span className="red">*</span>
                      </th>
                      <td>
                        <div className="filed-flx">
                          <div className="mx-400">
                            <input
                              type="text"
                              className="input-frame"
                              value={cert.certificateName}
                              onChange={(e) => handleCertificateChange(index, 'certificateName', e.target.value)}
                              placeholder="자격증명을 입력하세요"
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                            <button
                              type="button"
                              className="btn-form basic"
                              onClick={handleAddCertificate}
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
                              onClick={() => handleRemoveCertificate(index)}
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

                    {/* 유효기간 */}
                    <tr>
                      <th>유효기간</th>
                      <td>
                        <div className="filed-flx">
                          <div className="date-picker-wrap">
                            <DatePicker
                              value={cert.validityStartDate ? new Date(cert.validityStartDate) : null}
                              onChange={(date) => handleCertificateChange(index, 'validityStartDate', date ? date.toISOString().split('T')[0] : null)}
                              placeholder="시작일"
                            />
                          </div>
                          <span style={{ margin: '0 8px' }}>~</span>
                          <div className="date-picker-wrap">
                            <DatePicker
                              value={cert.validityEndDate ? new Date(cert.validityEndDate) : null}
                              onChange={(date) => handleCertificateChange(index, 'validityEndDate', date ? date.toISOString().split('T')[0] : null)}
                              placeholder="종료일"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* 취득일 */}
                    <tr>
                      <th>
                        취득일 <span className="red">*</span>
                      </th>
                      <td>
                        <div className="date-picker-wrap">
                          <DatePicker
                            value={cert.acquisitionDate ? new Date(cert.acquisitionDate) : null}
                            onChange={(date) => handleCertificateChange(index, 'acquisitionDate', date ? date.toISOString().split('T')[0] : null)}
                            placeholder="취득일 선택"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* 발급기관 */}
                    <tr>
                      <th>발급기관</th>
                      <td>
                        <div className="mx-400">
                          <input
                            type="text"
                            className="input-frame"
                            value={cert.issuingOrganization ?? ''}
                            onChange={(e) => handleCertificateChange(index, 'issuingOrganization', e.target.value || null)}
                            placeholder="발급기관을 입력하세요"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* 자격증 파일 */}
                    <tr>
                      <th>자격증 파일</th>
                      <td>
                        <div className="filed-flx">
                          <div className="filed-file">
                            <input
                              type="file"
                              className="file-input"
                              id={`cert-file-${index}`}
                              onChange={(e) => handleFileChange(index, e)}
                              accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.hwp,.hwpx,.txt"
                            />
                            <label htmlFor={`cert-file-${index}`} className="btn-form outline s">
                              파일찾기
                            </label>
                          </div>
                          {(cert.file || cert.existingFileName) && (
                            <div className="file-uploaded" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                              <span className="file-name-text" style={{ color: '#333' }}>
                                {cert.file?.name || cert.existingFileName}
                              </span>
                              <button
                                type="button"
                                className="btn-form outline s"
                                onClick={() => handleFileRemove(index)}
                                style={{
                                  minWidth: '28px',
                                  width: '28px',
                                  height: '28px',
                                  padding: '0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#dc3545',
                                  borderColor: '#dc3545',
                                  fontWeight: 'bold'
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {index < certificates.length - 1 && (
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
