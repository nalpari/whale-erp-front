'use client'

import { type ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// 트리 아이템 인터페이스 (id와 children 필수)
export interface TreeItem {
  id: number | null
  children?: TreeItem[]
}

// 드래그 핸들에 전달할 Props (드래그 버튼에 spread)
export interface DragHandleProps {
  attributes: ReturnType<typeof useSortable>['attributes']
  listeners: ReturnType<typeof useSortable>['listeners']
}

// Sortable 아이템 Props (id가 number인 아이템만 허용)
interface SortableItemProps<T extends TreeItem> {
  item: T & { id: number }
  depth: number
  isOpen: boolean
  renderItem: (
    item: T,
    depth: number,
    dragHandleProps: DragHandleProps,
    hasChildren: boolean,
    isOpen: boolean,
  ) => ReactNode
  renderChildren: (children: T[], depth: number) => ReactNode
}

// Sortable 아이템 컴포넌트 (드래그 가능한 개별 아이템)
function SortableItem<T extends TreeItem>({ item, depth, isOpen, renderItem, renderChildren }: SortableItemProps<T>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const children = item.children
  const hasChildren = Boolean(children && children.length > 0)

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {renderItem(item, depth, { attributes, listeners }, hasChildren, isOpen)}
      {hasChildren && isOpen && children ? renderChildren(children as T[], depth + 1) : null}
    </li>
  )
}

// DraggableTree Props
interface DraggableTreeProps<T extends TreeItem> {
  items: T[] // 트리 데이터
  openItems: Set<number> // 열린 아이템 ID Set
  renderItem: (
    item: T,
    depth: number,
    dragHandleProps: DragHandleProps,
    hasChildren: boolean,
    isOpen: boolean,
  ) => ReactNode // 아이템 렌더링 함수
  onReorder: (parentId: number | null, reorderedItems: T[]) => void // 순서 변경 콜백
}

/**
 * 드래그 앤 드롭 가능한 트리 컴포넌트
 * - 계층 구조 데이터를 드래그로 순서 변경 가능
 * - 같은 부모 내에서만 순서 변경 허용
 */
export default function DraggableTree<T extends TreeItem>({
  items,
  openItems,
  renderItem,
  onReorder,
}: DraggableTreeProps<T>) {
  // 드래그 센서 설정 (마우스 8px 이동 후 활성화)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // 트리에서 특정 아이템의 부모 ID와 형제 목록 찾기
  const findSiblingsAndParent = (
    targetId: number,
    items: T[],
    parentId: number | null = null,
  ): { parentId: number | null; siblings: T[] } | null => {
    if (items.some((item) => item.id === targetId)) {
      return { parentId, siblings: items }
    }

    for (const item of items) {
      const children = item.children
      if (children && children.length > 0) {
        const result = findSiblingsAndParent(targetId, children as T[], item.id)
        if (result) return result
      }
    }

    return null
  }

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = active.id as number
    const overId = over.id as number

    // 드래그한 아이템의 부모 확인
    const activeContext = findSiblingsAndParent(activeId, items)
    if (!activeContext) return

    const { parentId, siblings } = activeContext

    // 같은 형제 목록 내에서만 순서 변경 허용
    const overInSiblings = siblings.some((item) => item.id === overId)
    if (!overInSiblings) return

    const oldIndex = siblings.findIndex((item) => item.id === activeId)
    const newIndex = siblings.findIndex((item) => item.id === overId)

    // 인덱스 검증
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

    // 배열 순서 변경 후 콜백 호출
    const reorderedSiblings = arrayMove(siblings, oldIndex, newIndex)
    onReorder(parentId, reorderedSiblings)
  }

  // 트리 아이템 재귀 렌더링
  const renderTreeItems = (items: T[], depth: number): ReactNode => {
    // null id 필터링 (드래그 불가능한 아이템 제외)
    const validItems = items.filter((item): item is T & { id: number } => item.id !== null)
    const depthClass = `depth0${Math.min(depth, 3)}`

    return (
      <ul className={`hierarchy-list ${depthClass}`}>
        <SortableContext items={validItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          {validItems.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              depth={depth}
              isOpen={openItems.has(item.id)}
              renderItem={renderItem}
              renderChildren={renderTreeItems}
            />
          ))}
        </SortableContext>
      </ul>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {renderTreeItems(items, 1)}
    </DndContext>
  )
}
