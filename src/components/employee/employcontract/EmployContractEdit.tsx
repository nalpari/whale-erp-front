'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import DatePicker from '@/components/ui/common/DatePicker'
import RangeDatePicker, { DateRange } from '@/components/ui/common/RangeDatePicker'
import Input from '@/components/common/ui/Input'
import { useAlert } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import {
  useContractDetail,
  useContractsByEmployee,
  useCreateContract,
  useUpdateContractHeader
} from '@/hooks/queries/use-contract-queries'
import { useEmployeeListByType } from '@/hooks/queries/use-employee-queries'
import type { CreateEmploymentContractHeaderRequest, UpdateEmploymentContractHeaderRequest } from '@/lib/api/employmentContract'
import { useBpHeadOfficeTree } from '@/hooks/queries'
import { useStoreOptions } from '@/hooks/queries/use-store-queries'
import { useAuthStore } from '@/stores/auth-store'
import { formatDateYmd } from '@/util/date-util'

interface EmployContractEditProps {
  contractId?: number
  id?: string
}

// 문자열을 Date 객체로 변환하는 유틸리티
const parseStringToDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? null : parsed
}

// Date 객체를 YYYY-MM-DD 문자열로 변환 (공유 유틸리티 활용)
const formatDateToString = (date: Date | null): string => formatDateYmd(date, '')

export default function EmployContractEdit({ contractId, id }: EmployContractEditProps) {
  const isCreateMode = id === 'new'
  const router = useRouter()
  const { alert } = useAlert()
  const [headerInfoOpen, setHeaderInfoOpen] = useState(true)
  const [headerId, setHeaderId] = useState<number | null>(null)
  const [selectedEmployeeInfoId, setSelectedEmployeeInfoId] = useState<number | null>(null)

  // BP 트리 데이터
  const { accessToken, affiliationId } = useAuthStore()
  const isReady = Boolean(accessToken && affiliationId)
  const { data: bpTree = [] } = useBpHeadOfficeTree(isReady)

  // 파일 input refs
  const laborContractFileRef = useRef<HTMLInputElement>(null)
  const wageContractFileRef = useRef<HTMLInputElement>(null)
  const [laborContractFileObj, setLaborContractFileObj] = useState<File | null>(null)
  const [wageContractFileObj, setWageContractFileObj] = useState<File | null>(null)

  // 폼 데이터
  const [formData, setFormData] = useState({
    employeeAffiliation: 'HEAD_OFFICE' as 'HEAD_OFFICE' | 'FRANCHISE',
    headOfficeId: '',
    franchiseId: '',
    storeId: '',
    isElectronicContract: true,
    electronicContractStatus: '작성중',
    employeeId: '',
    employeeName: '',
    employeeNumber: '',
    contractClassification: 'CNTCFWK_001',
    healthInsurance: false,
    nationalPension: false,
    employmentInsurance: false,
    workersCompensation: false,
    salaryCycle: 'SLRCC_002',
    salaryMonth: 'SLRCF_002',
    salaryDay: 1,
    contractStartDate: null as Date | null,
    contractEndDate: null as Date | null,
    noEndDate: false,
    laborContractFile: '',
    laborContractFileId: null as number | null,
    laborContractFileUrl: '',
    wageContractFile: '',
    wageContractFileId: null as number | null,
    wageContractFileUrl: '',
    contractDate: null as Date | null,
    jobDescription: ''
  })

  // 점포 옵션 조회
  const headOfficeIdNum = formData.headOfficeId ? parseInt(formData.headOfficeId) : null
  const franchiseIdNum = formData.franchiseId ? parseInt(formData.franchiseId) : null
  const { data: storeOptionList = [] } = useStoreOptions(headOfficeIdNum, franchiseIdNum, Boolean(headOfficeIdNum) && isReady)

  // TanStack Query - 직원 목록 조회
  const { data: employeeList = [] } = useEmployeeListByType({
    headOfficeId: headOfficeIdNum!,
    franchiseId: franchiseIdNum ?? undefined,
    employeeType: 'ALL'
  }, !!headOfficeIdNum)

  // TanStack Query - 계약 상세 조회 (수정 모드)
  const { data: contractDetail, isPending: isLoading } = useContractDetail(
    contractId ?? 0,
    !isCreateMode && !!contractId
  )

  // TanStack Query - 이전 계약 조회 (이전 계약정보 불러오기 기능)
  const { refetch: previousContractsRefetch } = useContractsByEmployee(
    selectedEmployeeInfoId || Number(formData.employeeId) || 0,
    false  // 초기에는 자동 조회하지 않음
  )

  // TanStack Query - Mutations
  const createContractMutation = useCreateContract()
  const updateContractMutation = useUpdateContractHeader()

  const isSaving = createContractMutation.isPending || updateContractMutation.isPending

  // SearchSelect 옵션들
  const headOfficeOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '본사 선택' },
    ...bpTree.map((office) => ({ value: String(office.id), label: office.name }))
  ], [bpTree])

  const franchiseOptions: SelectOption[] = useMemo(() => {
    if (!headOfficeIdNum) return [{ value: '', label: '가맹점 선택' }]
    const office = bpTree.find((o) => o.id === headOfficeIdNum)
    return [
      { value: '', label: '가맹점 선택' },
      ...(office?.franchises.map((f) => ({ value: String(f.id), label: f.name })) ?? [])
    ]
  }, [bpTree, headOfficeIdNum])

  const storeOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '점포 선택' },
    ...storeOptionList.map(store => ({ value: String(store.id), label: store.storeName }))
  ], [storeOptionList])

  const employeeOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '직원 선택' },
    ...employeeList.map(emp => ({
      value: String(emp.employeeInfoId),
      label: `${emp.employeeName} (${emp.employeeNumber})`
    }))
  ], [employeeList])

  const contractClassOptions: SelectOption[] = useMemo(() => [
    { value: 'CNTCFWK_001', label: '포괄연봉제' },
    { value: 'CNTCFWK_002', label: '비포괄연봉제' },
    { value: 'CNTCFWK_003', label: '파트타임' }
  ], [])

  const salaryCycleOptions: SelectOption[] = useMemo(() => [
    { value: 'SLRCC_001', label: '시급' },
    { value: 'SLRCC_002', label: '월급' }
  ], [])

  const salaryMonthOptions: SelectOption[] = useMemo(() => [
    { value: 'SLRCF_001', label: '당월' },
    { value: 'SLRCF_002', label: '익월' }
  ], [])

  const displayEmployeeNumber = useMemo(() => {
    if (formData.employeeNumber) return formData.employeeNumber
    const emp = employeeList.find(e => String(e.employeeInfoId) === formData.employeeId)
    return emp?.employeeNumber || '-'
  }, [formData.employeeNumber, formData.employeeId, employeeList])

  // 계약 상세 데이터 로드 시 폼 업데이트
  useEffect(() => {
    if (contractDetail && !isCreateMode && headerId === null) {
      const header = contractDetail.employmentContractHeader
      const member = contractDetail.member

      const electronicContractStatusMap: Record<string, string> = {
        'WRITING': '작성중',
        'PROGRESS': '진행중',
        'COMPLETE': '계약완료',
        'REFUSAL': '거절'
      }

      if (header?.id) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 외부 데이터(contractDetail) 로드 시 폼 상태 동기화
        setHeaderId(header.id)
      }

      setFormData(prev => ({
        ...prev,
        headOfficeId: String(contractDetail.headOfficeOrganizationId ?? ''),
        franchiseId: String(contractDetail.franchiseOrganizationId ?? ''),
        storeId: String(contractDetail.storeId ?? ''),
        employeeAffiliation: contractDetail.franchiseOrganizationId ? 'FRANCHISE' : 'HEAD_OFFICE',
        employeeId: String(contractDetail.employeeInfoId ?? ''),
        employeeName: member?.name || '',
        employeeNumber: member?.employeeNumber || '',
        contractClassification: header?.contractClassification || 'CNTCFWK_001',
        isElectronicContract: header?.contractType === 'ECNT_001',
        electronicContractStatus: header?.electronicContractStatus
          ? electronicContractStatusMap[header.electronicContractStatus] || header.electronicContractStatus
          : '작성중',
        healthInsurance: header?.healthInsuranceEnrolled || false,
        nationalPension: header?.nationalPensionEnrolled || false,
        employmentInsurance: header?.employmentInsuranceEnrolled || false,
        workersCompensation: header?.workersCompensationEnrolled || false,
        salaryCycle: header?.salaryCycle || 'SLRCC_002',
        salaryMonth: header?.salaryMonth || 'SLRCF_002',
        salaryDay: header?.salaryDay || 1,
        contractStartDate: parseStringToDate(header?.contractStartDate),
        contractEndDate: header?.contractEndDate === '2999-12-31' ? null : parseStringToDate(header?.contractEndDate),
        noEndDate: !header?.contractEndDate || header?.contractEndDate === '2999-12-31',
        contractDate: parseStringToDate(header?.contractDate),
        jobDescription: header?.jobDescription || '',
        laborContractFile: header?.workContractFile?.fileName || '',
        laborContractFileId: header?.workContractFile?.fileId || null,
        laborContractFileUrl: header?.workContractFile?.downloadUrl || '',
        wageContractFile: header?.wageContractFile?.fileName || '',
        wageContractFileId: header?.wageContractFile?.fileId || null,
        wageContractFileUrl: header?.wageContractFile?.downloadUrl || ''
      }))
    }
  }, [contractDetail, isCreateMode, headerId])

  const handleInputChange = (field: string, value: string | number | boolean | string[] | Date | null) => {
    if (field === 'employeeAffiliation' && value === 'HEAD_OFFICE') {
      setFormData(prev => ({ ...prev, [field]: value, franchiseId: '', storeId: '', employeeId: '', employeeName: '', employeeNumber: '' }))
      setSelectedEmployeeInfoId(null)
      return
    }
    if (field === 'headOfficeId') {
      setFormData(prev => ({ ...prev, headOfficeId: value as string, franchiseId: '', storeId: '', employeeId: '', employeeName: '', employeeNumber: '' }))
      setSelectedEmployeeInfoId(null)
      return
    }
    if (field === 'franchiseId') {
      setFormData(prev => ({ ...prev, franchiseId: value as string, storeId: '', employeeId: '', employeeName: '', employeeNumber: '' }))
      setSelectedEmployeeInfoId(null)
      return
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleInsuranceChange = (field: string, checked: boolean) => {
    if (field === 'healthInsurance' || field === 'nationalPension') {
      setFormData(prev => ({
        ...prev,
        healthInsurance: checked,
        nationalPension: checked
      }))
    } else if (field === 'employmentInsurance' || field === 'workersCompensation') {
      setFormData(prev => ({
        ...prev,
        employmentInsurance: checked,
        workersCompensation: checked
      }))
    }
  }

  const handleSave = async () => {
    // 필수값 검증
    if (isCreateMode) {
      if (!selectedEmployeeInfoId) {
        await alert('직원을 선택해주세요.')
        return
      }
      if (!formData.headOfficeId) {
        await alert('본사를 선택해주세요.')
        return
      }
      if (!formData.contractStartDate) {
        await alert('계약 시작일을 입력해주세요.')
        return
      }
      if (!formData.jobDescription) {
        await alert('업무 내용을 입력해주세요.')
        return
      }
    } else {
      if (!headerId) {
        await alert('헤더 정보를 찾을 수 없습니다.')
        return
      }
    }

    const electronicContractStatusReverseMap: Record<string, string> = {
      '작성중': 'WRITING',
      '진행중': 'PROGRESS',
      '계약완료': 'COMPLETE',
      '거절': 'REFUSAL'
    }

    try {
      if (isCreateMode) {
        const createData: CreateEmploymentContractHeaderRequest = {
          headOfficeOrganizationId: Number(formData.headOfficeId),
          franchiseOrganizationId: formData.franchiseId ? Number(formData.franchiseId) : null,
          storeId: formData.storeId ? Number(formData.storeId) : null,
          employeeInfoId: selectedEmployeeInfoId!,
          contractType: formData.isElectronicContract ? 'ECNT_001' : 'ECNT_002',
          electronicContractStatus: electronicContractStatusReverseMap[formData.electronicContractStatus] || 'WRITING',
          contractClassification: formData.contractClassification,
          nationalPensionEnrolled: formData.nationalPension,
          healthInsuranceEnrolled: formData.healthInsurance,
          employmentInsuranceEnrolled: formData.employmentInsurance,
          workersCompensationEnrolled: formData.workersCompensation,
          salaryCycle: formData.salaryCycle,
          salaryMonth: formData.salaryMonth,
          salaryDay: formData.salaryDay,
          contractStartDate: formatDateToString(formData.contractStartDate),
          contractEndDate: formData.noEndDate ? '2999-12-31' : formatDateToString(formData.contractEndDate) || null,
          contractDate: formatDateToString(formData.contractDate) || null,
          jobDescription: formData.jobDescription
        }

        const response = await createContractMutation.mutateAsync({
          data: createData,
          workContractFile: laborContractFileObj,
          wageContractFile: wageContractFileObj
        })

        await alert('등록되었습니다.')
        router.push(`/employee/contract/${response.id}`)
      } else {
        const requestData: UpdateEmploymentContractHeaderRequest = {
          contractType: formData.isElectronicContract ? 'ECNT_001' : 'ECNT_002',
          electronicContractStatus: electronicContractStatusReverseMap[formData.electronicContractStatus] || 'WRITING',
          contractClassification: formData.contractClassification,
          nationalPensionEnrolled: formData.nationalPension,
          healthInsuranceEnrolled: formData.healthInsurance,
          employmentInsuranceEnrolled: formData.employmentInsurance,
          workersCompensationEnrolled: formData.workersCompensation,
          salaryCycle: formData.salaryCycle,
          salaryMonth: formData.salaryMonth,
          salaryDay: formData.salaryDay,
          contractStartDate: formatDateToString(formData.contractStartDate),
          contractEndDate: formData.noEndDate ? '2999-12-31' : formatDateToString(formData.contractEndDate),
          contractDate: formatDateToString(formData.contractDate) || null,
          jobDescription: formData.jobDescription,
          workContractFileId: laborContractFileObj ? null : formData.laborContractFileId,
          wageContractFileId: wageContractFileObj ? null : formData.wageContractFileId
        }

        await updateContractMutation.mutateAsync({
          headerId: headerId!,
          request: {
            data: requestData,
            workContractFile: laborContractFileObj,
            wageContractFile: wageContractFileObj
          }
        })

        await alert('저장되었습니다.')
        router.push(`/employee/contract/${contractId}`)
      }
    } catch (error) {
      console.error('저장 실패:', error)
      await alert('저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleCancel = () => {
    if (isCreateMode) {
      router.push('/employee/contract')
    } else {
      router.push(`/employee/contract/${contractId}`)
    }
  }

  const handleLoadPreviousContract = async () => {
    // 유효성 검사
    if (!selectedEmployeeInfoId && !formData.employeeId) {
      alert('직원을 선택해주세요.')
      return
    }

    const employeeInfoId = selectedEmployeeInfoId || Number(formData.employeeId)
    if (!employeeInfoId) {
      alert('직원을 선택해주세요.')
      return
    }

    try {
      // 직원의 모든 계약 목록 조회 (refetch 사용)
      const result = await previousContractsRefetch()
      const contracts = result.data

      if (!contracts || contracts.length === 0) {
        await alert('이전 계약 정보가 없습니다.')
        return
      }

      // 가장 최근 계약 찾기 (createdAt 또는 contractStartDate 기준)
      const sortedContracts = [...contracts].sort((a, b) => {
        const dateA = a.employmentContractHeader?.contractStartDate || a.createdAt || ''
        const dateB = b.employmentContractHeader?.contractStartDate || b.createdAt || ''
        return dateB.localeCompare(dateA)  // 내림차순 정렬
      })

      const latestContract = sortedContracts[0]
      const header = latestContract.employmentContractHeader

      if (!header) {
        await alert('이전 계약의 Header 정보가 없습니다.')
        return
      }

      // 전자계약 상태 한글 매핑
      const statusMap: Record<string, string> = {
        'WRITING': '작성중',
        'PROGRESS': '진행중',
        'COMPLETE': '계약완료',
        'REFUSAL': '거절'
      }

      // 이전 계약 정보로 폼 데이터 업데이트 (계약 기간, 계약일, 파일 제외)
      setFormData(prev => ({
        ...prev,
        // 전자계약 상태
        isElectronicContract: header.contractType === 'ECNT_001',
        electronicContractStatus: header.electronicContractStatus
          ? statusMap[header.electronicContractStatus] || '작성중'
          : '작성중',
        // 계약 분류
        contractClassification: header.contractClassification || 'CNTCFWK_001',
        // 4대 보험
        healthInsurance: header.healthInsuranceEnrolled || false,
        nationalPension: header.nationalPensionEnrolled || false,
        employmentInsurance: header.employmentInsuranceEnrolled || false,
        workersCompensation: header.workersCompensationEnrolled || false,
        // 급여 주기
        salaryCycle: header.salaryCycle || 'SLRCC_002',
        salaryMonth: header.salaryMonth || 'SLRCF_002',
        salaryDay: header.salaryDay || 1,
        // 업무 내용
        jobDescription: header.jobDescription || ''
        // 계약 기간, 계약일, 파일 정보는 이전 값을 가져오지 않음 (새로 입력해야 함)
      }))

      await alert('이전 계약 정보를 불러왔습니다. (계약 기간, 계약일, 파일은 새로 입력해주세요)')
    } catch (error) {
      console.error('이전 계약 정보 조회 실패:', error)
      await alert('이전 계약 정보를 불러오는데 실패했습니다.')
    }
  }

  const handleFileUpload = (field: 'laborContractFile' | 'wageContractFile') => {
    if (field === 'laborContractFile') {
      laborContractFileRef.current?.click()
    } else {
      wageContractFileRef.current?.click()
    }
  }

  const handleLaborContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      e.target.value = ''
      return
    }
    setLaborContractFileObj(file)
    setFormData(prev => ({
      ...prev,
      laborContractFile: file.name,
      laborContractFileId: null,
      laborContractFileUrl: ''
    }))
    e.target.value = ''
  }

  const handleWageContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      e.target.value = ''
      return
    }
    setWageContractFileObj(file)
    setFormData(prev => ({
      ...prev,
      wageContractFile: file.name,
      wageContractFileId: null,
      wageContractFileUrl: ''
    }))
    e.target.value = ''
  }

  const handleFileRemove = (field: 'laborContractFile' | 'wageContractFile') => {
    if (field === 'laborContractFile') {
      setLaborContractFileObj(null)
      setFormData(prev => ({
        ...prev,
        laborContractFile: '',
        laborContractFileId: null,
        laborContractFileUrl: ''
      }))
    } else {
      setWageContractFileObj(null)
      setFormData(prev => ({
        ...prev,
        wageContractFile: '',
        wageContractFileId: null,
        wageContractFileUrl: ''
      }))
    }
  }

  if (isLoading && !isCreateMode) {
    return (
      <div className="master-detail-data">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <span>데이터를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  // 필수값 검증 상태
  const isEmployeeRequired = isCreateMode && !selectedEmployeeInfoId && !formData.employeeId
  const isHeadOfficeRequired = isCreateMode && !formData.headOfficeId
  const isContractStartRequired = !formData.contractStartDate
  const isJobDescriptionRequired = !formData.jobDescription

  return (
    <div className="master-detail-data">
      <div className={`slidebox-wrap ${headerInfoOpen ? '' : 'close'}`}>
        <div className="slidebox-header">
          <h2>근로 계약 Header 정보</h2>
          <div className="slidebox-btn-wrap">
            <button className="btn-form basic" onClick={handleSave} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </button>
            <button className="slidebox-btn arr" onClick={() => setHeaderInfoOpen(!headerInfoOpen)} aria-label={headerInfoOpen ? '근로 계약 Header 정보 접기' : '근로 계약 Header 정보 펼치기'}>
              <i className="arr-icon"></i>
            </button>
          </div>
        </div>
        <AnimateHeight duration={300} height={headerInfoOpen ? 'auto' : 0}>
          <div className="slidebox-body">
            <div className="detail-data-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="180px" />
                  <col />
                </colgroup>
                <tbody>
                  {/* 직원 소속 */}
                  <tr>
                    <th>직원 소속 <span className="red">*</span></th>
                    <td>
                      <div className="filed-check-flx">
                        <button
                          type="button"
                          className={`btn-form ${formData.employeeAffiliation === 'HEAD_OFFICE' ? 'basic' : 'outline'}`}
                          onClick={() => handleInputChange('employeeAffiliation', 'HEAD_OFFICE')}
                          disabled={!isCreateMode}
                        >
                          본사
                        </button>
                        <button
                          type="button"
                          className={`btn-form ${formData.employeeAffiliation === 'FRANCHISE' ? 'basic' : 'outline'}`}
                          onClick={() => handleInputChange('employeeAffiliation', 'FRANCHISE')}
                          disabled={!isCreateMode}
                        >
                          가맹점
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* 본사/가맹점 선택 */}
                  <tr>
                    <th>{formData.employeeAffiliation === 'HEAD_OFFICE' ? '본사 선택' : '본사/가맹점 선택'} <span className="red">*</span></th>
                    <td>
                      <div className="data-filed" style={{ display: 'flex', gap: '8px' }}>
                        <SearchSelect
                          options={headOfficeOptions}
                          value={headOfficeOptions.find(opt => opt.value === formData.headOfficeId) || null}
                          onChange={(option) => handleInputChange('headOfficeId', option?.value || '')}
                          className={isHeadOfficeRequired ? 'border-red-500' : ''}
                          isDisabled={!isCreateMode}
                        />
                        {formData.employeeAffiliation === 'FRANCHISE' && (
                          <SearchSelect
                            options={franchiseOptions}
                            value={franchiseOptions.find(opt => opt.value === formData.franchiseId) || null}
                            onChange={(option) => handleInputChange('franchiseId', option?.value || '')}
                            isDisabled={!isCreateMode}
                          />
                        )}
                        {isHeadOfficeRequired && (
                          <span className="warning-txt">* 필수 입력 항목입니다.</span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* 점포 선택 */}
                  <tr>
                    <th>점포 선택</th>
                    <td>
                      <div className="data-filed">
                        <SearchSelect
                          options={storeOptions}
                          value={storeOptions.find(opt => opt.value === formData.storeId) || null}
                          onChange={(option) => handleInputChange('storeId', option?.value || '')}
                          isDisabled={!isCreateMode}
                        />
                      </div>
                    </td>
                  </tr>
                  {/* 전자계약 진행 상태 */}
                  <tr>
                    <th>전자계약 진행 상태</th>
                    <td>
                      <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label className="switch-toggle">
                          <input
                            type="checkbox"
                            checked={formData.isElectronicContract}
                            onChange={(e) => handleInputChange('isElectronicContract', e.target.checked)}
                          />
                          <span className="slider"></span>
                        </label>
                        <span>전자계약서</span>
                        {formData.isElectronicContract && (
                          <span style={{ padding: '4px 12px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                            {formData.electronicContractStatus}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* 직원명/사번 */}
                  <tr>
                    <th>직원명/사번 <span className="red">*</span></th>
                    <td>
                      <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '200px' }}>
                          <SearchSelect
                            options={employeeOptions}
                            value={employeeOptions.find(opt => opt.value === formData.employeeId) || null}
                            onChange={(option) => {
                              const selectedId = option?.value || ''
                              const selectedEmployee = employeeList.find(emp => String(emp.employeeInfoId) === selectedId)
                              if (selectedEmployee) {
                                setFormData(prev => ({
                                  ...prev,
                                  employeeId: selectedId,
                                  employeeName: selectedEmployee.employeeName,
                                  employeeNumber: selectedEmployee.employeeNumber
                                }))
                                if (isCreateMode) {
                                  setSelectedEmployeeInfoId(selectedEmployee.employeeInfoId)
                                }
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  employeeId: '',
                                  employeeName: '',
                                  employeeNumber: ''
                                }))
                                if (isCreateMode) {
                                  setSelectedEmployeeInfoId(null)
                                }
                              }
                            }}
                            className={isEmployeeRequired ? 'border-red-500' : ''}
                            isDisabled={!isCreateMode}
                          />
                        </div>
                        <span style={{ padding: '4px 12px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                          {displayEmployeeNumber}
                        </span>
                        {isCreateMode && (
                          <button className="btn-form outline" onClick={handleLoadPreviousContract}>
                            이전 계약정보 불러오기
                          </button>
                        )}
                        {isEmployeeRequired && (
                          <span className="warning-txt">* 필수 입력 항목입니다.</span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* 계약 분류 */}
                  <tr>
                    <th>계약 분류 <span className="red">*</span></th>
                    <td>
                      <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '200px' }}>
                          <SearchSelect
                            options={contractClassOptions}
                            value={contractClassOptions.find(opt => opt.value === formData.contractClassification) || null}
                            onChange={(option) => handleInputChange('contractClassification', option?.value || '')}
                          />
                        </div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#007bff',
                          color: '#fff',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}>i</span>
                      </div>
                    </td>
                  </tr>
                  {/* 4대 보험 가입 유무 */}
                  <tr>
                    <th>4대 보험 가입 유무</th>
                    <td>
                      <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            backgroundColor: formData.healthInsurance ? '#e3f2fd' : '#f9f9f9',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: formData.healthInsurance ? '1px solid #2196f3' : '1px solid #e0e0e0'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.healthInsurance && formData.nationalPension}
                            onChange={(e) => handleInsuranceChange('healthInsurance', e.target.checked)}
                          />
                          <span>건강보험 / 국민연금</span>
                        </label>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            backgroundColor: formData.employmentInsurance ? '#e3f2fd' : '#f9f9f9',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: formData.employmentInsurance ? '1px solid #2196f3' : '1px solid #e0e0e0'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.employmentInsurance && formData.workersCompensation}
                            onChange={(e) => handleInsuranceChange('employmentInsurance', e.target.checked)}
                          />
                          <span>고용보험 / 산재보험</span>
                        </label>
                        <span style={{ color: '#666', fontSize: '12px' }}>※ 각 항목 체크 시 급여에 반영됩니다.</span>
                      </div>
                    </td>
                  </tr>
                  {/* 급여계산 주기/급여일 */}
                  <tr>
                    <th>급여계산 주기/급여일 <span className="red">*</span></th>
                    <td>
                      <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '150px' }}>
                          <SearchSelect
                            options={salaryCycleOptions}
                            value={salaryCycleOptions.find(opt => opt.value === formData.salaryCycle) || null}
                            onChange={(option) => handleInputChange('salaryCycle', option?.value || '')}
                          />
                        </div>
                        <div style={{ width: '100px' }}>
                          <SearchSelect
                            options={salaryMonthOptions}
                            value={salaryMonthOptions.find(opt => opt.value === formData.salaryMonth) || null}
                            onChange={(option) => handleInputChange('salaryMonth', option?.value || '')}
                          />
                        </div>
                        <Input
                          type="number"
                          style={{ width: '80px' }}
                          value={formData.salaryDay}
                          onChange={(e) => handleInputChange('salaryDay', parseInt(e.target.value))}
                        />
                        <span style={{ color: '#666', fontSize: '12px' }}>※ 31일을 입력한 경우 급여일은 매달 말일로 적용합니다.</span>
                      </div>
                    </td>
                  </tr>
                  {/* 계약 기간 */}
                  <tr>
                    <th>계약 기간 <span className="red">*</span></th>
                    <td>
                      <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ opacity: formData.noEndDate ? 0.7 : 1 }}>
                          <RangeDatePicker
                            startDate={formData.contractStartDate}
                            endDate={formData.noEndDate ? null : formData.contractEndDate}
                            onChange={(range: DateRange) => {
                              handleInputChange('contractStartDate', range.startDate)
                              if (!formData.noEndDate) {
                                handleInputChange('contractEndDate', range.endDate)
                              }
                            }}
                            startDatePlaceholder="계약 시작일"
                            endDatePlaceholder={formData.noEndDate ? '종료일 없음' : '계약 종료일'}
                          />
                        </div>
                        <button
                          type="button"
                          className={`btn-form ${formData.noEndDate ? 'basic' : 'outline'}`}
                          onClick={() => {
                            const newNoEndDate = !formData.noEndDate
                            handleInputChange('noEndDate', newNoEndDate)
                            if (newNoEndDate) {
                              handleInputChange('contractEndDate', null)
                            }
                          }}
                          style={{ minWidth: '100px' }}
                        >
                          종료일 없음
                        </button>
                        {isContractStartRequired && (
                          <span className="warning-txt">* 계약 시작일은 필수입니다.</span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* 근로계약서 */}
                  <tr>
                    <th>근로계약서</th>
                    <td>
                      <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="file"
                          ref={laborContractFileRef}
                          onChange={handleLaborContractFileChange}
                          accept=".pdf,.doc,.docx,.hwp"
                          style={{ display: 'none' }}
                        />
                        <button
                          className="btn-form outline"
                          onClick={() => handleFileUpload('laborContractFile')}
                        >
                          파일찾기
                        </button>
                        {formData.laborContractFile && (
                          <>
                            {formData.laborContractFileUrl ? (
                              <a
                                href={formData.laborContractFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={formData.laborContractFile}
                                style={{ color: '#007bff', textDecoration: 'underline' }}
                              >
                                {formData.laborContractFile}
                              </a>
                            ) : (
                              <span style={{ color: '#333' }}>{formData.laborContractFile}</span>
                            )}
                            <button
                              className="btn-form gray"
                              style={{ padding: '4px 8px', minWidth: 'auto' }}
                              onClick={() => handleFileRemove('laborContractFile')}
                              aria-label="근로계약서 파일 삭제"
                            >
                              X
                            </button>
                          </>
                        )}
                        <span style={{ color: '#666', fontSize: '12px' }}>※ 당사자 모두가 날인한 계약서 첨부</span>
                      </div>
                    </td>
                  </tr>
                  {/* 임금계약서 */}
                  <tr>
                    <th>임금계약서</th>
                    <td>
                      <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="file"
                          ref={wageContractFileRef}
                          onChange={handleWageContractFileChange}
                          accept=".pdf,.doc,.docx,.hwp"
                          style={{ display: 'none' }}
                        />
                        <button
                          className="btn-form outline"
                          onClick={() => handleFileUpload('wageContractFile')}
                        >
                          파일찾기
                        </button>
                        {formData.wageContractFile && (
                          <>
                            {formData.wageContractFileUrl ? (
                              <a
                                href={formData.wageContractFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={formData.wageContractFile}
                                style={{ color: '#007bff', textDecoration: 'underline' }}
                              >
                                {formData.wageContractFile}
                              </a>
                            ) : (
                              <span style={{ color: '#333' }}>{formData.wageContractFile}</span>
                            )}
                            <button
                              className="btn-form gray"
                              style={{ padding: '4px 8px', minWidth: 'auto' }}
                              onClick={() => handleFileRemove('wageContractFile')}
                              aria-label="임금계약서 파일 삭제"
                            >
                              X
                            </button>
                          </>
                        )}
                        <span style={{ color: '#666', fontSize: '12px' }}>※ 당사자 모두가 날인한 계약서 첨부</span>
                      </div>
                    </td>
                  </tr>
                  {/* 계약일 */}
                  <tr>
                    <th>계약일 <span className="red">*</span></th>
                    <td>
                      <div className="data-filed">
                        <DatePicker
                          value={formData.contractDate}
                          onChange={(date) => handleInputChange('contractDate', date)}
                          placeholder="계약일"
                        />
                      </div>
                    </td>
                  </tr>
                  {/* 업무 내용 */}
                  <tr>
                    <th>업무 내용 <span className="red">*</span></th>
                    <td>
                      <div className="data-filed">
                        <Input
                          fullWidth
                          value={formData.jobDescription}
                          onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                          placeholder="메뉴 제조 및 홀서빙"
                          error={isJobDescriptionRequired}
                          helpText={isJobDescriptionRequired ? "필수 입력 항목입니다." : undefined}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </AnimateHeight>
      </div>

      {/* 하단 버튼 */}
      <div className="detail-btn-wrap" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
        <button className="btn-form gray" onClick={handleCancel} disabled={isSaving}>취소</button>
        <button className="btn-form basic" onClick={handleSave} disabled={isSaving}>
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
