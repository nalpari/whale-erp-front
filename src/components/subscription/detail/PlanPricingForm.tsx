'use client'

import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
import { Input, useAlert } from '@/components/common/ui'
import { useState } from 'react'
import { useCheckPlanPricingDuplicate, useCreatePlanPricing, useUpdatePlanPricing } from '@/hooks/queries/use-plans-queries'
import type { CreatePlanPricingRequest, PlanPricing } from '@/types/plans'
import { format } from 'date-fns'

const BREADCRUMBS = ['과금관리', 'ERP 요금제 관리', 'ERP요금제 정보 관리']

interface PlanPricingFormProps {
    planId: number
    planTypeName: string
    mode: 'create' | 'edit'
    initialData?: PlanPricing
    pricingId?: number
}

interface ValidationErrors {
    title?: string
    fromDate?: string
    toDate?: string
    dateCheck?: string
    monthlyPrice?: string
    sixMonthPrice?: string
    sixMonthDiscount?: string
    twelveMonthPrice?: string
    twelveMonthDiscount?: string
}

export default function PlanPricingForm({ planId, planTypeName, mode, initialData, pricingId }: PlanPricingFormProps) {
    const router = useRouter()
    const { alert, confirm } = useAlert()

    // 상태 계산 (진행 중인지 확인)
    const getStatus = (): '대기' | '진행' | '종료' | null => {
        if (!initialData?.startDate || !initialData?.endDate) return null

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const start = new Date(initialData.startDate)
        start.setHours(0, 0, 0, 0)

        const end = new Date(initialData.endDate)
        end.setHours(0, 0, 0, 0)

        if (today < start) return '대기'
        if (today > end) return '종료'
        return '진행'
    }

    const status = mode === 'edit' ? getStatus() : null
    const isInProgress = status === '진행'

    // 초기값 설정 (edit 모드일 때 initialData 사용)
    const [title, setTitle] = useState(initialData?.title ?? '')
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [showDateError, setShowDateError] = useState(false)
    const [showDateSuccess, setShowDateSuccess] = useState(mode === 'edit') // edit 모드에서는 기본적으로 중복 확인 통과
    const [monthlyPrice, setMonthlyPrice] = useState<number | undefined>(initialData?.monthlyPrice ?? undefined)
    const [fromDate, setFromDate] = useState<Date | null>(initialData?.startDate ? new Date(initialData.startDate) : null)
    const [toDate, setToDate] = useState<Date | null>(initialData?.endDate ? new Date(initialData.endDate) : null)
    const [dateCheckMessage, setDateCheckMessage] = useState<string | null>(mode === 'edit' ? '기존 기간입니다.' : null)

    // 요금 추가 팝업 상태
    const [showAddPricePopup, setShowAddPricePopup] = useState(false)
    const [enableSixMonth, setEnableSixMonth] = useState(initialData?.sixMonthPrice != null)
    const [enableTwelveMonth, setEnableTwelveMonth] = useState(initialData?.yearlyPrice != null)
    const [tempSixMonth, setTempSixMonth] = useState(false)
    const [tempTwelveMonth, setTempTwelveMonth] = useState(false)

    // 6개월 요금 상태
    const [sixMonthPrice, setSixMonthPrice] = useState<number | undefined>(initialData?.sixMonthPrice ?? undefined)
    const [sixMonthDiscountEnabled, setSixMonthDiscountEnabled] = useState(
        initialData?.sixMonthDiscountRate != null || initialData?.sixMonthDiscountPrice != null
    )
    const [sixMonthDiscountType, setSixMonthDiscountType] = useState<'rate' | 'amount'>(
        initialData?.sixMonthDiscountPrice != null ? 'amount' : 'rate'
    )
    const [sixMonthDiscountValue, setSixMonthDiscountValue] = useState<number | undefined>(
        initialData?.sixMonthDiscountRate ?? initialData?.sixMonthDiscountPrice ?? undefined
    )
    const [sixMonthDiscountResult, setSixMonthDiscountResult] = useState<{
        totalPrice: number
        discountAmount: number
        finalPrice: number
    } | null>(null)

    // 12개월 요금 상태
    const [twelveMonthPrice, setTwelveMonthPrice] = useState<number | undefined>(initialData?.yearlyPrice ?? undefined)
    const [twelveMonthDiscountEnabled, setTwelveMonthDiscountEnabled] = useState(
        initialData?.yearlyDiscountRate != null || initialData?.yearlyDiscountPrice != null
    )
    const [twelveMonthDiscountType, setTwelveMonthDiscountType] = useState<'rate' | 'amount'>(
        initialData?.yearlyDiscountPrice != null ? 'amount' : 'rate'
    )
    const [twelveMonthDiscountValue, setTwelveMonthDiscountValue] = useState<number | undefined>(
        initialData?.yearlyDiscountRate ?? initialData?.yearlyDiscountPrice ?? undefined
    )
    const [twelveMonthDiscountResult, setTwelveMonthDiscountResult] = useState<{
        totalPrice: number
        discountAmount: number
        finalPrice: number
    } | null>(null)

    const { mutateAsync: checkDuplicate, isPending: isChecking } = useCheckPlanPricingDuplicate()
    const { mutateAsync: createPricing, isPending: isCreating } = useCreatePlanPricing()
    const { mutateAsync: updatePricing, isPending: isUpdating } = useUpdatePlanPricing()

    const isSaving = isCreating || isUpdating
    const pageTitle = mode === 'create' ? '가격 정보 등록' : '가격 정보 수정'

    const handleCancel = () => {
        router.push(`/subscription/${planId}`)
    }

    const validate = (): boolean => {
        const newErrors: ValidationErrors = {}

        // 제목 검증
        if (!title.trim()) {
            newErrors.title = '제목을 입력해주세요.'
        }

        // 기간 검증
        if (!fromDate) {
            newErrors.fromDate = '시작일을 선택해주세요.'
        }
        if (!toDate) {
            newErrors.toDate = '종료일을 선택해주세요.'
        }

        // 진행 중 상태에서 종료일이 오늘 이전인지 검증
        if (isInProgress && toDate) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const endDate = new Date(toDate)
            endDate.setHours(0, 0, 0, 0)

            if (endDate < today) {
                newErrors.toDate = '종료일은 오늘 이후여야 합니다.'
            }
        }

        // 기간 중복 체크 검증
        if (fromDate && toDate) {
            if (showDateError) {
                newErrors.dateCheck = dateCheckMessage ?? '기간이 중복됩니다.'
            } else if (!showDateSuccess) {
                newErrors.dateCheck = '기간 중복 확인이 필요합니다.'
            }
        }

        // 1개월 요금 검증
        if (monthlyPrice === undefined) {
            newErrors.monthlyPrice = '1개월 요금을 입력해주세요.'
        }

        // 6개월 요금 검증
        if (enableSixMonth) {
            if (sixMonthPrice === undefined) {
                newErrors.sixMonthPrice = '6개월 요금을 입력해주세요.'
            }
            if (sixMonthDiscountEnabled) {
                if (sixMonthDiscountValue === undefined) {
                    newErrors.sixMonthDiscount = '6개월 할인 값을 입력해주세요.'
                } else if (sixMonthDiscountResult && sixMonthDiscountResult.finalPrice <= 0) {
                    newErrors.sixMonthDiscount = '할인 금액이 총액보다 크거나 같습니다. 할인 값을 조정해주세요.'
                }
            }
        }

        // 12개월 요금 검증
        if (enableTwelveMonth) {
            if (twelveMonthPrice === undefined) {
                newErrors.twelveMonthPrice = '12개월 요금을 입력해주세요.'
            }
            if (twelveMonthDiscountEnabled) {
                if (twelveMonthDiscountValue === undefined) {
                    newErrors.twelveMonthDiscount = '12개월 할인 값을 입력해주세요.'
                } else if (twelveMonthDiscountResult && twelveMonthDiscountResult.finalPrice <= 0) {
                    newErrors.twelveMonthDiscount = '할인 금액이 총액보다 크거나 같습니다. 할인 값을 조정해주세요.'
                }
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async () => {
        if (!validate()) {
            return
        }

        const result = await confirm(`${mode === 'create' ? '등록' : '수정'}하시겠습니까?`)
        if (!result) return

        // 6개월 할인 필드 설정 (배타적)
        let sixMonthDiscountRate: number | null = null
        let sixMonthDiscountPrice: number | null = null
        if (enableSixMonth && sixMonthDiscountEnabled && sixMonthDiscountValue) {
            if (sixMonthDiscountType === 'rate') {
                sixMonthDiscountRate = sixMonthDiscountValue
            } else {
                sixMonthDiscountPrice = sixMonthDiscountValue
            }
        }

        // 12개월 할인 필드 설정 (배타적)
        let yearlyDiscountRate: number | null = null
        let yearlyDiscountPrice: number | null = null
        if (enableTwelveMonth && twelveMonthDiscountEnabled && twelveMonthDiscountValue) {
            if (twelveMonthDiscountType === 'rate') {
                yearlyDiscountRate = twelveMonthDiscountValue
            } else {
                yearlyDiscountPrice = twelveMonthDiscountValue
            }
        }

        const requestData: CreatePlanPricingRequest = {
            title: title.trim(),
            startDate: format(fromDate!, 'yyyy-MM-dd'),
            endDate: format(toDate!, 'yyyy-MM-dd'),
            monthlyPrice: monthlyPrice!,
            sixMonthPrice: enableSixMonth ? sixMonthPrice! : null,
            sixMonthDiscountRate,
            sixMonthDiscountPrice,
            yearlyPrice: enableTwelveMonth ? twelveMonthPrice! : null,
            yearlyDiscountRate,
            yearlyDiscountPrice,
        }

        try {
            if (mode === 'create') {
                await createPricing({ planId, data: requestData })
            } else {
                await updatePricing({ planId, pricingId: pricingId!, data: requestData })
            }
            router.push(`/subscription/${planId}`)
        } catch (error) {
            console.error('가격 정책 저장 실패:', error)
            await alert(`가격 정책 ${mode === 'create' ? '등록' : '수정'}에 실패했습니다. 다시 시도해주세요.`)
        }
    }

    const handleDuplicateCheck = async (start?: Date | null, end?: Date | null) => {
        const checkFrom = start ?? fromDate
        const checkTo = end ?? toDate

        if (!checkFrom || !checkTo) {
            return
        }

        try {
            const result = await checkDuplicate({
                planId,
                activeFrom: format(checkFrom, 'yyyy-MM-dd'),
                activeUntil: format(checkTo, 'yyyy-MM-dd'),
                excludePricingId: mode === 'edit' ? pricingId : undefined,
            })

            if (result.isDuplicate) {
                const duplicateTitle = result.duplicates[0]?.title ?? '알 수 없음'
                setShowDateError(true)
                setShowDateSuccess(false)
                setDateCheckMessage(`해당 기간에 이미 가격 정책이 존재합니다. (${duplicateTitle})`)
            } else {
                setShowDateError(false)
                setShowDateSuccess(true)
                setDateCheckMessage('등록 가능한 기간입니다.')
                if (errors.dateCheck) {
                    setErrors(prev => ({ ...prev, dateCheck: undefined }))
                }
            }
        } catch {
            setShowDateError(true)
            setShowDateSuccess(false)
            setDateCheckMessage('중복 확인 중 오류가 발생했습니다.')
        }
    }

    const handleNumberInput = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<number | undefined>>,
    ) => {
        const filtered = value.replace(/[^0-9]/g, '')
        if (filtered === '') {
            setter(undefined)
        } else {
            setter(Number(filtered))
        }
    }

    // 6개월 할인 계산
    const calculateSixMonthDiscount = () => {
        if (!sixMonthDiscountValue) {
            setErrors(prev => ({ ...prev, sixMonthDiscount: '할인 값을 입력해주세요.' }))
            setSixMonthDiscountResult(null)
            return
        }

        if (!sixMonthPrice) {
            setErrors(prev => ({ ...prev, sixMonthPrice: '6개월 요금을 입력해주세요.' }))
            setSixMonthDiscountResult(null)
            return
        }

        const totalPrice = sixMonthPrice * 6
        let discountAmount: number

        if (sixMonthDiscountType === 'rate') {
            discountAmount = Math.floor(totalPrice * (sixMonthDiscountValue / 100))
        } else {
            discountAmount = sixMonthDiscountValue
        }

        const finalPrice = totalPrice - discountAmount

        if (finalPrice <= 0) {
            setErrors(prev => ({ ...prev, sixMonthDiscount: '할인 금액이 총액보다 크거나 같습니다. 할인 값을 조정해주세요.' }))
            setSixMonthDiscountResult({
                totalPrice,
                discountAmount,
                finalPrice: 0,
            })
            return
        }

        // 에러 초기화
        setErrors(prev => ({ ...prev, sixMonthDiscount: undefined }))

        setSixMonthDiscountResult({
            totalPrice,
            discountAmount,
            finalPrice,
        })
    }

    // 12개월 할인 계산
    const calculateTwelveMonthDiscount = () => {
        if (!twelveMonthDiscountValue) {
            setErrors(prev => ({ ...prev, twelveMonthDiscount: '할인 값을 입력해주세요.' }))
            setTwelveMonthDiscountResult(null)
            return
        }

        if (!twelveMonthPrice) {
            setErrors(prev => ({ ...prev, twelveMonthPrice: '12개월 요금을 입력해주세요.' }))
            setTwelveMonthDiscountResult(null)
            return
        }

        const totalPrice = twelveMonthPrice * 12
        let discountAmount: number

        if (twelveMonthDiscountType === 'rate') {
            discountAmount = Math.floor(totalPrice * (twelveMonthDiscountValue / 100))
        } else {
            discountAmount = twelveMonthDiscountValue
        }

        const finalPrice = totalPrice - discountAmount

        if (finalPrice <= 0) {
            setErrors(prev => ({ ...prev, twelveMonthDiscount: '할인 금액이 총액보다 크거나 같습니다. 할인 값을 조정해주세요.' }))
            setTwelveMonthDiscountResult({
                totalPrice,
                discountAmount,
                finalPrice: 0,
            })
            return
        }

        // 에러 초기화
        setErrors(prev => ({ ...prev, twelveMonthDiscount: undefined }))

        setTwelveMonthDiscountResult({
            totalPrice,
            discountAmount,
            finalPrice,
        })
    }

    // 팝업 열기
    const handleOpenAddPricePopup = () => {
        setTempSixMonth(enableSixMonth)
        setTempTwelveMonth(enableTwelveMonth)
        setShowAddPricePopup(true)
    }

    // 팝업 닫기 (취소)
    const handleCloseAddPricePopup = () => {
        setShowAddPricePopup(false)
    }

    // 팝업 확인 (추가)
    const handleConfirmAddPrice = () => {
        // 6개월이 비활성화되면 데이터 초기화
        if (enableSixMonth && !tempSixMonth) {
            setSixMonthPrice(undefined)
            setSixMonthDiscountEnabled(false)
            setSixMonthDiscountType('rate')
            setSixMonthDiscountValue(undefined)
            setSixMonthDiscountResult(null)
        }

        // 12개월이 비활성화되면 데이터 초기화
        if (enableTwelveMonth && !tempTwelveMonth) {
            setTwelveMonthPrice(undefined)
            setTwelveMonthDiscountEnabled(false)
            setTwelveMonthDiscountType('rate')
            setTwelveMonthDiscountValue(undefined)
            setTwelveMonthDiscountResult(null)
        }

        setEnableSixMonth(tempSixMonth)
        setEnableTwelveMonth(tempTwelveMonth)
        setShowAddPricePopup(false)
    }

    return (
        <div className="data-wrap">
            <Location title={pageTitle} list={BREADCRUMBS} />
            <div className="contents-wrap">
                <div className="contents-body">
                    <div className="content-wrap">
                        <div className="slidebox-wrap">
                            <div className="slidebox-header">
                                <h2>가격 관리</h2>
                                <div className="slidebox-btn-wrap">
                                    <button className="slidebox-btn" onClick={handleCancel} disabled={isSaving}>취소</button>
                                    <button className="slidebox-btn" onClick={handleSave} disabled={isSaving}>
                                        {isSaving ? '저장 중...' : '저장'}
                                    </button>
                                </div>
                            </div>
                            <div className="slidebox-body">
                                <table className="default-table">
                                    <colgroup>
                                        <col width="190px" />
                                        <col />
                                    </colgroup>
                                    <tbody>
                                        <tr>
                                            <th>요금제</th>
                                            <td><div className="filed-flx">{planTypeName}</div></td>
                                        </tr>
                                        <tr>
                                            <th>제목 <span className="red">*</span></th>
                                            <td>
                                                <Input
                                                    type="text"
                                                    value={title}
                                                    onChange={(e) => {
                                                        setTitle(e.target.value)
                                                        if (errors.title) {
                                                            setErrors(prev => ({ ...prev, title: undefined }))
                                                        }
                                                    }}
                                                    error={!!errors.title}
                                                    disabled={isInProgress}
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>기간 <span className="red">*</span></th>
                                            <td>
                                                <div className="filed-flx">
                                                    <RangeDatePicker
                                                        startDate={fromDate}
                                                        endDate={toDate}
                                                        onChange={(range: DateRange) => {
                                                            // 진행 중인 경우 종료일만 변경 가능
                                                            if (isInProgress) {
                                                                if (range.endDate) {
                                                                    const today = new Date()
                                                                    today.setHours(0, 0, 0, 0)
                                                                    const selectedDate = new Date(range.endDate)
                                                                    selectedDate.setHours(0, 0, 0, 0)

                                                                    if (selectedDate < today) {
                                                                        setErrors(prev => ({ ...prev, toDate: '종료일은 오늘 이후여야 합니다.' }))
                                                                        return
                                                                    }
                                                                }
                                                                setToDate(range.endDate)
                                                                // 시작일은 기존 값 유지, 종료일이 변경되면 자동 중복 확인
                                                                if (fromDate && range.endDate) {
                                                                    handleDuplicateCheck(fromDate, range.endDate)
                                                                }
                                                            } else {
                                                                setFromDate(range.startDate)
                                                                setToDate(range.endDate)
                                                                // 두 날짜 모두 선택되면 자동 중복 확인
                                                                if (range.startDate && range.endDate) {
                                                                    handleDuplicateCheck(range.startDate, range.endDate)
                                                                }
                                                            }
                                                            setShowDateError(false)
                                                            setShowDateSuccess(false)
                                                            if (errors.fromDate || errors.toDate || errors.dateCheck) {
                                                                setErrors(prev => ({ ...prev, fromDate: undefined, toDate: undefined, dateCheck: undefined }))
                                                            }
                                                        }}
                                                        minDate={isInProgress ? new Date() : undefined}
                                                        error={showDateError || !!(errors.fromDate || errors.toDate || errors.dateCheck)}
                                                        helpText={
                                                            isChecking
                                                                ? '중복 확인 중...'
                                                                : showDateError
                                                                    ? dateCheckMessage ?? undefined
                                                                    : showDateSuccess
                                                                        ? dateCheckMessage ?? undefined
                                                                        : errors.fromDate || errors.toDate || errors.dateCheck
                                                        }
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>1개월 요금 <span className="red">*</span></th>
                                            <td>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={monthlyPrice ?? ''}
                                                    onChange={(e) => {
                                                        handleNumberInput(e.target.value, setMonthlyPrice)
                                                        if (errors.monthlyPrice) {
                                                            setErrors(prev => ({ ...prev, monthlyPrice: undefined }))
                                                        }
                                                    }}
                                                    placeholder="숫자를 입력하세요"
                                                    error={!!errors.monthlyPrice}
                                                    helpText={errors.monthlyPrice}
                                                    endAdornment={
                                                        <button type="button" className="btn-form basic" onClick={handleOpenAddPricePopup}>요금 추가</button>
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    {/* 6개월 요금 섹션 */}
                    {enableSixMonth && (
                        <div className='content-wrap'>
                            <div className='slidebox-wrap'>
                                <table className="default-table">
                                    <colgroup>
                                        <col width="190px" />
                                        <col />
                                    </colgroup>
                                    <tbody>
                                        <tr>
                                            <th>6개월 요금 <span className="red">*</span></th>
                                            <td>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={sixMonthPrice ?? ''}
                                                    onChange={(e) => {
                                                        handleNumberInput(e.target.value, setSixMonthPrice)
                                                        if (errors.sixMonthPrice) {
                                                            setErrors(prev => ({ ...prev, sixMonthPrice: undefined }))
                                                        }
                                                    }}
                                                    placeholder="숫자를 입력하세요"
                                                    error={!!errors.sixMonthPrice}
                                                    helpText={errors.sixMonthPrice}
                                                    endAdornment={
                                                        <>
                                                            <Input
                                                                type="text"
                                                                value={sixMonthPrice ? (sixMonthPrice * 6).toLocaleString() : ''}
                                                                readOnly
                                                            />
                                                            <div className="toggle-wrap">
                                                                <span className="toggle-txt">할인</span>
                                                                <div className="toggle-btn">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="toggle-btn-six"
                                                                        checked={sixMonthDiscountEnabled}
                                                                        onChange={(e) => {
                                                                            setSixMonthDiscountEnabled(e.target.checked)
                                                                            if (!e.target.checked) {
                                                                                setSixMonthDiscountType('rate')
                                                                                setSixMonthDiscountValue(undefined)
                                                                                setSixMonthDiscountResult(null)
                                                                                if (errors.sixMonthDiscount) {
                                                                                    setErrors(prev => ({ ...prev, sixMonthDiscount: undefined }))
                                                                                }
                                                                            }
                                                                        }}
                                                                    />
                                                                    <label className="slider" htmlFor="toggle-btn-six"></label>
                                                                </div>
                                                            </div>
                                                        </>
                                                    }
                                                />
                                            </td>
                                        </tr>
                                        {sixMonthDiscountEnabled && (
                                            <tr>
                                                <th>요금할인 <span className="red">*</span></th>
                                                <td>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={sixMonthDiscountValue ?? ''}
                                                        onChange={(e) => {
                                                            handleNumberInput(e.target.value, setSixMonthDiscountValue)
                                                            if (errors.sixMonthDiscount) {
                                                                setErrors(prev => ({ ...prev, sixMonthDiscount: undefined }))
                                                            }
                                                        }}
                                                        placeholder="숫자를 입력하세요"
                                                        error={!!errors.sixMonthDiscount}
                                                        helpText={errors.sixMonthDiscount || (sixMonthDiscountResult ? `${sixMonthDiscountResult.totalPrice.toLocaleString()} – (할인) ${sixMonthDiscountResult.discountAmount.toLocaleString()}원 = ${sixMonthDiscountResult.finalPrice.toLocaleString()}원` : undefined)}
                                                        startAdornment={
                                                            <div className="mx-300">
                                                                <select
                                                                    className="select-form"
                                                                    value={sixMonthDiscountType}
                                                                    onChange={(e) => setSixMonthDiscountType(e.target.value as 'rate' | 'amount')}
                                                                >
                                                                    <option value="rate">할인율</option>
                                                                    <option value="amount">할인금액</option>
                                                                </select>
                                                            </div>
                                                        }
                                                        endAdornment={
                                                            <button
                                                                type="button"
                                                                className="btn-form basic"
                                                                onClick={calculateSixMonthDiscount}
                                                            >
                                                                계산하기
                                                            </button>
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 12개월 요금 섹션 */}
                    {enableTwelveMonth && (
                        <div className='content-wrap'>
                            <div className='slidebox-wrap'>
                                <table className="default-table">
                                    <colgroup>
                                        <col width="190px" />
                                        <col />
                                    </colgroup>
                                    <tbody>
                                        <tr>
                                            <th>12개월 요금 <span className="red">*</span></th>
                                            <td>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={twelveMonthPrice ?? ''}
                                                    onChange={(e) => {
                                                        handleNumberInput(e.target.value, setTwelveMonthPrice)
                                                        if (errors.twelveMonthPrice) {
                                                            setErrors(prev => ({ ...prev, twelveMonthPrice: undefined }))
                                                        }
                                                    }}
                                                    placeholder="숫자를 입력하세요"
                                                    error={!!errors.twelveMonthPrice}
                                                    helpText={errors.twelveMonthPrice}
                                                    endAdornment={
                                                        <>
                                                            <Input
                                                                type="text"
                                                                value={twelveMonthPrice ? (twelveMonthPrice * 12).toLocaleString() : ''}
                                                                readOnly
                                                            />
                                                            <div className="toggle-wrap">
                                                                <span className="toggle-txt">할인</span>
                                                                <div className="toggle-btn">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="toggle-btn-twelve"
                                                                        checked={twelveMonthDiscountEnabled}
                                                                        onChange={(e) => {
                                                                            setTwelveMonthDiscountEnabled(e.target.checked)
                                                                            if (!e.target.checked) {
                                                                                setTwelveMonthDiscountType('rate')
                                                                                setTwelveMonthDiscountValue(undefined)
                                                                                setTwelveMonthDiscountResult(null)
                                                                                if (errors.twelveMonthDiscount) {
                                                                                    setErrors(prev => ({ ...prev, twelveMonthDiscount: undefined }))
                                                                                }
                                                                            }
                                                                        }}
                                                                    />
                                                                    <label className="slider" htmlFor="toggle-btn-twelve"></label>
                                                                </div>
                                                            </div>
                                                        </>
                                                    }
                                                />
                                            </td>
                                        </tr>
                                        {twelveMonthDiscountEnabled && (
                                            <tr>
                                                <th>요금할인 <span className="red">*</span></th>
                                                <td>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={twelveMonthDiscountValue ?? ''}
                                                        onChange={(e) => {
                                                            handleNumberInput(e.target.value, setTwelveMonthDiscountValue)
                                                            if (errors.twelveMonthDiscount) {
                                                                setErrors(prev => ({ ...prev, twelveMonthDiscount: undefined }))
                                                            }
                                                        }}
                                                        placeholder="숫자를 입력하세요"
                                                        error={!!errors.twelveMonthDiscount}
                                                        helpText={errors.twelveMonthDiscount || (twelveMonthDiscountResult ? `${twelveMonthDiscountResult.totalPrice.toLocaleString()} – (할인) ${twelveMonthDiscountResult.discountAmount.toLocaleString()}원 = ${twelveMonthDiscountResult.finalPrice.toLocaleString()}원` : undefined)}
                                                        startAdornment={
                                                            <div className="mx-300">
                                                                <select
                                                                    className="select-form"
                                                                    value={twelveMonthDiscountType}
                                                                    onChange={(e) => setTwelveMonthDiscountType(e.target.value as 'rate' | 'amount')}
                                                                >
                                                                    <option value="rate">할인율</option>
                                                                    <option value="amount">할인금액</option>
                                                                </select>
                                                            </div>
                                                        }
                                                        endAdornment={
                                                            <button
                                                                type="button"
                                                                className="btn-form basic"
                                                                onClick={calculateTwelveMonthDiscount}
                                                            >
                                                                계산하기
                                                            </button>
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 요금 추가 팝업 */}
            {showAddPricePopup && (
                <div className="modal-popup">
                    <div className="modal-dialog small">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>요금 추가</h2>
                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={handleCloseAddPricePopup}
                                />
                            </div>
                            <div className="modal-body">
                                <div className="pop-frame">
                                    <table className="comparison-table">
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <div className="filed-check-flx">
                                                        <div className="check-form-box">
                                                            <input type="checkbox" name="tempSave" id="tempSixMonth" checked={tempSixMonth} onChange={(e) => setTempSixMonth(e.target.checked)} />
                                                            <label htmlFor="tempSixMonth">6개월 요금</label>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <div className="filed-check-flx">
                                                        <div className="check-form-box">
                                                            <input type="checkbox" name="tempSave" id="tempTwelveMonth" checked={tempTwelveMonth} onChange={(e) => setTempTwelveMonth(e.target.checked)} />
                                                            <label htmlFor="tempTwelveMonth">12개월 요금</label>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-form"
                                    onClick={handleCloseAddPricePopup}
                                >
                                    취소
                                </button>
                                <button
                                    type="button"
                                    className="btn-form basic"
                                    onClick={handleConfirmAddPrice}
                                >
                                    추가
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
