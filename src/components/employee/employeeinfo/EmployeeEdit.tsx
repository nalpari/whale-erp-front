'use client'
import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import DatePicker from '../../ui/common/DatePicker'
import { Tooltip } from 'react-tooltip'
import {
  useEmployeeDetail,
  useCheckEmployeeNumber,
  useUpdateEmployee,
  useMemberDocuments
} from '@/hooks/queries/use-employee-queries'
import { useEmployeeInfoSettings } from '@/hooks/queries/use-employee-settings-queries'
import { useStoreOptions, useBpHeadOfficeTree } from '@/hooks/queries'
import { useAuthStore } from '@/stores/auth-store'
import { Input, AddressSearch, type AddressData, useAlert } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import type { ClassificationItem } from '@/lib/api/employeeInfoSettings'
import type { UpdateEmployeeInfoRequest } from '@/types/employee'

// 에러 상태 타입
interface FormErrors {
  employeeName?: string
  employeeClassification?: string
  contractClassification?: string
  hireDate?: string
  mobilePhone?: string
  email?: string
  address?: string
  accountNumber?: string
  accountHolder?: string
}

interface EmployeeEditProps {
  employeeId?: number
}

export default function EmployeeEdit({ employeeId }: EmployeeEditProps) {
  const router = useRouter()
  const { alert } = useAlert()
  const [headerInfoOpen, setHeaderInfoOpen] = useState(true)
  const [workplaceType, setWorkplaceType] = useState<'headquarters' | 'franchise'>('headquarters')
  const [workStatus, setWorkStatus] = useState<'working' | 'leave' | 'retired'>('working')
  const [tempSaveEnabled, setTempSaveEnabled] = useState(true)
  const [selectedIcon, setSelectedIcon] = useState(0)
  const [employeeNumberChecked, setEmployeeNumberChecked] = useState(false)
  const [employeeNumberValid, setEmployeeNumberValid] = useState(false)
  const [originalEmployeeNumber, setOriginalEmployeeNumber] = useState<string | null>(null) // DB에서 조회한 원래 사번

  // 폼 검증 시도 여부 (저장 버튼 클릭 후)
  const [isValidationAttempted, setIsValidationAttempted] = useState(false)

  // 주소 상태 (AddressSearch 컴포넌트용)
  const [addressData, setAddressData] = useState<AddressData>({
    address: '',
    addressDetail: '',
    zonecode: '',
  })

  // TanStack Query 훅들
  const { data: employeeData, isPending: isEmployeeLoading } = useEmployeeDetail(employeeId)
  const memberId = employeeData?.memberId ?? null
  const { data: documentsData } = useMemberDocuments(memberId)
  const checkEmployeeNumberMutation = useCheckEmployeeNumber()
  const updateEmployeeMutation = useUpdateEmployee()

  const isLoading = isEmployeeLoading || checkEmployeeNumberMutation.isPending || updateEmployeeMutation.isPending

  // 서류는 직원 앱에서만 등록/수정 가능 (ERP에서는 읽기 전용)

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    headOfficeOrganizationId: '',
    franchiseOrganizationId: '',
    storeId: '',
    employeeName: '',
    employeeCode: '',
    employeeNumber: '',
    birthDate: '',
    employeeClassification: '',
    contractClassification: '',
    rank: '',  // 직급
    position: '',  // 직책
    hireDate: '',
    resignationDate: '',
    resignationReason: '',
    mobilePhone: '',
    emergencyContact: '',
    email: '',
    zipCode: '',
    address: '',
    addressDetail: '',
    bankCode: '',
    accountNumber: '',
    accountHolder: '',
    memo: ''
  })


  // 직원 정보로 폼 초기화 (렌더링 중 처리)
  // 캐시 히트 시에도 초기화되도록 초기값을 null로 설정
  const [prevEmployeeDataId, setPrevEmployeeDataId] = useState<number | null>(null)
  if (employeeData && employeeData.id !== prevEmployeeDataId) {
    setPrevEmployeeDataId(employeeData.id)
    const employee = employeeData

    // workplaceType 설정
    if (employee.workplaceType === 'HEAD_OFFICE') {
      setWorkplaceType('headquarters')
    } else {
      setWorkplaceType('franchise')
    }

    // workStatus 설정
    if (employee.workStatus === 'WORKING' || employee.workStatusName === '근무') {
      setWorkStatus('working')
    } else if (employee.workStatus === 'LEAVE' || employee.workStatusName === '휴직') {
      setWorkStatus('leave')
    } else if (employee.workStatus === 'RETIRED' || employee.workStatusName === '퇴사') {
      setWorkStatus('retired')
    }

    // formData 설정
    setFormData(prev => ({
      ...prev,
      headOfficeOrganizationId: employee.headOfficeOrganizationId?.toString() || '',
      franchiseOrganizationId: employee.franchiseOrganizationId?.toString() || '',
      storeId: employee.storeId?.toString() || '',
      employeeName: employee.employeeName || '',
      employeeNumber: employee.employeeNumber || '',
      birthDate: employee.birthDate || '',
      mobilePhone: employee.mobilePhone || '',
      emergencyContact: employee.emergencyContact || '',
      email: employee.email || '',
      zipCode: employee.zipCode || '',
      address: employee.address || '',
      addressDetail: employee.addressDetail || '',
      employeeClassification: employee.employeeClassification || '',
      contractClassification: employee.contractClassification || '',
      rank: employee.rank || '',
      position: employee.position || '',
      hireDate: employee.hireDate || '',
      resignationDate: employee.resignationDate || '',
      resignationReason: employee.resignationReason || '',
      bankCode: employee.salaryBank || '',
      accountNumber: employee.salaryAccountNumber || '',
      accountHolder: employee.salaryAccountHolder || '',
      memo: employee.memo || ''
    }))

    // 아이콘 타입 설정
    if (employee.iconType !== null && employee.iconType !== undefined) {
      setSelectedIcon(employee.iconType)
    }

    // DB에서 조회한 원래 사번 저장 (수정 불가 판단용)
    if (employee.employeeNumber) {
      setOriginalEmployeeNumber(employee.employeeNumber)
    }

    // 주소 데이터 초기화
    setAddressData({
      address: employee.address || '',
      addressDetail: employee.addressDetail || '',
      zonecode: employee.zipCode || '',
    })
  }

  // 건강진단결과서 만료일 초기화 (documentsData가 로드되면)

  // 에러 상태 계산 (useMemo로 최적화)
  const formErrors = useMemo<FormErrors>(() => {
    if (!isValidationAttempted) return {}

    const errors: FormErrors = {}

    if (!formData.employeeName.trim()) {
      errors.employeeName = '직원명을 입력해주세요.'
    }

    if (!formData.employeeClassification) {
      errors.employeeClassification = '직원 분류를 선택해주세요.'
    }

    if (!formData.contractClassification) {
      errors.contractClassification = '계약 분류를 선택해주세요.'
    }

    if (!formData.hireDate) {
      errors.hireDate = '입사일을 선택해주세요.'
    }

    if (!formData.mobilePhone.trim()) {
      errors.mobilePhone = '휴대폰 번호를 입력해주세요.'
    } else if (formData.mobilePhone.trim().length < 10) {
      errors.mobilePhone = '휴대폰 번호를 정확히 입력해주세요.'
    }

    if (!formData.email.trim()) {
      errors.email = '이메일 주소를 입력해주세요.'
    }

    if (!addressData.address) {
      errors.address = '주소를 입력해주세요.'
    }

    if (!formData.accountNumber.trim()) {
      errors.accountNumber = '급여 계좌번호를 입력해주세요.'
    }

    if (!formData.accountHolder.trim()) {
      errors.accountHolder = '예금주를 입력해주세요.'
    }

    return errors
  }, [isValidationAttempted, formData, addressData.address])

  // 주소 변경 핸들러 (AddressSearch 컴포넌트용)
  const handleAddressChange = useCallback((data: AddressData) => {
    setAddressData(data)
    setFormData(prev => ({
      ...prev,
      zipCode: data.zonecode || '',
      address: data.address,
      addressDetail: data.addressDetail,
    }))
  }, [])

  // TanStack Query로 직원분류/직급/직책 설정 조회
  const headOfficeId = formData.headOfficeOrganizationId ? parseInt(formData.headOfficeOrganizationId) : null
  const franchiseId = formData.franchiseOrganizationId ? parseInt(formData.franchiseOrganizationId) : null

  const { data: settingsData } = useEmployeeInfoSettings(
    headOfficeId
      ? { headOfficeId, franchiseId: franchiseId ?? undefined }
      : undefined,
    !!headOfficeId
  )

  // 점포 옵션 조회
  const { data: storeOptionList = [] } = useStoreOptions(headOfficeId, franchiseId)

  // BP 트리 기반 동적 옵션
  const { accessToken, affiliationId } = useAuthStore()
  const isReady = Boolean(accessToken && affiliationId)
  const { data: bpTree = [] } = useBpHeadOfficeTree(isReady)

  const headOfficeSelectOptions: SelectOption[] = useMemo(() =>
    bpTree.map((office) => ({ value: String(office.id), label: office.name })),
    [bpTree]
  )

  const franchiseSelectOptions: SelectOption[] = useMemo(() => {
    const officeIdNum = formData.headOfficeOrganizationId ? parseInt(formData.headOfficeOrganizationId) : null
    if (!officeIdNum) return []
    const office = bpTree.find((o) => o.id === officeIdNum)
    return office?.franchises.map((f) => ({ value: String(f.id), label: f.name })) ?? []
  }, [bpTree, formData.headOfficeOrganizationId])

  const storeSelectOptions: SelectOption[] = useMemo(() =>
    storeOptionList.map(store => ({
      value: store.id.toString(),
      label: store.storeName
    })),
    [storeOptionList]
  )

  const employeeClassSelectOptions: SelectOption[] = useMemo(() => {
    const employeeClassificationOptions: ClassificationItem[] = settingsData?.codeMemoContent?.EMPLOYEE || []
    return [
      { value: '', label: '선택' },
      ...employeeClassificationOptions.map(item => ({
        value: item.code,
        label: item.name
      }))
    ]
  }, [settingsData?.codeMemoContent?.EMPLOYEE])

  const contractClassSelectOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '선택' },
    { value: 'CNTCF_001', label: '정직원' },
    { value: 'CNTCF_002', label: '계약직' },
    { value: 'CNTCF_003', label: '수습' },
    { value: 'CNTCF_004', label: '파트타이머' }
  ], [])

  const rankSelectOptions: SelectOption[] = useMemo(() => {
    const rankOptions: ClassificationItem[] = settingsData?.codeMemoContent?.RANK || []
    return [
      { value: '', label: '선택' },
      ...rankOptions.map(item => ({
        value: item.code,
        label: item.name
      }))
    ]
  }, [settingsData?.codeMemoContent?.RANK])

  const positionSelectOptions: SelectOption[] = useMemo(() => {
    const positionOptions: ClassificationItem[] = settingsData?.codeMemoContent?.POSITION || []
    return [
      { value: '', label: '선택' },
      ...positionOptions.map(item => ({
        value: item.code,
        label: item.name
      }))
    ]
  }, [settingsData?.codeMemoContent?.POSITION])

  const bankSelectOptions: SelectOption[] = useMemo(() => [
    { value: 'woori', label: '우리은행' },
    { value: 'kb', label: '국민은행' },
    { value: 'shinhan', label: '신한은행' },
    { value: 'hana', label: '하나은행' }
  ], [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 사번이 변경되면 중복확인 상태 초기화
    if (field === 'employeeNumber') {
      setEmployeeNumberChecked(false)
      setEmployeeNumberValid(false)
    }
  }

  // 사번 중복 확인
  const handleCheckEmployeeNumber = async () => {
    // 1. 사번 입력 검증
    if (!formData.employeeNumber.trim()) {
      await alert('사번을 입력해주세요.')
      return
    }

    // 2. 본사 선택 검증 (필수)
    if (!formData.headOfficeOrganizationId) {
      await alert('본사를 선택해주세요.')
      return
    }

    // 3. 가맹점 근무자인 경우 가맹점 선택 검증
    if (workplaceType === 'franchise' && !formData.franchiseOrganizationId) {
      await alert('가맹점을 선택해주세요.')
      return
    }

    try {
      const result = await checkEmployeeNumberMutation.mutateAsync({
        employeeNumber: formData.employeeNumber,
        headOfficeOrganizationId: Number(formData.headOfficeOrganizationId),
        franchiseOrganizationId: formData.franchiseOrganizationId ? Number(formData.franchiseOrganizationId) : undefined,
        storeId: formData.storeId ? Number(formData.storeId) : undefined
      })
      setEmployeeNumberChecked(true)

      if (result.isDuplicate) {
        setEmployeeNumberValid(false)
        await alert('이미 사용 중인 사번입니다.')
      } else {
        setEmployeeNumberValid(true)
        await alert('사용 가능한 사번입니다.')
      }
    } catch (error) {
      console.error('사번 중복 확인 실패:', error)
      await alert('사번 중복 확인 중 오류가 발생했습니다.')
    }
  }

  // 저장
  const handleSave = async () => {
    // 검증 시도 상태 설정 (에러 표시 활성화)
    setIsValidationAttempted(true)

    // 필수값 검증 - 에러가 있으면 저장하지 않음
    const errors: FormErrors = {}

    if (!formData.employeeName.trim()) {
      errors.employeeName = '직원명을 입력해주세요.'
    }

    if (!formData.employeeClassification) {
      errors.employeeClassification = '직원 분류를 선택해주세요.'
    }

    if (!formData.contractClassification) {
      errors.contractClassification = '계약 분류를 선택해주세요.'
    }

    if (!formData.hireDate) {
      errors.hireDate = '입사일을 선택해주세요.'
    }

    if (!formData.mobilePhone.trim()) {
      errors.mobilePhone = '휴대폰 번호를 입력해주세요.'
    } else if (formData.mobilePhone.trim().length < 10) {
      errors.mobilePhone = '휴대폰 번호를 정확히 입력해주세요.'
    }

    if (!formData.email.trim()) {
      errors.email = '이메일 주소를 입력해주세요.'
    }

    if (!addressData.address) {
      errors.address = '주소를 입력해주세요.'
    }

    if (!formData.accountNumber.trim()) {
      errors.accountNumber = '급여 계좌번호를 입력해주세요.'
    }

    if (!formData.accountHolder.trim()) {
      errors.accountHolder = '예금주를 입력해주세요.'
    }

    // 에러가 있으면 저장하지 않음
    if (Object.keys(errors).length > 0) {
      return
    }

    if (!employeeId) {
      await alert('직원 ID가 없습니다.')
      return
    }

    try {
      const workStatusMap: Record<string, string> = {
        working: 'EMPWK_001',  // 근무
        leave: 'EMPWK_002',    // 휴직
        retired: 'EMPWK_003'   // 퇴사
      }

      const updateData: UpdateEmployeeInfoRequest = {
        // 사번 (기존에 사번이 없는 경우에만 전송)
        employeeNumber: !originalEmployeeNumber && formData.employeeNumber ? formData.employeeNumber : undefined,
        // 근무 상태
        workStatus: workStatusMap[workStatus] || null,
        // 개인 정보
        birthDate: formData.birthDate || null,
        mobilePhone: formData.mobilePhone || null,
        emergencyContact: formData.emergencyContact || null,
        email: formData.email || null,
        // 주소 정보
        zipCode: addressData.zonecode || null,
        address: addressData.address || null,
        addressDetail: addressData.addressDetail || null,
        // 분류 정보
        employeeClassification: formData.employeeClassification || null,
        contractClassification: formData.contractClassification || null,
        rank: formData.rank || null,
        position: formData.position || null,
        // 입퇴사 정보
        hireDate: formData.hireDate,  // 필수값
        resignationDate: formData.resignationDate || null,
        resignationReason: formData.resignationReason || null,
        // 급여 정보
        salaryBank: formData.bankCode || null,
        salaryAccountNumber: formData.accountNumber || null,
        salaryAccountHolder: formData.accountHolder || null,
        // 기타
        memo: formData.memo || null,
        iconType: selectedIcon
      }

      // 직원 기본 정보 저장
      await updateEmployeeMutation.mutateAsync({
        id: employeeId,
        data: updateData,
      })

      // 서류는 직원 앱에서만 등록/수정 가능 (ERP에서는 읽기 전용)

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

  const icons = ['👤', '👩', '👨', '👧']

  return (
    <div className="master-detail-data">
      {/* 직원 Header 정보 관리 */}
      <div className={`slidebox-wrap ${headerInfoOpen ? '' : 'close'}`}>
        <div className="slidebox-header">
          <h2>직원 Header 정보 관리</h2>
          <div className="slidebox-btn-wrap">
            <div className="toggle-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
              <span style={{ fontSize: '13px' }}>임시저장</span>
              <div className="toggle-btn">
                <input
                  type="checkbox"
                  id="temp-save-toggle"
                  checked={tempSaveEnabled}
                  onChange={() => setTempSaveEnabled(!tempSaveEnabled)}
                />
                <label className="slider" htmlFor="temp-save-toggle"></label>
              </div>
            </div>
            <button className="slidebox-btn" onClick={handleCancel}>
              취소
            </button>
            <button className="slidebox-btn" onClick={handleSave} disabled={isLoading}>
              {isLoading ? '저장 중...' : '저장'}
            </button>
            <button className="slidebox-btn arr" onClick={() => setHeaderInfoOpen(!headerInfoOpen)}>
              <i className="arr-icon"></i>
            </button>
          </div>
        </div>
        <AnimateHeight duration={300} height={headerInfoOpen ? 'auto' : 0}>
          <div className="slidebox-body">
            <table className="default-table">
              <colgroup>
                <col width="190px" />
                <col />
              </colgroup>
              <tbody>
                {/* 근무처 선택 (수정 불가) */}
                <tr>
                  <th>
                    근무처 선택 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="filed-check-flx">
                      <button
                        type="button"
                        className={`btn-form ${workplaceType === 'headquarters' ? 'basic' : 'outline'}`}
                        disabled
                        style={{ minWidth: '80px' }}
                      >
                        본사
                      </button>
                      <button
                        type="button"
                        className={`btn-form ${workplaceType === 'franchise' ? 'basic' : 'outline'}`}
                        disabled
                        style={{ minWidth: '80px' }}
                      >
                        가맹점
                      </button>
                    </div>
                  </td>
                </tr>

                {/* 본사/가맹점 (수정 불가) */}
                <tr>
                  <th>
                    {workplaceType === 'franchise' ? '본사/가맹점' : '본사'} <span className="red">*</span>
                  </th>
                  <td>
                    <div className="filed-flx">
                      <div className="mx-300">
                        <SearchSelect
                          options={headOfficeSelectOptions}
                          value={headOfficeSelectOptions.find(opt => opt.value === formData.headOfficeOrganizationId) || null}
                          onChange={() => {}}
                          placeholder="본사 선택"
                          isDisabled={true}
                        />
                      </div>
                      {workplaceType === 'franchise' && (
                        <div className="mx-300">
                          <SearchSelect
                            options={franchiseSelectOptions}
                            value={franchiseSelectOptions.find(opt => opt.value === formData.franchiseOrganizationId) || null}
                            onChange={() => {}}
                            placeholder="가맹점 선택"
                            isDisabled={true}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* 점포 선택 (수정 불가) */}
                <tr>
                  <th>점포 선택</th>
                  <td>
                    <div className="mx-500">
                      <SearchSelect
                        options={storeSelectOptions}
                        value={storeSelectOptions.find(opt => opt.value === formData.storeId) || null}
                        onChange={() => {}}
                        placeholder="점포"
                        isDisabled={true}
                      />
                    </div>
                  </td>
                </tr>

                {/* 직원명/사번 */}
                <tr>
                  <th>
                    직원명/사번 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="filed-flx">
                      <Input
                        value={formData.employeeName}
                        onChange={(e) => handleInputChange('employeeName', e.target.value)}
                        placeholder="직원명"
                        error={!!formErrors.employeeName}
                        showClear
                        onClear={() => handleInputChange('employeeName', '')}
                        containerClassName="mx-300"
                      />
                      <Input
                        value={formData.employeeNumber}
                        onChange={(e) => handleInputChange('employeeNumber', e.target.value)}
                        placeholder="사번"
                        disabled={!!originalEmployeeNumber}
                        containerClassName="mx-200"
                      />
                      {!originalEmployeeNumber && (
                        <button
                          className="btn-form outline s"
                          onClick={handleCheckEmployeeNumber}
                          disabled={isLoading}
                        >
                          {isLoading ? '확인 중...' : '사번 중복 확인'}
                        </button>
                      )}
                      {employeeNumberChecked && (
                        <span style={{ color: employeeNumberValid ? '#28a745' : '#dc3545', fontSize: '13px' }}>
                          {employeeNumberValid ? '✓ 사용 가능' : '✗ 사용 불가'}
                        </span>
                      )}
                    </div>
                    {formErrors.employeeName && (
                      <div className="warning-txt mt5" role="alert">* {formErrors.employeeName}</div>
                    )}
                  </td>
                </tr>

                {/* 근무 여부 */}
                <tr>
                  <th>
                    근무 여부 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="filed-check-flx">
                      <button
                        type="button"
                        className={`btn-form ${workStatus === 'working' ? 'basic' : 'outline'}`}
                        onClick={() => setWorkStatus('working')}
                        style={{ minWidth: '80px' }}
                      >
                        근무
                      </button>
                      <button
                        type="button"
                        className={`btn-form ${workStatus === 'leave' ? 'basic' : 'outline'}`}
                        onClick={() => setWorkStatus('leave')}
                        style={{ minWidth: '80px' }}
                      >
                        휴직
                      </button>
                      <button
                        type="button"
                        className={`btn-form ${workStatus === 'retired' ? 'basic' : 'outline'}`}
                        onClick={() => setWorkStatus('retired')}
                        style={{ minWidth: '80px' }}
                      >
                        퇴사
                      </button>
                    </div>
                  </td>
                </tr>

                {/* 생년월일 */}
                <tr>
                  <th>생년월일</th>
                  <td>
                    <div className="date-picker-wrap">
                      <DatePicker
                        value={formData.birthDate ? new Date(formData.birthDate) : null}
                        onChange={(date) => handleInputChange('birthDate', date ? date.toISOString().split('T')[0] : '')}
                        placeholder="생년월일 선택"
                      />
                    </div>
                  </td>
                </tr>

                {/* 직원 분류 */}
                <tr>
                  <th>
                    직원 분류 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="filed-flx">
                      <div className="mx-300">
                        <SearchSelect
                          options={employeeClassSelectOptions}
                          value={employeeClassSelectOptions.find(opt => opt.value === formData.employeeClassification) || null}
                          onChange={(opt) => handleInputChange('employeeClassification', opt?.value || '')}
                          placeholder="선택"
                        />
                      </div>
                      <button
                        className="btn-form outline s"
                        type="button"
                        onClick={() => router.push('/employee/employee-settings')}
                      >
                        분류설정
                      </button>
                      <span className="tooltip-icon" id="employee-class-tooltip">ⓘ</span>
                      <Tooltip className="tooltip-txt" anchorSelect="#employee-class-tooltip">
                        <div>직원 분류에 대한 설명입니다.</div>
                      </Tooltip>
                    </div>
                    {formErrors.employeeClassification && (
                      <div className="warning-txt mt5" role="alert">* {formErrors.employeeClassification}</div>
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
                        value={contractClassSelectOptions.find(opt => opt.value === formData.contractClassification) || null}
                        onChange={(opt) => handleInputChange('contractClassification', opt?.value || '')}
                        placeholder="정직원"
                      />
                    </div>
                    {formErrors.contractClassification && (
                      <div className="warning-txt mt5" role="alert">* {formErrors.contractClassification}</div>
                    )}
                  </td>
                </tr>

                {/* 직급 / 직책 */}
                <tr>
                  <th>직급 / 직책</th>
                  <td>
                    <div className="filed-flx">
                      <div className="mx-200">
                        <SearchSelect
                          options={rankSelectOptions}
                          value={rankSelectOptions.find(opt => opt.value === formData.rank) || null}
                          onChange={(opt) => handleInputChange('rank', opt?.value || '')}
                          placeholder="선택"
                        />
                      </div>
                      <div className="mx-200">
                        <SearchSelect
                          options={positionSelectOptions}
                          value={positionSelectOptions.find(opt => opt.value === formData.position) || null}
                          onChange={(opt) => handleInputChange('position', opt?.value || '')}
                          placeholder="선택"
                        />
                      </div>
                      <button
                        className="btn-form outline s"
                        type="button"
                        onClick={() => router.push('/employee/employee-settings?tab=rank')}
                      >
                        분류설정
                      </button>
                      <span className="tooltip-icon" id="position-tooltip">ⓘ</span>
                      <Tooltip className="tooltip-txt" anchorSelect="#position-tooltip">
                        <div>직급/직책에 대한 설명입니다.</div>
                      </Tooltip>
                    </div>
                  </td>
                </tr>

                {/* 입사일 */}
                <tr>
                  <th>
                    입사일 <span className="red">*</span>
                  </th>
                  <td>
                    <div className={`date-picker-wrap${formErrors.hireDate ? ' has-error' : ''}`}>
                      <DatePicker
                        value={formData.hireDate ? new Date(formData.hireDate) : null}
                        onChange={(date) => handleInputChange('hireDate', date ? date.toISOString().split('T')[0] : '')}
                        placeholder="입사일 선택"
                      />
                    </div>
                    {formErrors.hireDate && (
                      <div className="warning-txt mt5" role="alert">* {formErrors.hireDate}</div>
                    )}
                  </td>
                </tr>

                {/* 퇴사일 / 퇴사사유 */}
                <tr>
                  <th>퇴사일 / 퇴사사유</th>
                  <td>
                    <div className="filed-flx">
                      <div className="date-picker-wrap">
                        <DatePicker
                          value={formData.resignationDate ? new Date(formData.resignationDate) : null}
                          onChange={(date) => handleInputChange('resignationDate', date ? date.toISOString().split('T')[0] : '')}
                          placeholder="퇴사일 선택"
                        />
                      </div>
                      <Input
                        value={formData.resignationReason}
                        onChange={(e) => handleInputChange('resignationReason', e.target.value)}
                        placeholder="퇴사사유"
                        showClear
                        onClear={() => handleInputChange('resignationReason', '')}
                        containerClassName="mx-300"
                      />
                    </div>
                  </td>
                </tr>

                {/* 휴대폰 번호 */}
                <tr>
                  <th>
                    휴대폰 번호 <span className="red">*</span>
                  </th>
                  <td>
                    <Input
                      value={formData.mobilePhone}
                      onChange={(e) => handleInputChange('mobilePhone', e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="01012345678"
                      maxLength={11}
                      error={!!formErrors.mobilePhone}
                      helpText={formErrors.mobilePhone}
                      showClear
                      onClear={() => handleInputChange('mobilePhone', '')}
                      explain="※ 숫자만 입력"
                      containerClassName="mx-300"
                    />
                  </td>
                </tr>

                {/* 비상 연락처 */}
                <tr>
                  <th>비상 연락처</th>
                  <td>
                    <Input
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="01012345678"
                      maxLength={11}
                      showClear
                      onClear={() => handleInputChange('emergencyContact', '')}
                      explain="※ 숫자만 입력"
                      containerClassName="mx-300"
                    />
                  </td>
                </tr>

                {/* 이메일 주소 */}
                <tr>
                  <th>
                    이메일 주소 <span className="red">*</span>
                  </th>
                  <td>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="example@email.com"
                      error={!!formErrors.email}
                      helpText={formErrors.email}
                      showClear
                      onClear={() => handleInputChange('email', '')}
                      containerClassName="mx-400"
                    />
                  </td>
                </tr>

                {/* 주소 */}
                <tr>
                  <th>
                    주소 <span className="red">*</span>
                  </th>
                  <td>
                    <AddressSearch
                      value={addressData}
                      onChange={handleAddressChange}
                      error={!!formErrors.address}
                      helpText={formErrors.address}
                      addressPlaceholder="주소를 선택하세요"
                      detailPlaceholder="상세 주소를 입력하세요"
                    />
                  </td>
                </tr>

                {/* 급여 계좌번호 */}
                <tr>
                  <th>
                    급여 계좌번호 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="filed-flx">
                      <div className="mx-300">
                        <SearchSelect
                          options={bankSelectOptions}
                          value={bankSelectOptions.find(opt => opt.value === formData.bankCode) || null}
                          onChange={(opt) => handleInputChange('bankCode', opt?.value || '')}
                          placeholder="은행 선택"
                        />
                      </div>
                      <Input
                        value={formData.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                        placeholder="계좌번호"
                        error={!!formErrors.accountNumber}
                        showClear
                        onClear={() => handleInputChange('accountNumber', '')}
                        containerClassName="mx-250"
                      />
                      <Input
                        value={formData.accountHolder}
                        onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                        placeholder="예금주"
                        error={!!formErrors.accountHolder}
                        showClear
                        onClear={() => handleInputChange('accountHolder', '')}
                        containerClassName="mx-150"
                      />
                    </div>
                    {(formErrors.accountNumber || formErrors.accountHolder) && (
                      <div className="warning-txt mt5" role="alert">
                        * {formErrors.accountNumber || formErrors.accountHolder}
                      </div>
                    )}
                  </td>
                </tr>

                {/* 문서 파일 (memberId가 있을 때만 표시) */}
                {memberId ? (
                  <>
                    {/* 서류 영역 - 읽기 전용 (직원 앱에서만 등록/수정 가능) */}
                    {[
                      { label: '주민등록등본', type: 'RESIDENT_REGISTRATION' },
                      { label: '가족관계증명서', type: 'FAMILY_RELATION' },
                      { label: '건강진단결과서', type: 'HEALTH_CHECK' },
                      { label: '이력서', type: 'RESUME' },
                    ].map(({ label, type }) => {
                      const doc = (documentsData ?? []).find(d => d.documentType === type)
                      return (
                        <tr key={type}>
                          <th>{label}</th>
                          <td>
                            <span style={{ color: doc?.fileName ? '#333' : '#999', fontSize: '13px' }}>
                              {doc?.fileName ?? '등록된 파일 없음'}
                            </span>
                            {type === 'HEALTH_CHECK' && doc?.expiryDate && (
                              <span style={{ color: '#666', fontSize: '12px', marginLeft: '12px' }}>
                                (만료일: {doc.expiryDate})
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </>
                ) : null}

                {/* MEMO */}
                <tr>
                  <th>MEMO</th>
                  <td>
                    <Input
                      value={formData.memo}
                      onChange={(e) => handleInputChange('memo', e.target.value)}
                      placeholder="메모 내용을 입력하세요"
                      showClear
                      onClear={() => handleInputChange('memo', '')}
                      fullWidth
                    />
                  </td>
                </tr>

                {/* 아이콘 */}
                <tr>
                  <th>
                    아이콘 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="icon-select-group">
                      {icons.map((icon, index) => (
                        <button
                          key={index}
                          className={`icon-select-btn ${selectedIcon === index ? 'active' : ''}`}
                          onClick={() => setSelectedIcon(index)}
                          style={{
                            width: '60px',
                            height: '60px',
                            fontSize: '32px',
                            border: selectedIcon === index ? '2px solid #333' : '1px solid #ddd',
                            borderRadius: '4px',
                            background: selectedIcon === index ? '#f5f5f5' : '#fff',
                            cursor: 'pointer',
                            marginRight: '8px'
                          }}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AnimateHeight>
      </div>

    </div>
  )
}
