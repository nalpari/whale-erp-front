'use client'

import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
import { Input, useAlert } from '@/components/common/ui'
import { useState, useCallback } from 'react'
import { useCheckPlanPricingDuplicate, useCreatePlanPricing, useUpdatePlanPricing } from '@/hooks/queries/use-plans-queries'
import type { CreatePlanPricingRequest, PlanPricing } from '@/types/plans'
import { format } from 'date-fns'

const BREADCRUMBS = ['과금관리', 'ERP 요금제 관리', 'ERP요금제 정보 관리']

interface PlanPricingFormProps {
    planId: number
    planTypeId: number
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

interface PeriodPricing {
    price: number | undefined
    discountEnabled: boolean
    discountType: 'rate' | 'amount'
    discountValue: number | undefined
    discountResult: {
        totalPrice: number
        discountAmount: number
        finalPrice: number
    } | null
}

export default function PlanPricingForm({ planId, planTypeId, planTypeName, mode, initialData, pricingId }: PlanPricingFormProps) {
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

    // 6개월 요금 상태 (그룹)
    const [sixMonth, setSixMonth] = useState<PeriodPricing>(() => ({
        price: initialData?.sixMonthPrice ?? undefined,
        discountEnabled: initialData?.sixMonthDiscountRate != null || initialData?.sixMonthDiscountPrice != null,
        discountType: initialData?.sixMonthDiscountPrice != null ? 'amount' : 'rate',
        discountValue: initialData?.sixMonthDiscountRate ?? initialData?.sixMonthDiscountPrice ?? undefined,
        discountResult: null,
    }))

    // 12개월 요금 상태 (그룹)
    const [twelveMonth, setTwelveMonth] = useState<PeriodPricing>(() => ({
        price: initialData?.yearlyPrice ?? undefined,
        discountEnabled: initialData?.yearlyDiscountRate != null || initialData?.yearlyDiscountPrice != null,
        discountType: initialData?.yearlyDiscountPrice != null ? 'amount' : 'rate',
        discountValue: initialData?.yearlyDiscountRate ?? initialData?.yearlyDiscountPrice ?? undefined,
        discountResult: null,
    }))

    const { mutateAsync: checkDuplicate, isPending: isChecking } = useCheckPlanPricingDuplicate()
    const { mutateAsync: createPricing, isPending: isCreating } = useCreatePlanPricing()
    const { mutateAsync: updatePricing, isPending: isUpdating } = useUpdatePlanPricing()

    const isSaving = isCreating || isUpdating
    const pageTitle = mode === 'create' ? '가격 정보 등록' : '가격 정보 수정'

    const handleCancel = () => {
        router.push(`/subscription/${planTypeId}`)
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
            if (sixMonth.price === undefined) {
                newErrors.sixMonthPrice = '6개월 요금을 입력해주세요.'
            }
            if (sixMonth.discountEnabled) {
                if (sixMonth.discountValue === undefined) {
                    newErrors.sixMonthDiscount = '6개월 할인 값을 입력해주세요.'
                } else if (sixMonth.discountResult && sixMonth.discountResult.finalPrice <= 0) {
                    newErrors.sixMonthDiscount = '할인 금액이 총액보다 크거나 같습니다. 할인 값을 조정해주세요.'
                }
            }
        }

        // 12개월 요금 검증
        if (enableTwelveMonth) {
            if (twelveMonth.price === undefined) {
                newErrors.twelveMonthPrice = '12개월 요금을 입력해주세요.'
            }
            if (twelveMonth.discountEnabled) {
                if (twelveMonth.discountValue === undefined) {
                    newErrors.twelveMonthDiscount = '12개월 할인 값을 입력해주세요.'
                } else if (twelveMonth.discountResult && twelveMonth.discountResult.finalPrice <= 0) {
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
        if (enableSixMonth && sixMonth.discountEnabled && sixMonth.discountValue) {
            if (sixMonth.discountType === 'rate') {
                sixMonthDiscountRate = sixMonth.discountValue
            } else {
                sixMonthDiscountPrice = sixMonth.discountValue
            }
        }

        // 12개월 할인 필드 설정 (배타적)
        let yearlyDiscountRate: number | null = null
        let yearlyDiscountPrice: number | null = null
        if (enableTwelveMonth && twelveMonth.discountEnabled && twelveMonth.discountValue) {
            if (twelveMonth.discountType === 'rate') {
                yearlyDiscountRate = twelveMonth.discountValue
            } else {
                yearlyDiscountPrice = twelveMonth.discountValue
            }
        }

        const requestData: CreatePlanPricingRequest = {
            title: title.trim(),
            startDate: format(fromDate!, 'yyyy-MM-dd'),
            endDate: format(toDate!, 'yyyy-MM-dd'),
            monthlyPrice: monthlyPrice!,
            sixMonthPrice: enableSixMonth ? sixMonth.price! : null,
            sixMonthDiscountRate,
            sixMonthDiscountPrice,
            yearlyPrice: enableTwelveMonth ? twelveMonth.price! : null,
            yearlyDiscountRate,
            yearlyDiscountPrice,
        }

        try {
            if (mode === 'create') {
                await createPricing({ planId, planTypeId, data: requestData })
            } else {
                await updatePricing({ planId, planTypeId, pricingId: pricingId!, data: requestData })
            }
            router.push(`/subscription/${planTypeId}`)
        } catch (error) {
            console.error('가격 정책 저장 실패:', error)
            await alert(`가격 정책 ${mode === 'create' ? '등록' : '수정'}에 실패했습니다. 다시 시도해주세요.`)
        }
    }

    const handleDuplicateCheck = useCallback(async (start?: Date | null, end?: Date | null) => {
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
    }, [checkDuplicate, planId, mode, pricingId, fromDate, toDate, errors.dateCheck])

    const handleDateRangeChange = useCallback((range: DateRange) => {
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
            if (fromDate && range.endDate) {
                handleDuplicateCheck(fromDate, range.endDate)
            }
        } else {
            setFromDate(range.startDate)
            setToDate(range.endDate)
            if (range.startDate && range.endDate) {
                handleDuplicateCheck(range.startDate, range.endDate)
            }
        }
        setShowDateError(false)
        setShowDateSuccess(false)
        setErrors(prev => ({ ...prev, fromDate: undefined, toDate: undefined, dateCheck: undefined }))
    }, [isInProgress, fromDate, handleDuplicateCheck])

    const handleNumberInput = (
        value: string,
        setter: (val: number | undefined) => void,
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
        if (!sixMonth.discountValue) {
            setErrors(prev => ({ ...prev, sixMonthDiscount: '할인 값을 입력해주세요.' }))
            setSixMonth(prev => ({ ...prev, discountResult: null }))
            return
        }

        if (!sixMonth.price) {
            setErrors(prev => ({ ...prev, sixMonthPrice: '6개월 요금을 입력해주세요.' }))
            setSixMonth(prev => ({ ...prev, discountResult: null }))
            return
        }

        const totalPrice = sixMonth.price * 6
        let discountAmount: number

        if (sixMonth.discountType === 'rate') {
            discountAmount = Math.floor(totalPrice * (sixMonth.discountValue / 100))
        } else {
            discountAmount = sixMonth.discountValue
        }

        const finalPrice = totalPrice - discountAmount

        if (finalPrice <= 0) {
            setErrors(prev => ({ ...prev, sixMonthDiscount: '할인 금액이 총액보다 크거나 같습니다. 할인 값을 조정해주세요.' }))
            setSixMonth(prev => ({ ...prev, discountResult: { totalPrice, discountAmount, finalPrice: 0 } }))
            return
        }

        // 에러 초기화
        setErrors(prev => ({ ...prev, sixMonthDiscount: undefined }))

        setSixMonth(prev => ({ ...prev, discountResult: { totalPrice, discountAmount, finalPrice } }))
    }

    // 12개월 할인 계산
    const calculateTwelveMonthDiscount = () => {
        if (!twelveMonth.discountValue) {
            setErrors(prev => ({ ...prev, twelveMonthDiscount: '할인 값을 입력해주세요.' }))
            setTwelveMonth(prev => ({ ...prev, discountResult: null }))
            return
        }

        if (!twelveMonth.price) {
            setErrors(prev => ({ ...prev, twelveMonthPrice: '12개월 요금을 입력해주세요.' }))
            setTwelveMonth(prev => ({ ...prev, discountResult: null }))
            return
        }

        const totalPrice = twelveMonth.price * 12
        let discountAmount: number

        if (twelveMonth.discountType === 'rate') {
            discountAmount = Math.floor(totalPrice * (twelveMonth.discountValue / 100))
        } else {
            discountAmount = twelveMonth.discountValue
        }

        const finalPrice = totalPrice - discountAmount

        if (finalPrice <= 0) {
            setErrors(prev => ({ ...prev, twelveMonthDiscount: '할인 금액이 총액보다 크거나 같습니다. 할인 값을 조정해주세요.' }))
            setTwelveMonth(prev => ({ ...prev, discountResult: { totalPrice, discountAmount, finalPrice: 0 } }))
            return
        }

        // 에러 초기화
        setErrors(prev => ({ ...prev, twelveMonthDiscount: undefined }))

        setTwelveMonth(prev => ({ ...prev, discountResult: { totalPrice, discountAmount, finalPrice } }))
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
            setSixMonth({ price: undefined, discountEnabled: false, discountType: 'rate', discountValue: undefined, discountResult: null })
        }

        // 12개월이 비활성화되면 데이터 초기화
        if (enableTwelveMonth && !tempTwelveMonth) {
            setTwelveMonth({ price: undefined, discountEnabled: false, discountType: 'rate', discountValue: undefined, discountResult: null })
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
                                                        onChange={handleDateRangeChange}
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
                                                    value={sixMonth.price ?? ''}
                                                    onChange={(e) => {
                                                        handleNumberInput(e.target.value, (v) => setSixMonth(prev => ({ ...prev, price: v })))
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
                                                                value={sixMonth.price ? (sixMonth.price * 6).toLocaleString() : ''}
                                                                readOnly
                                                            />
                                                            <div className="toggle-wrap">
                                                                <span className="toggle-txt">할인</span>
                                                                <div className="toggle-btn">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="toggle-btn-six"
                                                                        checked={sixMonth.discountEnabled}
                                                                        onChange={(e) => {
                                                                            if (!e.target.checked) {
                                                                                setSixMonth(prev => ({ ...prev, discountEnabled: false, discountType: 'rate', discountValue: undefined, discountResult: null }))
                                                                                if (errors.sixMonthDiscount) {
                                                                                    setErrors(prev => ({ ...prev, sixMonthDiscount: undefined }))
                                                                                }
                                                                            } else {
                                                                                setSixMonth(prev => ({ ...prev, discountEnabled: true }))
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
                                        {sixMonth.discountEnabled && (
                                            <tr>
                                                <th>요금할인 <span className="red">*</span></th>
                                                <td>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={sixMonth.discountValue ?? ''}
                                                        onChange={(e) => {
                                                            handleNumberInput(e.target.value, (v) => setSixMonth(prev => ({ ...prev, discountValue: v })))
                                                            if (errors.sixMonthDiscount) {
                                                                setErrors(prev => ({ ...prev, sixMonthDiscount: undefined }))
                                                            }
                                                        }}
                                                        placeholder="숫자를 입력하세요"
                                                        error={!!errors.sixMonthDiscount}
                                                        helpText={errors.sixMonthDiscount || (sixMonth.discountResult ? `${sixMonth.discountResult.totalPrice.toLocaleString()} – (할인) ${sixMonth.discountResult.discountAmount.toLocaleString()}원 = ${sixMonth.discountResult.finalPrice.toLocaleString()}원` : undefined)}
                                                        startAdornment={
                                                            <div className="mx-300">
                                                                <select
                                                                    className="select-form"
                                                                    value={sixMonth.discountType}
                                                                    onChange={(e) => setSixMonth(prev => ({ ...prev, discountType: e.target.value as 'rate' | 'amount' }))}
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
                                                    value={twelveMonth.price ?? ''}
                                                    onChange={(e) => {
                                                        handleNumberInput(e.target.value, (v) => setTwelveMonth(prev => ({ ...prev, price: v })))
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
                                                                value={twelveMonth.price ? (twelveMonth.price * 12).toLocaleString() : ''}
                                                                readOnly
                                                            />
                                                            <div className="toggle-wrap">
                                                                <span className="toggle-txt">할인</span>
                                                                <div className="toggle-btn">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="toggle-btn-twelve"
                                                                        checked={twelveMonth.discountEnabled}
                                                                        onChange={(e) => {
                                                                            if (!e.target.checked) {
                                                                                setTwelveMonth(prev => ({ ...prev, discountEnabled: false, discountType: 'rate', discountValue: undefined, discountResult: null }))
                                                                                if (errors.twelveMonthDiscount) {
                                                                                    setErrors(prev => ({ ...prev, twelveMonthDiscount: undefined }))
                                                                                }
                                                                            } else {
                                                                                setTwelveMonth(prev => ({ ...prev, discountEnabled: true }))
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
                                        {twelveMonth.discountEnabled && (
                                            <tr>
                                                <th>요금할인 <span className="red">*</span></th>
                                                <td>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={twelveMonth.discountValue ?? ''}
                                                        onChange={(e) => {
                                                            handleNumberInput(e.target.value, (v) => setTwelveMonth(prev => ({ ...prev, discountValue: v })))
                                                            if (errors.twelveMonthDiscount) {
                                                                setErrors(prev => ({ ...prev, twelveMonthDiscount: undefined }))
                                                            }
                                                        }}
                                                        placeholder="숫자를 입력하세요"
                                                        error={!!errors.twelveMonthDiscount}
                                                        helpText={errors.twelveMonthDiscount || (twelveMonth.discountResult ? `${twelveMonth.discountResult.totalPrice.toLocaleString()} – (할인) ${twelveMonth.discountResult.discountAmount.toLocaleString()}원 = ${twelveMonth.discountResult.finalPrice.toLocaleString()}원` : undefined)}
                                                        startAdornment={
                                                            <div className="mx-300">
                                                                <select
                                                                    className="select-form"
                                                                    value={twelveMonth.discountType}
                                                                    onChange={(e) => setTwelveMonth(prev => ({ ...prev, discountType: e.target.value as 'rate' | 'amount' }))}
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
