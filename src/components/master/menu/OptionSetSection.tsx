'use client'

import { useId, useCallback, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import { Input } from '@/components/common/ui'
import FindOptionPop from '@/components/master/menu/FindOptionPop'
import type { OptionItemFormData, OptionSetFormData, MenuResponse } from '@/lib/schemas/menu'

interface OptionSetSectionProps {
  optionSets: OptionSetFormData[]
  onChange: (optionSets: OptionSetFormData[]) => void
  bpId: number | null
  fieldErrors?: Record<string, string>
  onClearFieldError?: (key: string) => void
}

const DEFAULT_OPTION_ITEM: OptionItemFormData = {
  optionName: '',
  additionalPrice: 0,
  quantityInput: false,
  isDefault: false,
  isActive: true,
}

const DEFAULT_OPTION_SET: OptionSetFormData = {
  optionSetName: '',
  isRequired: false,
  isMultiSelect: false,
  displayOrder: null,
  options: [{ ...DEFAULT_OPTION_ITEM }],
}

export default function OptionSetSection({ optionSets, onChange, bpId, fieldErrors = {}, onClearFieldError }: OptionSetSectionProps) {
  const uniqueId = useId()
  const [findOptionTarget, setFindOptionTarget] = useState<{ setIndex: number; optionIndex: number } | null>(null)

  const addSet = useCallback(() => {
    onChange([...optionSets, { ...DEFAULT_OPTION_SET, options: [{ ...DEFAULT_OPTION_ITEM }] }])
  }, [optionSets, onChange])

  const removeSet = useCallback(
    (setIndex: number) => {
      onChange(optionSets.filter((_, i) => i !== setIndex))
    },
    [optionSets, onChange]
  )

  const updateSet = useCallback(
    (setIndex: number, updates: Partial<OptionSetFormData>) => {
      onChange(optionSets.map((set, i) => (i === setIndex ? { ...set, ...updates } : set)))
    },
    [optionSets, onChange]
  )

  const addOption = useCallback(
    (setIndex: number) => {
      const set = optionSets[setIndex]
      updateSet(setIndex, { options: [...set.options, { ...DEFAULT_OPTION_ITEM }] })
    },
    [optionSets, updateSet]
  )

  const removeOption = useCallback(
    (setIndex: number, optionIndex: number) => {
      const set = optionSets[setIndex]
      if (set.options.length <= 1) return
      updateSet(setIndex, { options: set.options.filter((_, i) => i !== optionIndex) })
    },
    [optionSets, updateSet]
  )

  const updateOption = useCallback(
    (setIndex: number, optionIndex: number, updates: Partial<OptionItemFormData>) => {
      const set = optionSets[setIndex]
      const newOptions = set.options.map((opt, i) => (i === optionIndex ? { ...opt, ...updates } : opt))
      updateSet(setIndex, { options: newOptions })
    },
    [optionSets, updateSet]
  )

  const handleSetDefault = useCallback(
    (setIndex: number, optionIndex: number) => {
      const set = optionSets[setIndex]
      const newOptions = set.options.map((opt, i) => ({
        ...opt,
        isDefault: i === optionIndex,
      }))
      updateSet(setIndex, { options: newOptions })
    },
    [optionSets, updateSet]
  )

  const handleFindOptionSelect = useCallback(
    (menu: MenuResponse) => {
      if (!findOptionTarget) return
      const { setIndex, optionIndex } = findOptionTarget
      updateOption(setIndex, optionIndex, {
        optionName: menu.menuName,
        selectedMenuCode: menu.menuCode ?? null,
        selectedOperationStatus: menu.operationStatus,
      })
      onClearFieldError?.(`optionSets.${setIndex}.options.${optionIndex}.optionName`)
      setFindOptionTarget(null)
    },
    [findOptionTarget, updateOption, onClearFieldError]
  )

  return (
    <div className="slide-table-wrap">
      <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        옵션 정보
        <button
          type="button"
          className="btn-form outline s"
          onClick={addSet}
        >
          옵션 SET 추가
        </button>
      </h3>

      {optionSets.map((optionSet, setIndex) => (
        <table key={setIndex} className="master-option-table">
          <colgroup>
            <col width="190px" />
            <col />
          </colgroup>
          <tbody>
            {/* 옵션 SET 헤더 */}
            <tr>
              <th className="option-header-tit">
                옵션 SET {String(setIndex + 1).padStart(2, '0')}
              </th>
              <td>
                <table className="option-header">
                  <colgroup>
                    <col />
                    <col width="150px" />
                    <col width="150px" />
                    <col width="200px" />
                    <col width="110px" />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td>
                        <Input
                          value={optionSet.optionSetName}
                          onChange={(e) => {
                            updateSet(setIndex, { optionSetName: e.target.value })
                            onClearFieldError?.(`optionSets.${setIndex}.optionSetName`)
                          }}
                          placeholder="옵션 SET명을 입력하세요"
                          fullWidth
                          error={!!fieldErrors[`optionSets.${setIndex}.optionSetName`]}
                          helpText={fieldErrors[`optionSets.${setIndex}.optionSetName`]}
                          startAdornment={
                            <div className="option-name">
                              옵션 SET명 <span className="red">*</span>
                            </div>
                          }
                        />
                      </td>
                      <td>
                        <div className="toggle-wrap">
                          <span className="toggle-txt">필수선택</span>
                          <div className="toggle-btn">
                            <input
                              type="checkbox"
                              id={`${uniqueId}-required-${setIndex}`}
                              checked={optionSet.isRequired}
                              onChange={(e) => updateSet(setIndex, { isRequired: e.target.checked })}
                            />
                            <label className="slider" htmlFor={`${uniqueId}-required-${setIndex}`}></label>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="toggle-wrap">
                          <span className="toggle-txt">다중선택</span>
                          <div className="toggle-btn">
                            <input
                              type="checkbox"
                              id={`${uniqueId}-multi-${setIndex}`}
                              checked={optionSet.isMultiSelect}
                              onChange={(e) => updateSet(setIndex, { isMultiSelect: e.target.checked })}
                            />
                            <label className="slider" htmlFor={`${uniqueId}-multi-${setIndex}`}></label>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={optionSet.displayOrder !== null ? String(optionSet.displayOrder) : ''}
                          onChange={() => { }}
                          onValueChange={(val) => updateSet(setIndex, { displayOrder: val })}
                          fullWidth
                          startAdornment={
                            <div className="option-name">노출순서</div>
                          }
                        />
                      </td>
                      <td>
                        <div className="filed-flx">
                          <div className="more-btn">
                            <span className="icon-more" id={`${uniqueId}-set-more-${setIndex}`}></span>
                            <Tooltip
                              className="option-list"
                              anchorSelect={`#${CSS.escape(uniqueId + '-set-more-' + setIndex)}`}
                              place="right-end"
                              offset={0}
                              openOnClick={true}
                              clickable={true}
                              opacity={1}
                            >
                              <button type="button" className="option-item" onClick={() => removeSet(setIndex)}>
                                옵션 SET 삭제
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* 옵션 항목 목록 */}
            {optionSet.options.map((option, optionIndex) => (
              <tr key={optionIndex}>
                <th>
                  <div className="option-num-tit">
                    <span>옵션 {String(optionIndex + 1).padStart(2, '0')}</span>
                  </div>
                </th>
                <td>
                  <table className="option-list">
                    <colgroup>
                      <col />
                      <col width="240px" />
                      <col width="150px" />
                      <col width="140px" />
                      <col width="110px" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td>
                          <div className="filed-flx">
                            <button
                              type="button"
                              className="btn-form outline s"
                              style={{ flexShrink: 0 }}
                              disabled={!bpId}
                              onClick={() => setFindOptionTarget({ setIndex, optionIndex })}
                            >
                              옵션찾기
                            </button>
                            <div className="block">
                              <Input
                                value={option.optionName}
                                onChange={(e) => {
                                  updateOption(setIndex, optionIndex, { optionName: e.target.value })
                                  onClearFieldError?.(`optionSets.${setIndex}.options.${optionIndex}.optionName`)
                                }}
                                placeholder="옵션명을 입력하세요"
                                fullWidth
                                error={!!fieldErrors[`optionSets.${setIndex}.options.${optionIndex}.optionName`]}
                                helpText={fieldErrors[`optionSets.${setIndex}.options.${optionIndex}.optionName`]}
                              />
                            </div>
                            {option.selectedMenuCode && (
                              <span className="option-name" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                                {option.selectedMenuCode}
                              </span>
                            )}
                            {option.selectedOperationStatus && (
                              <div style={{ flexShrink: 0 }}>
                                {option.selectedOperationStatus === 'STOPR_001' ? (
                                  <div className="store-badge blue">운영</div>
                                ) : (
                                  <div className="store-badge org">미운영</div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <Input
                            type="number"
                            value={String(option.additionalPrice)}
                            onChange={() => { }}
                            onValueChange={(val) =>
                              updateOption(setIndex, optionIndex, { additionalPrice: val ?? 0 })
                            }
                            fullWidth
                            startAdornment={
                              <div className="option-name">추가가격</div>
                            }
                          />
                        </td>
                        <td>
                          <div className="toggle-wrap">
                            <span className="toggle-txt">수량입력</span>
                            <div className="toggle-btn">
                              <input
                                type="checkbox"
                                id={`${uniqueId}-qty-${setIndex}-${optionIndex}`}
                                checked={option.quantityInput}
                                onChange={(e) =>
                                  updateOption(setIndex, optionIndex, { quantityInput: e.target.checked })
                                }
                              />
                              <label className="slider" htmlFor={`${uniqueId}-qty-${setIndex}-${optionIndex}`}></label>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="toggle-wrap">
                            <span className="toggle-txt">디폴트</span>
                            <div className="toggle-btn">
                              <input
                                type="checkbox"
                                id={`${uniqueId}-default-${setIndex}-${optionIndex}`}
                                checked={option.isDefault}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleSetDefault(setIndex, optionIndex)
                                  } else {
                                    updateOption(setIndex, optionIndex, { isDefault: false })
                                  }
                                }}
                              />
                              <label className="slider" htmlFor={`${uniqueId}-default-${setIndex}-${optionIndex}`}></label>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="filed-flx">
                            <div className="toggle-btn">
                              <input
                                type="checkbox"
                                id={`${uniqueId}-active-${setIndex}-${optionIndex}`}
                                checked={option.isActive}
                                onChange={(e) =>
                                  updateOption(setIndex, optionIndex, { isActive: e.target.checked })
                                }
                              />
                              <label className="slider" htmlFor={`${uniqueId}-active-${setIndex}-${optionIndex}`}></label>
                            </div>
                            <div className="more-btn">
                              <span
                                className="icon-more"
                                id={`${uniqueId}-opt-more-${setIndex}-${optionIndex}`}
                              ></span>
                              <Tooltip
                                className="option-list"
                                anchorSelect={`#${CSS.escape(uniqueId + '-opt-more-' + setIndex + '-' + optionIndex)}`}
                                place="left-end"
                                offset={0}
                                openOnClick={true}
                                clickable={true}
                                opacity={1}
                              >
                                <button type="button" className="option-item" onClick={() => addOption(setIndex)}>
                                  옵션 추가
                                </button>
                                {optionSet.options.length > 1 && (
                                  <button
                                    type="button"
                                    className="option-item"
                                    onClick={() => removeOption(setIndex, optionIndex)}
                                  >
                                    옵션 삭제
                                  </button>
                                )}
                              </Tooltip>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
      {bpId && (
        <FindOptionPop
          isOpen={findOptionTarget !== null}
          onClose={() => setFindOptionTarget(null)}
          onSelect={handleFindOptionSelect}
          bpId={bpId}
        />
      )}
    </div>
  )
}
