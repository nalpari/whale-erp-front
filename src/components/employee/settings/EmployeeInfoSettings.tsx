'use client'
import React, { useState, useEffect, useCallback } from 'react'
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
  getEmployeeInfoCommonCode,
  saveEmployeeInfoCommonCode,
  type ClassificationItem as ApiClassificationItem,
} from '@/lib/api/employeeInfoSettings'
import { DEFAULT_HEAD_OFFICE_ID, DEFAULT_FRANCHISE_ID } from '@/lib/constants/organization'

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

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 직원 분류 데이터
  const [employeeClassifications, setEmployeeClassifications] = useState<ClassificationItem[]>([])

  // 직급 분류 데이터
  const [rankClassifications, setRankClassifications] = useState<ClassificationItem[]>([])

  // 직책 분류 데이터
  const [positionClassifications, setPositionClassifications] = useState<ClassificationItem[]>([])

  // DnD 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 데이터 조회
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await getEmployeeInfoCommonCode({
        headOfficeId: selectedHeadOfficeId,
        franchiseId: selectedFranchiseId
      })

      if (response?.codeMemoContent) {
        const { EMPLOYEE, RANK, POSITION } = response.codeMemoContent
        setEmployeeClassifications(apiToUiClassifications(EMPLOYEE || []))
        setRankClassifications(apiToUiClassifications(RANK || []))
        setPositionClassifications(apiToUiClassifications(POSITION || []))
      } else {
        // 데이터가 없으면 빈 배열로 초기화
        setEmployeeClassifications([])
        setRankClassifications([])
        setPositionClassifications([])
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error)
      // 에러 시에도 빈 배열로 초기화
      setEmployeeClassifications([])
      setRankClassifications([])
      setPositionClassifications([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedHeadOfficeId, selectedFranchiseId])

  // 초기 로딩
  useEffect(() => {
    fetchData()
  }, [fetchData])

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
    fetchData()
  }

  // 저장
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveEmployeeInfoCommonCode({
        headOfficeId: selectedHeadOfficeId,
        franchiseId: selectedFranchiseId,
        codeMemoContent: {
          EMPLOYEE: uiToApiClassifications(employeeClassifications),
          RANK: uiToApiClassifications(rankClassifications),
          POSITION: uiToApiClassifications(positionClassifications)
        }
      })
      alert('저장되었습니다.')
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const classifications = getCurrentClassifications()

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
                    items={classifications.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {classifications.map((item) => (
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
              {!isLoading && classifications.length === 0 && (
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
