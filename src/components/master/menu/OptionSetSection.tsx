'use client'

import { useId, useCallback, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS as DndCSS } from '@dnd-kit/utilities'
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
  isQuantity: false,
  isDefault: false,
  isActive: true,
  displayOrder: null,
}

const DEFAULT_OPTION_SET: OptionSetFormData = {
  setName: '',
  isRequired: false,
  isMultipleChoice: false,
  displayOrder: null,
  isActive: true,
  optionItems: [{ ...DEFAULT_OPTION_ITEM }],
}

function getOptionSortId(setIndex: number, optionIndex: number, option: OptionItemFormData): string | number {
  return option.id ?? `new-${setIndex}-${optionIndex}`
}

interface SortableOptionRowProps {
  id: string | number
  option: OptionItemFormData
  optionIndex: number
  setIndex: number
  optionSet: OptionSetFormData
  uniqueId: string
  bpId: number | null
  fieldErrors: Record<string, string>
  updateOption: (setIndex: number, optionIndex: number, updates: Partial<OptionItemFormData>) => void
  handleSetDefault: (setIndex: number, optionIndex: number) => void
  addOption: (setIndex: number) => void
  removeOption: (setIndex: number, optionIndex: number) => void
  onClearFieldError?: (key: string) => void
  setFindOptionTarget: (target: { setIndex: number; optionIndex: number } | null) => void
}

function SortableOptionRow({
  id,
  option,
  optionIndex,
  setIndex,
  optionSet,
  uniqueId,
  bpId,
  fieldErrors,
  updateOption,
  handleSetDefault,
  addOption,
  removeOption,
  onClearFieldError,
  setFindOptionTarget,
}: SortableOptionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: DndCSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style}>
      <th>
        <div className="option-num-tit">
          <span>옵션 {String(optionIndex + 1).padStart(2, '0')}</span>
          <button
            className="sequence-btn"
            type="button"
            style={{ cursor: 'grab' }}
            {...attributes}
            {...listeners}
          ></button>
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
                        onClearFieldError?.(`optionSets.${setIndex}.optionItems.${optionIndex}.optionName`)
                      }}
                      placeholder="옵션명을 입력하세요"
                      fullWidth
                      error={!!fieldErrors[`optionSets.${setIndex}.optionItems.${optionIndex}.optionName`]}
                      helpText={fieldErrors[`optionSets.${setIndex}.optionItems.${optionIndex}.optionName`]}
                    />
                  </div>
                  <span className="option-name" style={{ flexShrink: 0, whiteSpace: 'nowrap', minWidth: '80px' }}>
                    {option.selectedMenuCode ?? '-'}
                  </span>
                  <div style={{ flexShrink: 0, minWidth: '52px' }}>
                    {option.selectedOperationStatus ? (
                      option.selectedOperationStatus === 'STOPR_001' ? (
                        <div className="store-badge blue">운영</div>
                      ) : (
                        <div className="store-badge org">미운영</div>
                      )
                    ) : (
                      <div className="store-badge" style={{ visibility: 'hidden' }}>-</div>
                    )}
                  </div>
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
                      checked={option.isQuantity}
                      onChange={(e) =>
                        updateOption(setIndex, optionIndex, { isQuantity: e.target.checked })
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
                <div className="toggle-wrap">
                  <div className='block' style={{ width: '60px', textAlign: 'left' }}>
                    <span className="toggle-txt">운영여부</span>
                  </div>
                  <div className="filed-flx">
                    <div className="toggle-btn">
                      <input
                        type="checkbox"
                        id={`${uniqueId}-item-active-${setIndex}-${optionIndex}`}
                        checked={option.isActive ?? true}
                        disabled={!optionSet.isActive}
                        onChange={(e) =>
                          updateOption(setIndex, optionIndex, { isActive: e.target.checked })
                        }
                      />
                      <label className="slider" htmlFor={`${uniqueId}-item-active-${setIndex}-${optionIndex}`}></label>
                    </div>
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
                      {optionSet.optionItems.length > 1 && (
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
  )
}

export default function OptionSetSection({ optionSets, onChange, bpId, fieldErrors = {}, onClearFieldError }: OptionSetSectionProps) {
  const uniqueId = useId()
  const [findOptionTarget, setFindOptionTarget] = useState<{ setIndex: number; optionIndex: number } | null>(null)
  const [findOptionKey, setFindOptionKey] = useState(0)

  const openFindOption = useCallback((target: { setIndex: number; optionIndex: number } | null) => {
    setFindOptionTarget(target)
    if (target) {
      setFindOptionKey((prev) => prev + 1)
    }
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const addSet = useCallback(() => {
    onChange([...optionSets, { ...DEFAULT_OPTION_SET, optionItems: [{ ...DEFAULT_OPTION_ITEM }] }])
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
      updateSet(setIndex, { optionItems: [...set.optionItems, { ...DEFAULT_OPTION_ITEM }] })
    },
    [optionSets, updateSet]
  )

  const removeOption = useCallback(
    (setIndex: number, optionIndex: number) => {
      const set = optionSets[setIndex]
      if (set.optionItems.length <= 1) return
      updateSet(setIndex, { optionItems: set.optionItems.filter((_, i) => i !== optionIndex) })
    },
    [optionSets, updateSet]
  )

  const updateOption = useCallback(
    (setIndex: number, optionIndex: number, updates: Partial<OptionItemFormData>) => {
      const set = optionSets[setIndex]
      const newOptions = set.optionItems.map((opt, i) => (i === optionIndex ? { ...opt, ...updates } : opt))
      updateSet(setIndex, { optionItems: newOptions })
    },
    [optionSets, updateSet]
  )

  const handleSetDefault = useCallback(
    (setIndex: number, optionIndex: number) => {
      const set = optionSets[setIndex]
      const newOptions = set.optionItems.map((opt, i) => ({
        ...opt,
        isDefault: i === optionIndex,
      }))
      updateSet(setIndex, { optionItems: newOptions })
    },
    [optionSets, updateSet]
  )

  const handleOptionDragEnd = useCallback(
    (setIndex: number, event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const set = optionSets[setIndex]
      const items = set.optionItems
      const oldIndex = items.findIndex((item, i) => getOptionSortId(setIndex, i, item) === active.id)
      const newIndex = items.findIndex((item, i) => getOptionSortId(setIndex, i, item) === over.id)

      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
        ...item,
        displayOrder: index + 1,
      }))

      updateSet(setIndex, { optionItems: reordered })
    },
    [optionSets, updateSet]
  )

  const handleFindOptionSelect = useCallback(
    (menu: MenuResponse) => {
      if (!findOptionTarget) return
      const { setIndex, optionIndex } = findOptionTarget
      updateOption(setIndex, optionIndex, {
        optionSetItemId: menu.id,
        optionName: menu.menuName,
        selectedMenuCode: menu.menuCode ?? null,
        selectedOperationStatus: menu.operationStatus,
      })
      onClearFieldError?.(`optionSets.${setIndex}.optionItems.${optionIndex}.optionName`)
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

      {optionSets.map((optionSet, setIndex) => {
        const sortableIds = optionSet.optionItems.map((option, optionIndex) =>
          getOptionSortId(setIndex, optionIndex, option)
        )

        return (
          <DndContext
            key={optionSet.id ?? `new-set-${setIndex}`}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleOptionDragEnd(setIndex, e)}
          >
          <table className="master-option-table">
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
                      <col width="150px" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td>
                          <Input
                            value={optionSet.setName}
                            onChange={(e) => {
                              updateSet(setIndex, { setName: e.target.value })
                              onClearFieldError?.(`optionSets.${setIndex}.setName`)
                            }}
                            placeholder="옵션 SET명을 입력하세요"
                            fullWidth
                            error={!!fieldErrors[`optionSets.${setIndex}.setName`]}
                            helpText={fieldErrors[`optionSets.${setIndex}.setName`]}
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
                                checked={optionSet.isMultipleChoice}
                                onChange={(e) => updateSet(setIndex, { isMultipleChoice: e.target.checked })}
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
                            <div className='block' style={{ width: '60px', textAlign: 'left' }}>
                              <span className="toggle-txt">운영여부</span>
                            </div>
                            <div className="toggle-wrap">
                              <div className="toggle-btn">
                                <input
                                  type="checkbox"
                                  id={`${uniqueId}-active-${setIndex}`}
                                  checked={optionSet.isActive}
                                  onChange={(e) => {
                                    const active = e.target.checked
                                    updateSet(setIndex, {
                                      isActive: active,
                                      optionItems: optionSet.optionItems.map((opt) => ({ ...opt, isActive: active })),
                                    })
                                  }}
                                />
                                <label className="slider" htmlFor={`${uniqueId}-active-${setIndex}`}></label>
                              </div>
                            </div>
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

              {/* 옵션 항목 목록 — DnD */}
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {optionSet.optionItems.map((option, optionIndex) => (
                  <SortableOptionRow
                    key={getOptionSortId(setIndex, optionIndex, option)}
                    id={getOptionSortId(setIndex, optionIndex, option)}
                    option={option}
                    optionIndex={optionIndex}
                    setIndex={setIndex}
                    optionSet={optionSet}
                    uniqueId={uniqueId}
                    bpId={bpId}
                    fieldErrors={fieldErrors}
                    updateOption={updateOption}
                    handleSetDefault={handleSetDefault}
                    addOption={addOption}
                    removeOption={removeOption}
                    onClearFieldError={onClearFieldError}
                    setFindOptionTarget={openFindOption}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
          </DndContext>
        )
      })}
      {bpId && (
        <FindOptionPop
          key={findOptionKey}
          isOpen={findOptionTarget !== null}
          onClose={() => setFindOptionTarget(null)}
          onSelect={handleFindOptionSelect}
          bpId={bpId}
        />
      )}
    </div>
  )
}
