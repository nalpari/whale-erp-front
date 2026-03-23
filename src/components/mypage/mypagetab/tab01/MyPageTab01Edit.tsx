'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useAlert } from '@/components/common/ui'
import AddressSearch, { type AddressData } from '@/components/common/ui/AddressSearch'
import ImageUpload, { type ImageItem } from '@/components/common/ui/ImageUpload'
import { useCommonCodeHierarchy } from '@/hooks/queries/use-common-code-queries'
import { useUpdateBp } from '@/hooks/queries/use-bp-queries'
import { useAuthStore } from '@/stores/auth-store'
import { getErrorMessage } from '@/lib/api'
import type { BpDetailResponse, BpFormData } from '@/types/bp'

const AVATAR_OPTIONS = ['1', '2', '3', '4'] as const

const getAvatarSrc = (value: string) =>
  `/assets/images/ui/avatar0${value}.svg`

interface MyPageTab01EditProps {
  bp: BpDetailResponse
  setEditMode: (editMode: boolean) => void
}

/** BP 상세를 폼 데이터로 변환 */
const mapBpToForm = (bp: BpDetailResponse): BpFormData => ({
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

/** 기존 LNB 로고를 ImageItem으로 변환 */
const mapBpToLogoImages = (bp: BpDetailResponse): ImageItem[] =>
  bp.lnbLogoExpandFile
    ? [{ id: bp.lnbLogoExpandFile.id, name: bp.lnbLogoExpandFile.originalFileName, url: bp.lnbLogoExpandFile.publicUrl }]
    : []

/**
 * 사업자정보 수정 폼.
 * - BpForm.tsx 패턴을 참고하여 검증/저장을 구현한다.
 * - key={bp.id}로 리마운트하여 React Compiler 규칙을 준수한다.
 */
export default function MyPageTab01Edit({ bp, setEditMode }: MyPageTab01EditProps) {
  const { alert, confirm } = useAlert()
  const { avatar, loginId, name: userName, mobilePhone, setUserInfo } = useAuthStore()

  // 폼 상태
  const [form, setForm] = useState<BpFormData>(() => mapBpToForm(bp))
  const [selectedAvatar, setSelectedAvatar] = useState<string>(String(avatar || AVATAR_OPTIONS[0]))
  const [expandLogoImages, setExpandLogoImages] = useState<ImageItem[]>(() => mapBpToLogoImages(bp))
  const [expandLogoFile, setExpandLogoFile] = useState<File | undefined>()
  const [deleteExpandFileId, setDeleteExpandFileId] = useState<number | undefined>()
  const [errors, setErrors] = useState<Record<string, string>>({})

  // API hooks
  const { mutateAsync: updateBp } = useUpdateBp()

  // 공통코드
  const { data: bpTypeCodes = [] } = useCommonCodeHierarchy('BPTYP')

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
  }

  // 주소 데이터 (form에서 파생)
  const address: AddressData = { address: form.address1, addressDetail: form.address2 }

  // 주소 변경
  const handleAddressChange = (data: AddressData) => {
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

  // 검증
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.companyName.trim()) newErrors.companyName = '회사명을 입력해 주세요.'
    if (!form.businessRegistrationNumber.trim()) {
      newErrors.businessRegistrationNumber = '사업자등록번호를 입력해 주세요.'
    } else if (!/^\d{10}$/.test(form.businessRegistrationNumber)) {
      newErrors.businessRegistrationNumber = '사업자등록번호는 10자리 숫자만 입력 가능합니다.'
    }
    if (!form.address1.trim()) newErrors.address1 = '주소를 입력해 주세요.'
    if (!form.representativeMobilePhone.trim()) {
      newErrors.representativeMobilePhone = '휴대폰번호를 입력해 주세요.'
    } else if (!/^01[016789]\d{7,8}$/.test(form.representativeMobilePhone)) {
      newErrors.representativeMobilePhone = '휴대폰번호 형식이 올바르지 않습니다. (예: 01012345678)'
    }
    if (!form.representativeEmail.trim()) {
      newErrors.representativeEmail = '이메일을 입력해 주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.representativeEmail)) {
      newErrors.representativeEmail = '이메일 형식이 올바르지 않습니다.'
    }
    if (!form.bpType) newErrors.bpType = 'BP 타입을 선택해 주세요.'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 저장
  const handleSave = async () => {
    if (!validate()) return

    const confirmed = await confirm('수정하시겠습니까?')
    if (!confirmed) return

    try {
      await updateBp({
        id: bp.id,
        data: form,
        lnbLogoExpandFile: expandLogoFile,
        deleteLnbLogoExpandFileId: deleteExpandFileId,
      })
      // 아바타 변경 시 auth store 업데이트
      setUserInfo(loginId ?? '', userName ?? '', mobilePhone ?? '', selectedAvatar)
      await alert('수정되었습니다.')
      setEditMode(false)
    } catch (error) {
      await alert(getErrorMessage(error, '수정에 실패했습니다.'))
    }
  }

  return (
    <div className="mypage-frame-wrap">
      <div className="mypage-frame-tit">
        <h2>사업자정보 수정</h2>
      </div>
      <div className="mypage-frame-content">
        <table className="default-table">
          <colgroup>
            <col width="190px" />
            <col />
          </colgroup>
          <tbody>
            {/* 아이콘 선택 */}
            <tr>
              <th>아이콘<span className="red">*</span></th>
              <td>
                <div className="select-avatar">
                  {AVATAR_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`avatar-btn${selectedAvatar === value ? ' check' : ''}`}
                      onClick={() => setSelectedAvatar(value)}
                    >
                      <Image src={getAvatarSrc(value)} alt="avatar" width={46} height={46} />
                    </button>
                  ))}
                </div>
              </td>
            </tr>

            {/* 대표자명 (읽기전용) */}
            <tr>
              <th>대표자명</th>
              <td>
                <div className="mx-500">
                  <input
                    type="text"
                    className="input-frame"
                    readOnly
                    value={form.representativeName}
                  />
                </div>
              </td>
            </tr>

            {/* 회사명 */}
            <tr>
              <th>회사명 <span className="red">*</span></th>
              <td>
                <div className="filed-flx">
                  <div className="mx-500">
                    <input
                      type="text"
                      className={`input-frame${errors.companyName ? ' err' : ''}`}
                      value={form.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                    />
                  </div>
                  <span className="explain">{bp.organizationCode}</span>
                </div>
                {errors.companyName && <div className="warning-txt mt5">* {errors.companyName}</div>}
              </td>
            </tr>

            {/* 브랜드명 */}
            <tr>
              <th>브랜드명</th>
              <td>
                <div className="mx-500">
                  <input
                    type="text"
                    className="input-frame"
                    value={form.brandName}
                    onChange={(e) => handleChange('brandName', e.target.value)}
                  />
                </div>
              </td>
            </tr>

            {/* 사업자등록번호 */}
            <tr>
              <th>사업자등록번호<span className="red">*</span></th>
              <td>
                <div className="filed-flx">
                  <div className="mx-500">
                    <input
                      type="text"
                      className={`input-frame${errors.businessRegistrationNumber ? ' err' : ''}`}
                      value={form.businessRegistrationNumber}
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, '')
                        handleChange('businessRegistrationNumber', onlyDigits)
                      }}
                      maxLength={10}
                    />
                  </div>
                  <span className="explain">※ 숫자만 허용</span>
                </div>
                {errors.businessRegistrationNumber && (
                  <div className="warning-txt mt5">* {errors.businessRegistrationNumber}</div>
                )}
              </td>
            </tr>

            {/* 주소 */}
            <tr>
              <th>주소<span className="red">*</span></th>
              <td>
                <AddressSearch
                  value={address}
                  onChange={handleAddressChange}
                  error={!!errors.address1}
                  helpText={errors.address1}
                />
              </td>
            </tr>

            {/* 휴대폰 번호 */}
            <tr>
              <th>휴대폰 번호<span className="red">*</span></th>
              <td>
                <div className="filed-flx">
                  <div className="mx-500">
                    <input
                      type="text"
                      className={`input-frame${errors.representativeMobilePhone ? ' err' : ''}`}
                      value={form.representativeMobilePhone}
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, '')
                        handleChange('representativeMobilePhone', onlyDigits)
                      }}
                      maxLength={11}
                    />
                  </div>
                  <span className="explain">※ 숫자만 허용</span>
                </div>
                {errors.representativeMobilePhone && (
                  <div className="warning-txt mt5">* {errors.representativeMobilePhone}</div>
                )}
              </td>
            </tr>

            {/* 이메일 */}
            <tr>
              <th>이메일 <span className="red">*</span></th>
              <td>
                <div className="mx-500">
                  <input
                    type="text"
                    className={`input-frame${errors.representativeEmail ? ' err' : ''}`}
                    value={form.representativeEmail}
                    onChange={(e) => handleChange('representativeEmail', e.target.value)}
                  />
                </div>
                {errors.representativeEmail && (
                  <div className="warning-txt mt5">* {errors.representativeEmail}</div>
                )}
              </td>
            </tr>

            {/* BP 타입 */}
            <tr>
              <th>BP 타입<span className="red">*</span></th>
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

            {/* LNB 로고 */}
            <tr>
              <th>LNB 로고</th>
              <td>
                <ImageUpload
                  images={expandLogoImages}
                  onAdd={handleExpandLogoAdd}
                  onRemove={handleExpandLogoRemove}
                  accept="image/*"
                  guideText="로고 이미지를 등록하시면 로그인 했을 때 로고를 상단(네비게이션 바)에 표시할 수 있습니다."
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mypage-footer">
        <button className="btn-form gray" onClick={() => setEditMode(false)}>취소</button>
        <button className="btn-form basic" onClick={handleSave}>저장</button>
      </div>
    </div>
  )
}
