'use client'
import React, { useState } from 'react'
import { Tooltip } from 'react-tooltip'
import Location from '@/components/ui/Location'
import {
  usePayrollStatementSettings,
  useSavePayrollStatementSettings,
} from '@/hooks/queries/use-employee-settings-queries'
import {
  DEFAULT_PAYROLL_STATEMENT_SETTINGS,
  type PayrollStatementSettingsContent,
  type BonusCategory,
} from '@/lib/api/payrollStatementSettings'
import { DEFAULT_HEAD_OFFICE_ID, DEFAULT_FRANCHISE_ID } from '@/lib/constants/organization'

// 상여금 분류 행 컴포넌트
interface BonusCategoryRowProps {
  item: BonusCategory
  index: number
  onNameChange: (id: number, name: string) => void
  onAmountChange: (id: number, amount: number) => void
  onRemarkChange: (id: number, remark: string) => void
  onAddItem: () => void
  onDeleteItem: (id: number) => void
}

function BonusCategoryRow({
  item,
  index,
  onNameChange,
  onAmountChange,
  onRemarkChange,
  onAddItem,
  onDeleteItem,
}: BonusCategoryRowProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

  const handleAddItem = () => {
    setIsTooltipOpen(false)
    onAddItem()
  }

  const handleDeleteItem = () => {
    setIsTooltipOpen(false)
    onDeleteItem(item.id)
  }

  return (
    <tr>
      <th>상여분류 #{index + 1}</th>
      <td>
        <div className="filed-flx">
          <div className="block" style={{ flex: 1 }}>
            <input
              type="text"
              className="input-frame"
              placeholder="상여 이름"
              value={item.name}
              onChange={(e) => onNameChange(item.id, e.target.value)}
            />
          </div>
          <div className="block" style={{ maxWidth: '150px' }}>
            <input
              type="number"
              className="input-frame"
              placeholder="금액"
              value={item.amount || ''}
              onChange={(e) => onAmountChange(item.id, Number(e.target.value) || 0)}
            />
          </div>
          <div className="block" style={{ maxWidth: '200px' }}>
            <input
              type="text"
              className="input-frame"
              placeholder="비고"
              value={item.remark}
              onChange={(e) => onRemarkChange(item.id, e.target.value)}
            />
          </div>
          <div className="auto-right">
            <div className="more-btn">
              <span
                className="icon-more"
                id={`bonus-category-${item.id}`}
                onClick={() => setIsTooltipOpen(!isTooltipOpen)}
              ></span>
              <Tooltip
                className="option-list"
                anchorSelect={`#bonus-category-${item.id}`}
                place="left-end"
                offset={0}
                isOpen={isTooltipOpen}
                setIsOpen={setIsTooltipOpen}
                clickable={true}
                opacity={1}
              >
                <button
                  className="option-item"
                  onClick={handleAddItem}
                >
                  상여 분류 추가
                </button>
                <button
                  className="option-item"
                  onClick={handleDeleteItem}
                >
                  상여 분류 삭제
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function PayrollStatementSettings() {
  // 본사/가맹점 선택
  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState<number>(DEFAULT_HEAD_OFFICE_ID)
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<number>(DEFAULT_FRANCHISE_ID)

  // 급여명세서 설정
  const [localSettings, setLocalSettings] = useState<PayrollStatementSettingsContent | null>(null)

  // TanStack Query hooks
  const { data: fetchedSettings, isPending: isLoading, refetch } = usePayrollStatementSettings(
    { headOfficeId: selectedHeadOfficeId, franchiseId: selectedFranchiseId },
    true
  )
  const saveMutation = useSavePayrollStatementSettings()

  // React 19: derived state - settings 우선순위: localSettings > fetchedSettings > defaults
  const settings = localSettings ?? fetchedSettings ?? DEFAULT_PAYROLL_STATEMENT_SETTINGS

  // React 19 패턴: 렌더 단계에서 데이터 로드
  if (fetchedSettings && !localSettings) {
    setLocalSettings(fetchedSettings)
  }

  // 검색
  const handleSearch = () => {
    setLocalSettings(null)
    refetch()
  }

  // 저장
  const handleSave = async () => {
    // 빈 값인 상여금 분류 제거
    const filteredBonusCategories = settings.bonusCategories
      .filter(item => item.name.trim() !== '')
      .map((item, index) => ({ ...item, sortOrder: index + 1 }))

    const updatedSettings = {
      ...settings,
      bonusCategories: filteredBonusCategories
    }

    try {
      await saveMutation.mutateAsync({
        headOfficeId: selectedHeadOfficeId,
        franchiseId: selectedFranchiseId,
        settings: updatedSettings
      })
      setLocalSettings(updatedSettings)
      alert('저장되었습니다.')
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장에 실패했습니다.')
    }
  }

  // 설정 변경 핸들러
  const handleSettingChange = <K extends keyof PayrollStatementSettingsContent>(
    field: K,
    value: PayrollStatementSettingsContent[K]
  ) => {
    setLocalSettings(prev => ({
      ...(prev ?? DEFAULT_PAYROLL_STATEMENT_SETTINGS),
      [field]: value
    }))
  }

  // 다음 상여금 코드 생성
  const generateNextBonusCode = (items: BonusCategory[]): string => {
    const existingNumbers = items
      .map(item => {
        const match = item.code.match(/^BONUS_(\d+)$/)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter(num => num > 0)

    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
    const nextNumber = maxNumber + 1
    return `BONUS_${String(nextNumber).padStart(3, '0')}`
  }

  // 상여금 분류 추가
  const handleAddBonusCategory = () => {
    const items = settings.bonusCategories
    const newId = Math.max(...items.map(i => i.id), 0) + 1
    const newCode = generateNextBonusCode(items)
    setLocalSettings(prev => ({
      ...(prev ?? DEFAULT_PAYROLL_STATEMENT_SETTINGS),
      bonusCategories: [
        ...(prev?.bonusCategories ?? []),
        { id: newId, code: newCode, name: '', amount: 0, remark: '', sortOrder: items.length + 1 }
      ]
    }))
  }

  // 상여금 분류 삭제
  const handleDeleteBonusCategory = (id: number) => {
    setLocalSettings(prev => ({
      ...(prev ?? DEFAULT_PAYROLL_STATEMENT_SETTINGS),
      bonusCategories: (prev?.bonusCategories ?? [])
        .filter(item => item.id !== id)
        .map((item, index) => ({ ...item, sortOrder: index + 1 }))
    }))
  }

  // 상여금 분류 이름 변경
  const handleBonusCategoryNameChange = (id: number, name: string) => {
    setLocalSettings(prev => ({
      ...(prev ?? DEFAULT_PAYROLL_STATEMENT_SETTINGS),
      bonusCategories: (prev?.bonusCategories ?? []).map(item =>
        item.id === id ? { ...item, name } : item
      )
    }))
  }

  // 상여금 분류 금액 변경
  const handleBonusCategoryAmountChange = (id: number, amount: number) => {
    setLocalSettings(prev => ({
      ...(prev ?? DEFAULT_PAYROLL_STATEMENT_SETTINGS),
      bonusCategories: (prev?.bonusCategories ?? []).map(item =>
        item.id === id ? { ...item, amount } : item
      )
    }))
  }

  // 상여금 분류 비고 변경
  const handleBonusCategoryRemarkChange = (id: number, remark: string) => {
    setLocalSettings(prev => ({
      ...(prev ?? DEFAULT_PAYROLL_STATEMENT_SETTINGS),
      bonusCategories: (prev?.bonusCategories ?? []).map(item =>
        item.id === id ? { ...item, remark } : item
      )
    }))
  }

  return (
    <>
      <Location title="급여명세서 설정" list={['홈', '직원 관리', '급여 명세서', '급여명세서 설정']} />
      <div className="contents-wrap">
        {/* 저장 버튼 */}
        <div className="contents-btn">
          <button className="btn-form basic" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? '저장중...' : '저장'}
          </button>
        </div>

        <div className="contents-body">
          {/* 본사/가맹점 선택 */}
          <div className="content-wrap">
            <table className="default-table">
              <colgroup>
                <col width="160px" />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th>본사/가맹점 선택</th>
                  <td>
                    <div className="filed-flx">
                      <div className="block" style={{ maxWidth: '250px' }}>
                        <select
                          className="select-form"
                          value={selectedHeadOfficeId}
                          onChange={(e) => setSelectedHeadOfficeId(Number(e.target.value))}
                        >
                          <option value={1}>따름인</option>
                        </select>
                      </div>
                      <div className="block" style={{ maxWidth: '250px' }}>
                        <select
                          className="select-form"
                          value={selectedFranchiseId}
                          onChange={(e) => setSelectedFranchiseId(Number(e.target.value))}
                        >
                          <option value={2}>을지로3가점</option>
                        </select>
                      </div>
                      <button className="btn-form basic" onClick={handleSearch} disabled={isLoading}>
                        {isLoading ? '조회중...' : '검색'}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p>데이터를 불러오는 중...</p>
            </div>
          ) : (
            <>
              {/* 급여 기준 정보 */}
              <div className="content-wrap">
                <h3 className="section-title" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                  급여 기준 정보
                </h3>

                <table className="default-table">
                  <colgroup>
                    <col width="180px" />
                    <col />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>정직원 급여일 정보 *</th>
                      <td>
                        <div className="filed-flx">
                          <div className="block" style={{ maxWidth: '120px' }}>
                            <select
                              className="select-form"
                              value={settings.fulltimePaydayMonth}
                              onChange={(e) => handleSettingChange('fulltimePaydayMonth', e.target.value as 'CURRENT' | 'NEXT')}
                            >
                              <option value="CURRENT">당월</option>
                              <option value="NEXT">익월</option>
                            </select>
                          </div>
                          <span style={{ padding: '0 8px', display: 'flex', alignItems: 'center', fontWeight: 500 }}>일</span>
                          <div className="block" style={{ maxWidth: '80px' }}>
                            <input
                              type="number"
                              className="input-frame"
                              min={1}
                              max={31}
                              value={settings.fulltimePaydayDay}
                              onChange={(e) => handleSettingChange('fulltimePaydayDay', Number(e.target.value) || 1)}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>파트타이머 급여일 정보 *</th>
                      <td>
                        <div className="filed-flx">
                          <div className="block" style={{ maxWidth: '120px' }}>
                            <select
                              className="select-form"
                              value={settings.parttimePaydayMonth}
                              onChange={(e) => handleSettingChange('parttimePaydayMonth', e.target.value as 'CURRENT' | 'NEXT')}
                            >
                              <option value="CURRENT">당월</option>
                              <option value="NEXT">익월</option>
                            </select>
                          </div>
                          <span style={{ padding: '0 8px', display: 'flex', alignItems: 'center', fontWeight: 500 }}>일</span>
                          <div className="block" style={{ maxWidth: '80px' }}>
                            <input
                              type="number"
                              className="input-frame"
                              min={1}
                              max={31}
                              value={settings.parttimePaydayDay}
                              onChange={(e) => handleSettingChange('parttimePaydayDay', Number(e.target.value) || 1)}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>파트타이머 근로소득세율 *</th>
                      <td>
                        <div className="filed-flx">
                          <span style={{ padding: '0 8px', display: 'flex', alignItems: 'center', fontWeight: 500, backgroundColor: '#8B0000', color: '#fff', borderRadius: '4px' }}>%</span>
                          <div className="block" style={{ maxWidth: '100px' }}>
                            <input
                              type="number"
                              className="input-frame"
                              step="0.1"
                              value={settings.parttimeIncomeTaxRate}
                              onChange={(e) => handleSettingChange('parttimeIncomeTaxRate', Number(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>파트타이머 지방소득세율 *</th>
                      <td>
                        <div className="filed-flx">
                          <span style={{ padding: '0 8px', display: 'flex', alignItems: 'center', fontWeight: 500, backgroundColor: '#8B0000', color: '#fff', borderRadius: '4px' }}>%</span>
                          <div className="block" style={{ maxWidth: '100px' }}>
                            <input
                              type="number"
                              className="input-frame"
                              step="0.1"
                              value={settings.parttimeLocalTaxRate}
                              onChange={(e) => handleSettingChange('parttimeLocalTaxRate', Number(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>연장 또는 추가 근무 세율 *</th>
                      <td>
                        <div className="filed-flx">
                          <span style={{ padding: '0 8px', display: 'flex', alignItems: 'center', fontWeight: 500, backgroundColor: '#8B0000', color: '#fff', borderRadius: '4px' }}>%</span>
                          <div className="block" style={{ maxWidth: '100px' }}>
                            <input
                              type="number"
                              className="input-frame"
                              step="1"
                              value={settings.overtimeWorkRate}
                              onChange={(e) => handleSettingChange('overtimeWorkRate', Number(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 상여금 정보 */}
              <div className="content-wrap">
                <h3 className="section-title" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                  상여금 정보
                </h3>

                <table className="default-table">
                  <colgroup>
                    <col width="180px" />
                    <col />
                  </colgroup>
                  <tbody>
                    {settings.bonusCategories.map((item, index) => (
                      <BonusCategoryRow
                        key={item.id}
                        item={item}
                        index={index}
                        onNameChange={handleBonusCategoryNameChange}
                        onAmountChange={handleBonusCategoryAmountChange}
                        onRemarkChange={handleBonusCategoryRemarkChange}
                        onAddItem={handleAddBonusCategory}
                        onDeleteItem={handleDeleteBonusCategory}
                      />
                    ))}
                    {settings.bonusCategories.length === 0 && (
                      <tr>
                        <th>상여분류</th>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ color: '#999' }}>등록된 상여 분류가 없습니다.</span>
                            <button className="btn-form basic" onClick={handleAddBonusCategory}>
                              상여 분류 추가
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
