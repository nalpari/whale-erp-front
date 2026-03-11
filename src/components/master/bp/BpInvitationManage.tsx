'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Location from '@/components/ui/Location'
import { Input, useAlert } from '@/components/common/ui'
import DatePicker from '@/components/ui/common/DatePicker'
import { useOperatingHeadOffices, useInviteFranchise } from '@/hooks/queries'
import type { BpInvitationFormData } from '@/types/bp'

const BUSINESS_VALIDATE_URL = 'https://api.odcloud.kr/api/nts-businessman/v1/validate'
const BUSINESS_VALIDATE_KEY = 'AsoOkjYzxLNpwF0ZK5rGPOIX5cp3e4Kp3P9A5VkILMZdy2Cx7Rwt5%2FB2qqLbmD%2FtEt38CvjYKB8ElFeRhFfrfQ%3D%3D'

const initialForm: BpInvitationFormData = {
  headOfficeId: null,
  businessRegistrationNumber: '',
  startDate: '',
  representativeName: '',
  representativeMobilePhone: '',
  representativeEmail: '',
}

const formatDateToYYYYMMDD = (date: Date | null): string => {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

const BpInvitationManage = () => {
  const router = useRouter()
  const { alert } = useAlert()

  const [form, setForm] = useState<BpInvitationFormData>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isVerified, setIsVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [startDateValue, setStartDateValue] = useState<Date | null>(null)

  const { data: headOffices = [] } = useOperatingHeadOffices()
  const { mutateAsync: inviteFranchise } = useInviteFranchise()

  const selectedOfficeName = useMemo(() => {
    if (!form.headOfficeId) return ''
    return headOffices.find((o) => o.id === form.headOfficeId)?.companyName ?? ''
  }, [form.headOfficeId, headOffices])

  const handleChange = useCallback((field: keyof BpInvitationFormData, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    if (field === 'businessRegistrationNumber' || field === 'representativeName') {
      setIsVerified(false)
    }
  }, [])

  const handleStartDateChange = useCallback((date: Date | null) => {
    setStartDateValue(date)
    setForm((prev) => ({ ...prev, startDate: formatDateToYYYYMMDD(date) }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next['startDate']
      return next
    })
    setIsVerified(false)
  }, [])

  const validateVerification = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.businessRegistrationNumber || !/^\d{10}$/.test(form.businessRegistrationNumber)) {
      newErrors.businessRegistrationNumber = '사업자등록번호는 10자리 숫자입니다'
    }
    if (!form.startDate) {
      newErrors.startDate = '개업일자를 입력해주세요'
    }
    if (!form.representativeName.trim()) {
      newErrors.representativeName = '대표자명을 입력해주세요'
    }
    setErrors((prev) => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }, [form.businessRegistrationNumber, form.startDate, form.representativeName])

  const handleVerify = useCallback(async () => {
    if (!validateVerification()) return

    setVerifying(true)
    try {
      const response = await axios.post(
        `${BUSINESS_VALIDATE_URL}?serviceKey=${BUSINESS_VALIDATE_KEY}`,
        {
          businesses: [
            {
              b_no: form.businessRegistrationNumber,
              start_dt: form.startDate,
              p_nm: form.representativeName,
            },
          ],
        }
      )

      const result = response.data?.data?.[0]
      if (result?.valid === '01') {
        setIsVerified(true)
        setErrors((prev) => {
          const next = { ...prev }
          delete next['businessRegistrationNumber']
          delete next['verification']
          return next
        })
      } else {
        setIsVerified(false)
        setErrors((prev) => ({
          ...prev,
          verification: '유효한 사업자등록번호가 아닙니다',
        }))
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        verification: '사업자등록번호 인증에 실패했습니다. 잠시 후 다시 시도해주세요.',
      }))
    } finally {
      setVerifying(false)
    }
  }, [form.businessRegistrationNumber, form.startDate, form.representativeName, validateVerification])

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.headOfficeId) {
      newErrors.headOfficeId = '본사를 선택해주세요'
    }
    if (!form.businessRegistrationNumber || !/^\d{10}$/.test(form.businessRegistrationNumber)) {
      newErrors.businessRegistrationNumber = '사업자등록번호는 10자리 숫자입니다'
    }
    if (!isVerified) {
      newErrors.verification = '사업자등록번호 인증이 필요합니다'
    }
    if (!form.startDate) {
      newErrors.startDate = '개업일자를 입력해주세요'
    }
    if (!form.representativeName.trim()) {
      newErrors.representativeName = '대표자명을 입력해주세요'
    }
    if (!form.representativeMobilePhone || !/^01[016789]\d{7,8}$/.test(form.representativeMobilePhone)) {
      newErrors.representativeMobilePhone = '유효한 휴대폰 번호를 입력해주세요'
    }
    if (!form.representativeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.representativeEmail)) {
      newErrors.representativeEmail = '유효한 이메일 주소를 입력해주세요'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form, isVerified])

  const handleSubmit = useCallback(async () => {
    if (!validate()) return

    try {
      await inviteFranchise({
        id: form.headOfficeId!,
        businessRegistrationNumber: form.businessRegistrationNumber,
        representativeName: form.representativeName,
        representativeMobilePhone: form.representativeMobilePhone,
        representativeEmail: form.representativeEmail,
      })
      await alert('가맹점 초대가 완료되었습니다.')
      router.push('/master/bp')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message ?? '가맹점 초대에 실패했습니다.'
        await alert(msg)
      }
    }
  }, [form, validate, inviteFranchise, alert, router])

  return (
    <div className="data-wrap">
      <Location title="가맹점 초대" list={['Home', '파트너 정보 관리', '가맹점 초대']} />
      <div className="invitation-form">
        <div className="invitation-form-header">
          <div className="invitation-select-tit">본사</div>
          <div className="invitation-select-box">
            <select
              className={`select-form ${errors.headOfficeId ? 'err' : ''}`}
              value={form.headOfficeId ?? ''}
              onChange={(e) => handleChange('headOfficeId', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">선택</option>
              {headOffices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.companyName}
                </option>
              ))}
            </select>
            {errors.headOfficeId && <div className="invitation-warning">{errors.headOfficeId}</div>}
          </div>
        </div>
        <div className="invitation-form-content">
          <div className="invitation-cont-guide">
            <div className="invitation-cont-tit">가맹점을 WHALE ERP로 초대하시겠습니까?</div>
            <div className="invitation-guide-desc">
              <span>
                초대된 사업자가 가맹점으로 가입하면 {selectedOfficeName ? <i>{selectedOfficeName}</i> : '본사'}님의
                가맹점으로 등록됩니다.
              </span>
              <span>
                가맹점으로 등록된 사업자는 {selectedOfficeName || '본사'}님의 메뉴, 가격, 카테고리 등 정보를 공유 받을 수
                있습니다.
              </span>
              <span>{selectedOfficeName || '본사'}님은 가맹점으로 초대된 사업자의 ERP 활동 내역을 조회할 수 있습니다.</span>
            </div>
          </div>
          <div className="invitation-cont-form">
            <div className="invitation-cont-tit">초대하고자 하는 사업자의 정보를 입력하세요.</div>
            <table className="default-table">
              <colgroup>
                <col width="160px" />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th>
                    대표자 성명 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="invitation-flx">
                      <div className="invitation-input">
                        <Input
                          placeholder="대표자명 입력"
                          value={form.representativeName}
                          onChange={(e) => handleChange('representativeName', e.target.value)}
                          showClear
                          onClear={() => handleChange('representativeName', '')}
                          error={!!errors.representativeName}
                        />
                      </div>
                      <div className="invitation-explain">※ 사업자등록증 상의 대표자명을 입력해 주세요.</div>
                      {errors.representativeName && (
                        <div className="invitation-warning">{errors.representativeName}</div>
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>
                    개업일자 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="invitation-flx">
                      <div className="invitation-input">
                        <DatePicker
                          value={startDateValue}
                          onChange={handleStartDateChange}
                          placeholder="개업일자 선택"
                          error={!!errors.startDate}
                        />
                      </div>
                      <div className="invitation-explain">※ 사업자등록증 상의 개업일자를 입력해 주세요.</div>
                      {errors.startDate && <div className="invitation-warning">{errors.startDate}</div>}
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>
                    사업자등록번호 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="invitation-flx">
                      <div className="invitation-input">
                        <Input
                          placeholder="숫자만 입력 (10자리)"
                          value={form.businessRegistrationNumber}
                          onChange={(e) => handleChange('businessRegistrationNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          showClear
                          onClear={() => handleChange('businessRegistrationNumber', '')}
                          maxLength={10}
                          disabled={isVerified}
                          error={!!errors.businessRegistrationNumber || !!errors.verification}
                        />
                      </div>
                      <div className="invitation-btn">
                        <button
                          className="btn-form outline s"
                          onClick={handleVerify}
                          type="button"
                          disabled={verifying || isVerified}
                        >
                          {verifying ? '인증중...' : isVerified ? '인증완료' : '인증하기'}
                        </button>
                      </div>
                      {errors.businessRegistrationNumber && (
                        <div className="invitation-warning">{errors.businessRegistrationNumber}</div>
                      )}
                      {errors.verification && (
                        <div className="invitation-warning">{errors.verification}</div>
                      )}
                      {isVerified && !errors.verification && (
                        <div className="invitation-explain" style={{ color: '#2563eb' }}>※ 인증이 완료되었습니다.</div>
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>
                    대표자 휴대폰 번호 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="invitation-flx">
                      <div className="invitation-input">
                        <Input
                          placeholder="숫자만 입력"
                          value={form.representativeMobilePhone}
                          onChange={(e) => handleChange('representativeMobilePhone', e.target.value.replace(/\D/g, '').slice(0, 11))}
                          showClear
                          onClear={() => handleChange('representativeMobilePhone', '')}
                          maxLength={11}
                          error={!!errors.representativeMobilePhone}
                        />
                      </div>
                      <div className="invitation-explain">※ 대표자님의 휴대폰 번호를 입력해 주세요.</div>
                      {errors.representativeMobilePhone && (
                        <div className="invitation-warning">{errors.representativeMobilePhone}</div>
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>
                    대표자 이메일 주소 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="invitation-flx">
                      <div className="invitation-input">
                        <Input
                          placeholder="이메일 주소 입력"
                          value={form.representativeEmail}
                          onChange={(e) => handleChange('representativeEmail', e.target.value)}
                          showClear
                          onClear={() => handleChange('representativeEmail', '')}
                          error={!!errors.representativeEmail}
                        />
                      </div>
                      <div className="invitation-explain">※ 대표자님의 이메일 주소를 입력해 주세요.</div>
                      {errors.representativeEmail && (
                        <div className="invitation-warning">{errors.representativeEmail}</div>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="invitation-cont-guide">
            <div className="invitation-guide-desc">
              <span>초대 이메일을 발송합니다.</span>
              <span>초대 이메일에 기재된 BUSINESS PARTNER 번호를 입력하고 회원가입을 하십시오.</span>
            </div>
          </div>
        </div>
        <div className="invitation-form-footer">
          <button className="btn-form gray" onClick={() => router.push('/master/bp')} type="button">
            취소
          </button>
          <button className="btn-form basic" onClick={handleSubmit} type="button">
            초대하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default BpInvitationManage
