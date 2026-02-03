'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import Location from '@/components/ui/Location'
import { Input } from '@/components/common/ui'
import { usePlanDetail, useUpdatePlanHeader } from '@/hooks/queries'
import { PlanDetailResponse, UpdatePlanHeaderRequest } from '@/types/plans'
import { useCommonCode } from '@/hooks/useCommonCode'

const BREADCRUMBS = ['과금관리', 'ERP 요금제 관리', 'ERP요금제 헤더 수정']

interface PlanHeaderProps {
    planId: number
}

export default function PlanHeader({ planId }: PlanHeaderProps) {
    const router = useRouter()
    const { data: plan, isPending, error } = usePlanDetail(planId)
    const updateMutation = useUpdatePlanHeader()
    const { children: planFeatures, loading: planFeaturesLoading } = useCommonCode('PLANFT')

    const handleCancel = () => {
        router.push(`/subscription/${planId}`)
    }

    const handleSave = async (data: UpdatePlanHeaderRequest) => {
        try {
            await updateMutation.mutateAsync({ id: planId, data })
            router.push(`/subscription/${planId}`)
        } catch (err) {
            console.error('저장 실패:', err)
        }
    }

    if (isPending || planFeaturesLoading) {
        return (
            <div className="data-wrap">
                <Location title="ERP요금제 헤더 수정" list={BREADCRUMBS} />
                <div className="loading-wrap">로딩 중...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="data-wrap">
                <Location title="ERP요금제 헤더 수정" list={BREADCRUMBS} />
                <div className="error-wrap">
                    <div className="form-helper error">오류가 발생했습니다: {error.message}</div>
                </div>
            </div>
        )
    }

    if (!plan) {
        return (
            <div className="data-wrap">
                <Location title="ERP요금제 헤더 수정" list={BREADCRUMBS} />
                <div className="empty-wrap">
                    <div className="empty-data">요금제를 찾을 수 없습니다.</div>
                </div>
            </div>
        )
    }

    return (
        <div className="data-wrap">
            <Location title="ERP요금제 헤더 수정" list={BREADCRUMBS} />
            <div className="contents-wrap">
                <div className="contents-body">
                    <div className="content-wrap">
                        <PlanHeaderForm
                            plan={plan}
                            planFeatures={planFeatures}
                            onCancel={handleCancel}
                            onSave={handleSave}
                            isSaving={updateMutation.isPending}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

interface CommonCodeItem {
    code: string
    name: string
}

interface FeatureState {
    featureCode: string
    featureName: string
    enabled: boolean
}

interface PlanHeaderFormProps {
    plan: PlanDetailResponse
    planFeatures: CommonCodeItem[]
    onCancel: () => void
    onSave: (data: UpdatePlanHeaderRequest) => void
    isSaving: boolean
}

function PlanHeaderForm({ plan, planFeatures, onCancel, onSave, isSaving }: PlanHeaderFormProps) {
    const [slideboxOpen, setSlideboxOpen] = useState(true)
    const [storeLimit, setStoreLimit] = useState<number | null | undefined>(plan.storeLimit)
    const [employeeLimit, setEmployeeLimit] = useState<number | null | undefined>(plan.employeeLimit)
    const [features, setFeatures] = useState<FeatureState[]>(() =>
        planFeatures.map(pf => ({
            featureCode: pf.code,
            featureName: pf.name,
            enabled: plan.features.find(f => f.featureCode === pf.code)?.enabled ?? false,
        }))
    )
    const [errors, setErrors] = useState<{ storeLimit?: string; employeeLimit?: string }>({})

    const handleStoreLimitToggle = () => {
        setStoreLimit(storeLimit === null ? undefined : null)
        setErrors(prev => ({ ...prev, storeLimit: undefined }))
    }

    const handleEmployeeLimitToggle = () => {
        setEmployeeLimit(employeeLimit === null ? undefined : null)
        setErrors(prev => ({ ...prev, employeeLimit: undefined }))
    }

    const handleFeatureToggle = (featureCode: string) => {
        setFeatures(prev =>
            prev.map(f =>
                f.featureCode === featureCode ? { ...f, enabled: !f.enabled } : f
            )
        )
    }

    const handleNumberInput = (
        value: string,
        setter: (val: number | null | undefined) => void,
        errorKey: 'storeLimit' | 'employeeLimit'
    ) => {
        const filtered = value.replace(/[^0-9]/g, '')
        if (filtered === '') {
            setter(undefined)
        } else {
            setter(Number(filtered))
        }
        setErrors(prev => ({ ...prev, [errorKey]: undefined }))
    }

    const validate = (): boolean => {
        const newErrors: { storeLimit?: string; employeeLimit?: string } = {}

        if (storeLimit !== null && (storeLimit === undefined || isNaN(storeLimit))) {
            newErrors.storeLimit = '점포 수를 입력해주세요.'
        }

        if (employeeLimit !== null && (employeeLimit === undefined || isNaN(employeeLimit))) {
            newErrors.employeeLimit = '직원 수를 입력해주세요.'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = () => {
        if (validate()) {
            const payload: UpdatePlanHeaderRequest = {
                storeLimit: storeLimit === undefined ? null : storeLimit,
                employeeLimit: employeeLimit === undefined ? null : employeeLimit,
                features: features.map(f => ({ featureCode: f.featureCode, enabled: f.enabled })),
            }
            onSave(payload)
        }
    }

    return (
        <div className={`slidebox-wrap ${slideboxOpen ? '' : 'close'}`}>
            <div className="slidebox-header">
                <h2>{plan.planTypeName}</h2>
                <div className="slidebox-btn-wrap">
                    <button className="slidebox-btn" onClick={onCancel} disabled={isSaving}>취소</button>
                    <button className="slidebox-btn" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                    <button className="slidebox-btn arr" onClick={() => setSlideboxOpen(!slideboxOpen)}>
                        <i className="arr-icon"></i>
                    </button>
                </div>
            </div>
            <AnimateHeight duration={300} height={slideboxOpen ? 'auto' : 0}>
                <div className="slidebox-body">
                    <table className="default-table">
                        <colgroup>
                            <col width="190px" />
                            <col />
                        </colgroup>
                        <tbody>
                            <tr className="header-row">
                                <th>요금제명</th>
                                <td>{plan.planTypeName}</td>
                            </tr>
                            <tr>
                                <th>
                                    점포 <span className="red">*</span>
                                </th>
                                <td>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        value={storeLimit ?? ''}
                                        onChange={(e) => handleNumberInput(e.target.value, setStoreLimit, 'storeLimit')}
                                        disabled={storeLimit === null}
                                        placeholder="숫자를 입력하세요"
                                        error={!!errors.storeLimit}
                                        helpText={errors.storeLimit}
                                        endAdornment={
                                            <div className="toggle-wrap">
                                                <span className="toggle-txt">제한없음</span>
                                                <div className="toggle-btn">
                                                    <input
                                                        type="checkbox"
                                                        id="toggle-store"
                                                        checked={storeLimit === null}
                                                        onChange={handleStoreLimitToggle}
                                                    />
                                                    <label className="slider" htmlFor="toggle-store"></label>
                                                </div>
                                            </div>
                                        }
                                    />
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    직원 <span className="red">*</span>
                                </th>
                                <td>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        value={employeeLimit ?? ''}
                                        onChange={(e) => handleNumberInput(e.target.value, setEmployeeLimit, 'employeeLimit')}
                                        disabled={employeeLimit === null}
                                        placeholder="숫자를 입력하세요"
                                        error={!!errors.employeeLimit}
                                        helpText={errors.employeeLimit}
                                        endAdornment={
                                            <div className="toggle-wrap">
                                                <span className="toggle-txt">제한없음</span>
                                                <div className="toggle-btn">
                                                    <input
                                                        type="checkbox"
                                                        id="toggle-employee"
                                                        checked={employeeLimit === null}
                                                        onChange={handleEmployeeLimitToggle}
                                                    />
                                                    <label className="slider" htmlFor="toggle-employee"></label>
                                                </div>
                                            </div>
                                        }
                                    />
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    포함기능 <span className="red">*</span>
                                </th>
                                <td>
                                    <div className="pricing-check-wrap">
                                        {features.map(feature => (
                                            <button
                                                key={feature.featureCode}
                                                className={`pricing-btn outline ${feature.enabled ? 'act' : ''}`}
                                                onClick={() => handleFeatureToggle(feature.featureCode)}
                                            >
                                                {feature.featureName}
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
    )
}
