'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import Location from '@/components/ui/Location'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { useAlert, Input } from '@/components/common/ui'
import ImageUpload, { type ImageItem } from '@/components/common/ui/ImageUpload'
import AddressSearch, { type AddressData } from '@/components/common/ui/AddressSearch'
import SearchSelect from '@/components/ui/common/SearchSelect'
import { useBpDetail, useCommonCodeHierarchy, useOperatingHeadOffices } from '@/hooks/queries'
import { useCreateBp, useUpdateBp } from '@/hooks/queries/use-bp-queries'
import api, { getErrorMessage } from '@/lib/api'
import type { BpFormData } from '@/types/bp'

interface BpFormProps {
  id?: number
}

const INITIAL_FORM: BpFormData = {
  bpoprType: 'BPOPR_001',
  pfType: '',
  masterId: '',
  companyName: '',
  brandName: '',
  businessRegistrationNumber: '',
  address1: '',
  address2: '',
  representativeName: '',
  representativeMobilePhone: '',
  representativeEmail: '',
  bpType: '',
  pfSaveRequest: [],
}

const INITIAL_ADDRESS: AddressData = {
  address: '',
  addressDetail: '',
}

const BpForm = ({ id }: BpFormProps) => {
  const router = useRouter()
  const { alert, confirm } = useAlert()
  const isEditMode = !!id

  const [slideboxOpen, setSlideboxOpen] = useState(true)
  const [form, setForm] = useState<BpFormData>(INITIAL_FORM)
  const [address, setAddress] = useState<AddressData>(INITIAL_ADDRESS)
  const [expandLogoImages, setExpandLogoImages] = useState<ImageItem[]>([])
  const [contractLogoImages, setContractLogoImages] = useState<ImageItem[]>([])
  const [expandLogoFile, setExpandLogoFile] = useState<File | undefined>()
  const [contractLogoFile, setContractLogoFile] = useState<File | undefined>()
  const [deleteExpandFileId, setDeleteExpandFileId] = useState<number | undefined>()
  const [deleteContractFileId, setDeleteContractFileId] = useState<number | undefined>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [masterIdCheckMessage, setMasterIdCheckMessage] = useState('')
  const [initialized, setInitialized] = useState(!isEditMode)

  // API hooks
  const { data: bp, isPending } = useBpDetail(id)
  const { mutateAsync: createBp } = useCreateBp()
  const { mutateAsync: updateBp } = useUpdateBp()

  // 공통코드
  const { data: bpoprCodes = [] } = useCommonCodeHierarchy('BPOPR')
  const { data: pfCodes = [] } = useCommonCodeHierarchy('PF')
  const { data: bpTypeCodes = [] } = useCommonCodeHierarchy('BPTYP')

  // 본사 목록 (Partner Function용)
  const { data: headOffices = [] } = useOperatingHeadOffices()

  // 수정 모드: 기존 데이터 초기화
  if (isEditMode && bp && !initialized) {
    setForm({
      bpoprType: bp.bpoprType,
      pfType: bp.pfType,
      masterId: bp.masterId ?? '',
      companyName: bp.companyName ?? '',
      brandName: bp.brandName ?? '',
      businessRegistrationNumber: bp.businessRegistrationNumber ?? '',
      address1: bp.address1 ?? '',
      address2: bp.address2 ?? '',
      representativeName: bp.representativeName ?? '',
      representativeMobilePhone: bp.representativeMobilePhone ?? '',
      representativeEmail: bp.representativeEmail ?? '',
      bpType: bp.bpType ?? '',
      pfSaveRequest: bp.pfList?.map((pf) => ({
        id: pf.id,
        organizationId: pf.bpId,
        partnerBusinessPartnerId: pf.partnerBpId,
      })) ?? [],
    })
    setAddress({
      address: bp.address1 ?? '',
      addressDetail: bp.address2 ?? '',
    })
    if (bp.lnbLogoExpandFile) {
      setExpandLogoImages([{ id: bp.lnbLogoExpandFile.id, name: bp.lnbLogoExpandFile.originalFileName, url: bp.lnbLogoExpandFile.publicUrl }])
    }
    if (bp.lnbLogoContractFile) {
      setContractLogoImages([{ id: bp.lnbLogoContractFile.id, name: bp.lnbLogoContractFile.originalFileName, url: bp.lnbLogoContractFile.publicUrl }])
    }
    setInitialized(true)
  }

  const isFranchise = form.pfType === 'PF_002'
  const isHeadOffice = form.pfType === 'PF_001'

  // 본사 옵션 (SearchSelect용)
  const headOfficeOptions = headOffices.map((ho) => ({
    value: String(ho.id),
    label: `${ho.companyName} (${ho.organizationCode})`,
  }))
  const selectedHeadOffice = headOfficeOptions.find(
    (opt) => opt.value === String(form.pfSaveRequest[0]?.partnerBusinessPartnerId ?? '')
  ) ?? null

  const locationTitle = isEditMode ? 'Business Partner 수정' : 'Business Partner 등록'
  const breadcrumbs = ['Home', '파트너 정보 관리', locationTitle]

  // 폼 필드 변경
  const handleChange = (field: keyof BpFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
    if (field === 'masterId' && masterIdCheckMessage) {
      setMasterIdCheckMessage('')
    }
  }

  // 주소 변경
  const handleAddressChange = (data: AddressData) => {
    setAddress(data)
    setForm((prev) => ({
      ...prev,
      address1: data.address,
      address2: data.addressDetail,
    }))
    if (errors.address1) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.address1
        return next
      })
    }
  }

  // pfType 변경 시 pfSaveRequest 초기화
  const handlePfTypeChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      pfType: value,
      pfSaveRequest: [],
    }))
    if (errors.pfType) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.pfType
        return next
      })
    }
  }

  // Partner Function: 본사 선택
  const handlePartnerBpChange = (partnerBpId: string) => {
    const bpId = partnerBpId ? Number(partnerBpId) : null
    setForm((prev) => ({
      ...prev,
      pfSaveRequest: bpId ? [{ partnerBusinessPartnerId: bpId }] : [],
    }))
  }

  // Master ID 중복 확인
  const handleCheckMasterId = async () => {
    if (!form.masterId || !form.masterId.trim()) {
      setErrors((prev) => ({ ...prev, masterId: 'Master ID를 입력해 주세요.' }))
      return
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(form.masterId)) {
      setErrors((prev) => ({ ...prev, masterId: 'ID가 올바르지 않습니다.' }))
      return
    }
    try {
      const response = await api.get(`/api/auth/check-login-id`, {
        params: { loginId: form.masterId },
      })
      const { available, message } = response.data.data
      if (available) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next.masterId
          return next
        })
        setMasterIdCheckMessage(message ?? '사용 가능한 Master ID입니다.')
      } else {
        setMasterIdCheckMessage('')
        setErrors((prev) => ({ ...prev, masterId: message ?? '이미 사용 중인 Master ID입니다.' }))
      }
    } catch (error) {
      setMasterIdCheckMessage('')
      setErrors((prev) => ({ ...prev, masterId: getErrorMessage(error, '중복 확인에 실패했습니다.') }))
    }
  }

  // LNB 로고 이미지 핸들러
  const handleExpandLogoAdd = (files: File[]) => {
    const file = files[0]
    const existingId = expandLogoImages[0]?.id
    if (existingId) setDeleteExpandFileId(Number(existingId))
    setExpandLogoFile(file)
    setExpandLogoImages([{ name: file.name, file }])
  }
  const handleExpandLogoRemove = (_index: number) => {
    const existingId = expandLogoImages[0]?.id
    if (existingId) setDeleteExpandFileId(Number(existingId))
    setExpandLogoFile(undefined)
    setExpandLogoImages([])
  }
  const handleContractLogoAdd = (files: File[]) => {
    const file = files[0]
    const existingId = contractLogoImages[0]?.id
    if (existingId) setDeleteContractFileId(Number(existingId))
    setContractLogoFile(file)
    setContractLogoImages([{ name: file.name, file }])
  }
  const handleContractLogoRemove = (_index: number) => {
    const existingId = contractLogoImages[0]?.id
    if (existingId) setDeleteContractFileId(Number(existingId))
    setContractLogoFile(undefined)
    setContractLogoImages([])
  }

  // 검증
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.bpoprType) newErrors.bpoprType = '운영여부를 선택해 주세요.'
    if (!form.pfType) newErrors.pfType = '대표 Partner Function을 선택해 주세요.'
    if (!isEditMode) {
      if (!form.masterId || !form.masterId.trim()) {
        newErrors.masterId = 'Master ID를 입력해 주세요.'
      } else if (!/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(form.masterId)) {
        newErrors.masterId = 'ID가 올바르지 않습니다.'
      }
    }
    if (!form.companyName.trim()) newErrors.companyName = '업체명을 입력해 주세요.'
    if (!form.businessRegistrationNumber.trim()) {
      newErrors.businessRegistrationNumber = '사업자등록번호를 입력해 주세요.'
    } else if (!/^\d{10}$/.test(form.businessRegistrationNumber)) {
      newErrors.businessRegistrationNumber = '사업자등록번호는 10자리 숫자만 입력 가능합니다.'
    }
    if (!form.address1.trim()) newErrors.address1 = '주소를 입력해 주세요.'
    if (!form.representativeName.trim()) newErrors.representativeName = '대표자명을 입력해 주세요.'
    if (!form.representativeMobilePhone.trim()) {
      newErrors.representativeMobilePhone = '대표자 휴대폰번호를 입력해 주세요.'
    } else if (!/^01[016789]\d{7,8}$/.test(form.representativeMobilePhone)) {
      newErrors.representativeMobilePhone = '휴대폰번호 형식이 올바르지 않습니다. (예: 01012345678)'
    }
    if (!form.representativeEmail.trim()) {
      newErrors.representativeEmail = '대표자 이메일을 입력해 주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.representativeEmail)) {
      newErrors.representativeEmail = '이메일 형식이 올바르지 않습니다.'
    }
    if (!form.bpType) newErrors.bpType = 'BP 타입을 선택해 주세요.'
    if (isFranchise && form.pfSaveRequest.length === 0) {
      newErrors.partnerBp = '본사를 선택해 주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 저장
  const handleSave = async () => {
    if (!validate()) return

    const confirmed = await confirm(isEditMode ? '수정하시겠습니까?' : '등록하시겠습니까?')
    if (!confirmed) return

    try {
      if (isEditMode) {
        await updateBp({
          id: id!,
          data: form,
          lnbLogoExpandFile: expandLogoFile,
          lnbLogoContractFile: contractLogoFile,
          deleteLnbLogoExpandFileId: deleteExpandFileId,
          deleteLnbLogoContractFileId: deleteContractFileId,
        })
        await alert('수정되었습니다.')
        router.push(`/master/bp/${id}`)
      } else {
        const result = await createBp({
          data: form,
          lnbLogoExpandFile: expandLogoFile,
          lnbLogoContractFile: contractLogoFile,
        })
        await alert('등록되었습니다.')
        router.push(`/master/bp/${result.id}`)
      }
    } catch (error) {
      await alert(getErrorMessage(error, isEditMode ? '수정에 실패했습니다.' : '등록에 실패했습니다.'))
    }
  }

  // 로딩 상태
  if (isEditMode && isPending) {
    return (
      <div className="data-wrap">
        <Location title={locationTitle} list={breadcrumbs} />
        <div className="cube-loader-overlay"><CubeLoader /></div>
      </div>
    )
  }

  if (isEditMode && !bp) {
    return (
      <div className="data-wrap">
        <Location title={locationTitle} list={breadcrumbs} />
        <div className="empty-wrap"><div className="empty-data">데이터를 찾을 수 없습니다.</div></div>
      </div>
    )
  }

  return (
    <div className="data-wrap">
      <Location title={locationTitle} list={breadcrumbs} />
      <div className="master-detail-data">
        <div className={`slidebox-wrap ${slideboxOpen ? '' : 'close'}`}>
          <div className="slidebox-header">
            <h2>Business Partner 정보</h2>
            <div className="slidebox-btn-wrap">
              <button className="slidebox-btn" onClick={handleSave}>저장</button>
              <button className="slidebox-btn" onClick={() => router.back()}>목록</button>
              <button className="slidebox-btn arr" onClick={() => setSlideboxOpen(!slideboxOpen)}>
                <i className="arr-icon"></i>
              </button>
            </div>
          </div>
          <AnimateHeight duration={300} height={slideboxOpen ? 'auto' : 0}>
            <div className="slidebox-body">
              {/* 운영여부 + 대표 PF */}
              <table className="default-table">
                <colgroup>
                  <col width="190px" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th>운영여부 <span className="red">*</span></th>
                    <td>
                      <div className="radio-wrap">
                        {bpoprCodes.map((code) => (
                          <button
                            key={code.code}
                            type="button"
                            className={`radio-btn${form.bpoprType === code.code ? ' act' : ''}`}
                            onClick={() => handleChange('bpoprType', code.code)}
                          >
                            {code.name}
                          </button>
                        ))}
                      </div>
                      {errors.bpoprType && <div className="warning-txt mt5">* {errors.bpoprType}</div>}
                    </td>
                  </tr>
                  <tr>
                    <th>대표 Partner Function <span className="red">*</span></th>
                    <td>
                      <div className="mx-500">
                        <select
                          className="select-form"
                          value={form.pfType}
                          onChange={(e) => handlePfTypeChange(e.target.value)}
                        >
                          <option value="">선택</option>
                          {pfCodes.map((code) => (
                            <option key={code.code} value={code.code}>{code.name}</option>
                          ))}
                        </select>
                      </div>
                      {errors.pfType && <div className="warning-txt mt5">* {errors.pfType}</div>}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Business Partner 정보 */}
              <div className="slide-table-wrap">
                <h3>Business Partner 정보</h3>
                <table className="default-table">
                  <colgroup>
                    <col width="190px" />
                    <col />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>Master ID{!isEditMode && <> <span className="red">*</span></>}</th>
                      <td>
                        {isEditMode ? (
                          <Input
                            value={bp?.masterId ?? '-'}
                            readOnly
                          />
                        ) : (
                          <Input
                            value={form.masterId}
                            onChange={(e) => handleChange('masterId', e.target.value)}
                            showClear
                            onClear={() => handleChange('masterId', '')}
                            placeholder="Master ID를 입력하세요"
                            error={!!errors.masterId}
                            helpText={errors.masterId || masterIdCheckMessage}
                            endAdornment={
                              <>
                                <button type="button" className="btn-form outline s" onClick={handleCheckMasterId}>중복 확인</button>
                                <span className="explain">※ 영문, 숫자 포함 8자 이상 입력</span>
                              </>
                            }
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>업체명 <span className="red">*</span></th>
                      <td>
                        <Input
                          value={form.companyName}
                          onChange={(e) => handleChange('companyName', e.target.value)}
                          showClear
                          onClear={() => handleChange('companyName', '')}
                          placeholder="업체명을 입력하세요"
                          error={!!errors.companyName}
                          helpText={errors.companyName}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>브랜드명</th>
                      <td>
                        <Input
                          value={form.brandName}
                          onChange={(e) => handleChange('brandName', e.target.value)}
                          showClear
                          onClear={() => handleChange('brandName', '')}
                          placeholder="브랜드명을 입력하세요"
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>사업자등록번호 <span className="red">*</span></th>
                      <td>
                        <Input
                          type="number"
                          value={form.businessRegistrationNumber}
                          onChange={(e) => handleChange('businessRegistrationNumber', e.target.value)}
                          showClear
                          onClear={() => handleChange('businessRegistrationNumber', '')}
                          placeholder="사업자등록번호 10자리"
                          maxLength={10}
                          error={!!errors.businessRegistrationNumber}
                          helpText={errors.businessRegistrationNumber}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>주소 <span className="red">*</span></th>
                      <td>
                        <AddressSearch
                          value={address}
                          onChange={handleAddressChange}
                          error={!!errors.address1}
                          helpText={errors.address1}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>대표자명 <span className="red">*</span></th>
                      <td>
                        <Input
                          value={form.representativeName}
                          onChange={(e) => handleChange('representativeName', e.target.value)}
                          showClear
                          onClear={() => handleChange('representativeName', '')}
                          placeholder="대표자명을 입력하세요"
                          error={!!errors.representativeName}
                          helpText={errors.representativeName}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>대표자 휴대폰번호 <span className="red">*</span></th>
                      <td>
                        <Input
                          type="cellphone"
                          value={form.representativeMobilePhone}
                          onChange={(e) => handleChange('representativeMobilePhone', e.target.value)}
                          showClear
                          onClear={() => handleChange('representativeMobilePhone', '')}
                          placeholder="010-0000-0000"
                          error={!!errors.representativeMobilePhone}
                          helpText={errors.representativeMobilePhone}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>대표자 이메일 <span className="red">*</span></th>
                      <td>
                        <Input
                          type="email"
                          value={form.representativeEmail}
                          onChange={(e) => handleChange('representativeEmail', e.target.value)}
                          showClear
                          onClear={() => handleChange('representativeEmail', '')}
                          placeholder="이메일을 입력하세요"
                          error={!!errors.representativeEmail}
                          helpText={errors.representativeEmail}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>BP 타입 <span className="red">*</span></th>
                      <td>
                        <div className="mx-500">
                          <select
                            className={`select-form${errors.bpType ? ' err' : ''}`}
                            value={form.bpType}
                            onChange={(e) => handleChange('bpType', e.target.value)}
                          >
                            <option value="">선택</option>
                            {bpTypeCodes.map((code) => (
                              <option key={code.code} value={code.code}>{code.name}</option>
                            ))}
                          </select>
                        </div>
                        {errors.bpType && <div className="warning-txt mt5">* {errors.bpType}</div>}
                      </td>
                    </tr>
                    <tr>
                      <th>LNB 로고 (확장)</th>
                      <td>
                        <ImageUpload
                          images={expandLogoImages}
                          onAdd={handleExpandLogoAdd}
                          onRemove={handleExpandLogoRemove}
                          accept="image/*"
                          guideText="확장 로고 이미지를 업로드하세요."
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>LNB 로고 (축소)</th>
                      <td>
                        <ImageUpload
                          images={contractLogoImages}
                          onAdd={handleContractLogoAdd}
                          onRemove={handleContractLogoRemove}
                          accept="image/*"
                          guideText="축소 로고 이미지를 업로드하세요."
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Partner Function */}
              <div className="slide-table-wrap">
                <h3>Partner Function</h3>
                <table className="default-table">
                  <colgroup>
                    <col width="190px" />
                    <col />
                  </colgroup>
                  <tbody>
                    {isFranchise && (
                      <tr>
                        <th>본사 <span className="red">*</span></th>
                        <td>
                          <div className="mx-500">
                            <SearchSelect
                              options={headOfficeOptions}
                              value={selectedHeadOffice}
                              onChange={(opt) => handlePartnerBpChange(opt?.value ?? '')}
                              placeholder="본사 선택"
                              isClearable
                              isSearchable
                              error={!!errors.partnerBp}
                            />
                          </div>
                          {errors.partnerBp && <div className="warning-txt mt5">* {errors.partnerBp}</div>}
                        </td>
                      </tr>
                    )}
                    {isHeadOffice && (
                      <tr>
                        <th>가맹점</th>
                        <td>
                          <Input value="-" readOnly />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimateHeight>
        </div>
      </div>
    </div>
  )
}

export default BpForm
