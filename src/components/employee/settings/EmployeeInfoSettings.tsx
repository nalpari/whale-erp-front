'use client'
import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tooltip } from 'react-tooltip'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  useEmployeeInfoSettings,
  useSaveEmployeeInfoSettings
} from '@/hooks/queries/use-employee-settings-queries'
import type { ClassificationItem as ApiClassificationItem } from '@/lib/api/employeeInfoSettings'
import { useAlert } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'

const DEFAULT_HEAD_OFFICE_ID = 1
const DEFAULT_FRANCHISE_ID = 2

// 탭 타입 정의
type TabType = 'employee' | 'rank' | 'position'

// 분류 항목 타입 (UI용 - id는 number)
interface ClassificationItem {
  id: number
  code: string
  name: string
  sortOrder: number
}

// 드래그 가능한 분류 항목 컴포넌트
interface SortableItemProps {
  item: ClassificationItem
  tabLabel: string
  activeTab: TabType
  onNameChange: (id: number, name: string) => void
  onAddItem: () => void
  onDeleteItem: (id: number) => void
}

function SortableItem({
  item,
  tabLabel,
  activeTab,
  onNameChange,
  onAddItem,
  onDeleteItem,
}: SortableItemProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginBottom: '8px',
  }

  const handleAddItem = () => {
    setIsTooltipOpen(false)
    onAddItem()
  }

  const handleDeleteItem = () => {
    setIsTooltipOpen(false)
    onDeleteItem(item.id)
  }

  return (
    <table
      ref={setNodeRef}
      style={style}
      className="default-table white"
    >
      <colgroup>
        <col width="200px" />
        <col />
      </colgroup>
      <tbody>
        <tr>
          <th>
            <div className="option-num-tit">
              <span
                className="sequence-btn"
                style={{
                  marginRight: '8px',
                  cursor: 'grab',
                  display: 'inline-block',
                  width: '24px',
                  height: '24px',
                }}
                {...attributes}
                {...listeners}
              ></span>
              <span>{tabLabel} #{item.sortOrder}</span>
            </div>
          </th>
          <td>
            <div className="filed-flx">
              <div className="block" style={{ maxWidth: '400px' }}>
                <input
                  type="text"
                  className="input-frame"
                  value={item.name}
                  onChange={(e) => onNameChange(item.id, e.target.value)}
                  placeholder="분류명을 입력하세요"
                />
              </div>
              <div className="auto-right">
                <div className="more-btn">
                  <span
                    className="icon-more"
                    id={`${activeTab}-classification-${item.id}`}
                    onClick={() => setIsTooltipOpen(!isTooltipOpen)}
                  ></span>
                  <Tooltip
                    className="option-list"
                    anchorSelect={`#${activeTab}-classification-${item.id}`}
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
                      분류 추가
                    </button>
                    <button
                      className="option-item"
                      onClick={handleDeleteItem}
                    >
                      분류 삭제
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

// API 응답을 UI 타입으로 변환
function apiToUiClassifications(items: ApiClassificationItem[]): ClassificationItem[] {
  return items.map((item, index) => ({
    id: index + 1,
    code: item.code,
    name: item.name,
    sortOrder: item.sortOrder
  }))
}

// UI 타입을 API 요청 타입으로 변환
function uiToApiClassifications(items: ClassificationItem[]): ApiClassificationItem[] {
  return items.map(item => ({
    code: item.code,
    name: item.name,
    sortOrder: item.sortOrder
  }))
}

// 코드 프리픽스 생성
function getCodePrefix(tabType: TabType): string {
  switch (tabType) {
    case 'employee':
      return 'EMPC'
    case 'rank':
      return 'RANK'
    case 'position':
      return 'POSI'
    default:
      return 'CODE'
  }
}

export default function EmployeeInfoSettings() {
  const searchParams = useSearchParams()
  const { alert } = useAlert()

  // 탭 상태 - URL 쿼리 파라미터에서 초기값 설정
  const getInitialTab = (): TabType => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'employee' || tabParam === 'rank' || tabParam === 'position') {
      return tabParam
    }
    return 'employee'
  }

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab())

  // 본사/가맹점 선택
  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState<number>(DEFAULT_HEAD_OFFICE_ID)
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<number>(DEFAULT_FRANCHISE_ID)

  // SearchSelect options
  const headOfficeOptions: SelectOption[] = useMemo(() => [
    { value: '1', label: '따름인' },
  ], [])

  const franchiseOptions: SelectOption[] = useMemo(() => [
    { value: '2', label: '을지로3가점' },
  ], [])

  // TanStack Query 훅
  const { data: settingsData, isPending: isLoading, refetch } = useEmployeeInfoSettings(
    {
      headOfficeId: selectedHeadOfficeId,
      franchiseId: selectedFranchiseId
    },
    true
  )
  const saveSettingsMutation = useSaveEmployeeInfoSettings()
  const isSaving = saveSettingsMutation.isPending

  // 분류 데이터 통합 상태
  interface ClassificationsState {
    employee: ClassificationItem[]
    rank: ClassificationItem[]
    position: ClassificationItem[]
  }

  const [classifications, setClassifications] = useState<ClassificationsState>({
    employee: [],
    rank: [],
    position: [],
  })

  // 개별 setter 함수들 (기존 코드 호환성)
  const setEmployeeClassifications = (items: ClassificationItem[]) => {
    setClassifications(prev => ({ ...prev, employee: items }))
  }
  const setRankClassifications = (items: ClassificationItem[]) => {
    setClassifications(prev => ({ ...prev, rank: items }))
  }
  const setPositionClassifications = (items: ClassificationItem[]) => {
    setClassifications(prev => ({ ...prev, position: items }))
  }

  // 개별 getter (기존 코드 호환성)
  const employeeClassifications = classifications.employee
  const rankClassifications = classifications.rank
  const positionClassifications = classifications.position

  // DnD 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 쿼리 데이터 반영 (렌더 중 상태 갱신 — React Compiler 호환)
  const [prevSettingsData, setPrevSettingsData] = useState(settingsData)
  if (settingsData !== prevSettingsData) {
    setPrevSettingsData(settingsData)
    if (settingsData?.codeMemoContent) {
      const { EMPLOYEE, RANK, POSITION } = settingsData.codeMemoContent
      setClassifications({
        employee: apiToUiClassifications(EMPLOYEE || []),
        rank: apiToUiClassifications(RANK || []),
        position: apiToUiClassifications(POSITION || []),
      })
    } else if (!isLoading) {
      setClassifications({ employee: [], rank: [], position: [] })
    }
  }

  // 현재 탭에 따른 데이터 가져오기
  const getCurrentClassifications = () => {
    switch (activeTab) {
      case 'employee':
        return employeeClassifications
      case 'rank':
        return rankClassifications
      case 'position':
        return positionClassifications
      default:
        return []
    }
  }

  // 현재 탭에 따른 데이터 설정 함수 가져오기
  const setCurrentClassifications = (items: ClassificationItem[]) => {
    switch (activeTab) {
      case 'employee':
        setEmployeeClassifications(items)
        break
      case 'rank':
        setRankClassifications(items)
        break
      case 'position':
        setPositionClassifications(items)
        break
    }
  }

  // 탭별 라벨
  const getTabLabel = () => {
    switch (activeTab) {
      case 'employee':
        return '직원분류'
      case 'rank':
        return '직급분류'
      case 'position':
        return '직책분류'
      default:
        return '분류'
    }
  }

  // 탭별 가이드 텍스트
  const getGuideText = () => {
    switch (activeTab) {
      case 'employee':
        return [
          '1. 직원의 업무 종류에 따른 분류를 등록합니다.',
          '2. 업무의 종류에 따라 점포 매니저, 점포 직원 등으로 등록할 수 있습니다.'
        ]
      case 'rank':
        return [
          '1. 직원의 직급을 등록합니다.',
          '2. 직급은 사원/주임/대리/과장/차장/부장/이사/상무이사/전무이사 등으로 등록할 수 있습니다.'
        ]
      case 'position':
        return [
          '1. 직원의 직책을 등록합니다.',
          '2. 직책은 팀장/매니저 등으로 등록할 수 있습니다.'
        ]
      default:
        return []
    }
  }

  // 항목 이름 변경
  const handleNameChange = (id: number, newName: string) => {
    const updated = getCurrentClassifications().map(item =>
      item.id === id ? { ...item, name: newName } : item
    )
    setCurrentClassifications(updated)
  }

  // 항목 추가
  const handleAddItem = () => {
    const items = getCurrentClassifications()
    const newId = Math.max(...items.map(i => i.id), 0) + 1
    const prefix = getCodePrefix(activeTab)
    const newCode = `${prefix}_${String(newId).padStart(3, '0')}`
    const newItem: ClassificationItem = {
      id: newId,
      code: newCode,
      name: '',
      sortOrder: items.length + 1
    }
    setCurrentClassifications([...items, newItem])
  }

  // 항목 삭제
  const handleDeleteItem = (id: number) => {
    const items = getCurrentClassifications().filter(item => item.id !== id)
    // 정렬 순서 재조정
    const reordered = items.map((item, index) => ({
      ...item,
      sortOrder: index + 1
    }))
    setCurrentClassifications(reordered)
  }

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const items = getCurrentClassifications()
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
        ...item,
        sortOrder: index + 1
      }))

      setCurrentClassifications(reordered)
    }
  }

  // 검색
  const handleSearch = () => {
    refetch()
  }

  // 저장
  const handleSave = async () => {
    try {
      await saveSettingsMutation.mutateAsync({
        headOfficeId: selectedHeadOfficeId,
        franchiseId: selectedFranchiseId,
        codeMemoContent: {
          EMPLOYEE: uiToApiClassifications(employeeClassifications),
          RANK: uiToApiClassifications(rankClassifications),
          POSITION: uiToApiClassifications(positionClassifications)
        }
      })
      await alert('저장되었습니다.')
    } catch (error) {
      console.error('저장 실패:', error)
      await alert('저장에 실패했습니다.')
    }
  }

  const currentClassifications = getCurrentClassifications()

  return (
    <div className="contents-wrap">
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
                      <SearchSelect
                        options={headOfficeOptions}
                        value={headOfficeOptions.find(o => o.value === String(selectedHeadOfficeId)) || null}
                        onChange={(opt) => setSelectedHeadOfficeId(opt ? Number(opt.value) : DEFAULT_HEAD_OFFICE_ID)}
                        placeholder="본사 선택"
                      />
                    </div>
                    <div className="block" style={{ maxWidth: '250px' }}>
                      <SearchSelect
                        options={franchiseOptions}
                        value={franchiseOptions.find(o => o.value === String(selectedFranchiseId)) || null}
                        onChange={(opt) => setSelectedFranchiseId(opt ? Number(opt.value) : DEFAULT_FRANCHISE_ID)}
                        placeholder="가맹점 선택"
                      />
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

        {/* 탭 메뉴 */}
        <div className="content-wrap">
          <div className="preferences-tab">
            <button
              className={`preferences-menu ${activeTab === 'employee' ? 'act' : ''}`}
              onClick={() => setActiveTab('employee')}
            >
              직원 분류
            </button>
            <button
              className={`preferences-menu ${activeTab === 'rank' ? 'act' : ''}`}
              onClick={() => setActiveTab('rank')}
            >
              직급 분류
            </button>
            <button
              className={`preferences-menu ${activeTab === 'position' ? 'act' : ''}`}
              onClick={() => setActiveTab('position')}
            >
              직책 분류
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="preferences-contents">
            {/* 저장 버튼 */}
            <div className="contents-btn">
              <button className="btn-form basic" onClick={handleSave} disabled={isSaving}>
                {isSaving ? '저장중...' : '저장'}
              </button>
            </div>

            {/* 가이드 텍스트 */}
            <div className="preferences-guide">
              {getGuideText().map((text, index) => (
                <span key={index}>{text}</span>
              ))}
            </div>

            {/* 분류 목록 - 드래그 앤 드롭 */}
            <div className="preferences-content-wrap">
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <p>데이터를 불러오는 중...</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={currentClassifications.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {currentClassifications.map((item) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        tabLabel={getTabLabel()}
                        activeTab={activeTab}
                        onNameChange={handleNameChange}
                        onAddItem={handleAddItem}
                        onDeleteItem={handleDeleteItem}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}

              {/* 항목이 없을 때 추가 버튼 표시 */}
              {!isLoading && currentClassifications.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <p style={{ marginBottom: '16px' }}>등록된 분류가 없습니다.</p>
                  <button className="btn-form basic" onClick={handleAddItem}>
                    분류 추가
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
