'use client'

import { useState } from 'react'
import AnimateHeight from 'react-animate-height'
import { PlanDetailResponse, PlanFeature } from '@/types/plans'

interface PlanHeaderProps {
    plan: PlanDetailResponse
    onCancel?: () => void
    onSave?: (data: Partial<PlanDetailResponse>) => void
}

export default function PlanHeader({ plan, onCancel, onSave }: PlanHeaderProps) {
    const [slideboxOpen, setSlideboxOpen] = useState(true)
    const [storeLimit, setStoreLimit] = useState<number | null>(plan.storeLimit)
    const [employeeLimit, setEmployeeLimit] = useState<number | null>(plan.employeeLimit)
    const [features, setFeatures] = useState<PlanFeature[]>(plan.features)

    const handleStoreLimitToggle = () => {
        setStoreLimit(storeLimit === null ? 1 : null)
    }

    const handleEmployeeLimitToggle = () => {
        setEmployeeLimit(employeeLimit === null ? 1 : null)
    }

    const handleFeatureToggle = (featureId: number) => {
        setFeatures(prev =>
            prev.map(f =>
                f.featureId === featureId ? { ...f, isIncluded: !f.isIncluded } : f
            )
        )
    }

    const handleSave = () => {
        onSave?.({
            storeLimit,
            employeeLimit,
            features,
        })
    }

    return (
        <div className={`slidebox-wrap ${slideboxOpen ? '' : 'close'}`}>
            <div className="slidebox-header">
                <h2>{plan.planTypeName}</h2>
                <div className="slidebox-btn-wrap">
                    <button className="slidebox-btn" onClick={onCancel}>취소</button>
                    <button className="slidebox-btn" onClick={handleSave}>저장</button>
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
                                    <div className="filed-flx">
                                        <div className="mx-200">
                                            <input
                                                type="number"
                                                className="input-frame"
                                                value={storeLimit ?? ''}
                                                onChange={(e) => setStoreLimit(e.target.value ? Number(e.target.value) : null)}
                                                disabled={storeLimit === null}
                                            />
                                        </div>
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
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    직원 <span className="red">*</span>
                                </th>
                                <td>
                                    <div className="filed-flx">
                                        <div className="mx-200">
                                            <input
                                                type="number"
                                                className="input-frame"
                                                value={employeeLimit ?? ''}
                                                onChange={(e) => setEmployeeLimit(e.target.value ? Number(e.target.value) : null)}
                                                disabled={employeeLimit === null}
                                            />
                                        </div>
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
                                    </div>
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
                                                key={feature.featureId}
                                                className={`pricing-btn outline ${feature.isIncluded ? 'act' : ''}`}
                                                onClick={() => handleFeatureToggle(feature.featureId)}
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
