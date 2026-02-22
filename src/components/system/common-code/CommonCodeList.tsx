'use client'

import { useState, useMemo, useCallback } from 'react'
import { useCommonCodeTree, useReorderCommonCodes, useCreateCommonCode, useUpdateCommonCode, type CommonCodeNode } from '@/hooks/queries/use-common-code-queries'
import DraggableTree, { type DragHandleProps } from '@/components/common/DraggableTree'
import CommonCodeFormModal, { type CommonCodeFormData } from '@/components/system/common-code/CommonCodeFormModal'
import CubeLoader from '@/components/common/ui/CubeLoader'

interface CommonCodeListProps {
  codeGroup: string
  headOffice?: string
  franchise?: string
  isActive?: boolean
  headerCode?: string
  headerId?: string
  headerName?: string
  headerDescription?: string
}

// 모든 노드 ID 수집
function collectAllIds(nodes: CommonCodeNode[]): number[] {
  const ids: number[] = []
  const traverse = (items: CommonCodeNode[]) => {
    for (const item of items) {
      ids.push(item.id)
      if (item.children?.length) {
        traverse(item.children)
      }
    }
  }
  traverse(nodes)
  return ids
}

/**
 * 공통코드 계층 구조 리스트 컴포넌트
 *
 * DraggableTree를 사용하여 드래그 앤 드롭으로 순서 변경이 가능하다.
 * /api/v1/common-codes/tree API를 호출하여 데이터를 표시한다.
 */
export default function CommonCodeList({ codeGroup, headOffice, franchise, isActive, headerCode, headerId, headerName, headerDescription }: CommonCodeListProps) {
  const { data: treeData = [], isPending, error } = useCommonCodeTree(codeGroup, 3, headOffice, franchise, isActive, headerCode, headerId, headerName, headerDescription)
  const reorderMutation = useReorderCommonCodes()
  const createMutation = useCreateCommonCode()
  const updateMutation = useUpdateCommonCode()

  // treeData 기반 전체 ID (데이터 변경 시 자동 재계산)
  const allIds = useMemo(() => collectAllIds(treeData), [treeData])

  // 사용자가 명시적으로 토글/접기/펼치기 한 상태 (null이면 기본값=전체 열림)
  const [overriddenOpenItems, setOverriddenOpenItems] = useState<Set<number> | null>(null)

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [modalParentNode, setModalParentNode] = useState<CommonCodeNode | null>(null)
  const [modalEditNode, setModalEditNode] = useState<CommonCodeNode | null>(null)

  // 실제 openItems: 사용자 오버라이드가 없으면 전체 열림
  const openItems = overriddenOpenItems ?? new Set(allIds)

  const toggleItem = (id: number) => {
    const current = overriddenOpenItems ?? new Set(allIds)
    const next = new Set(current)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setOverriddenOpenItems(next)
  }

  const expandAll = () => {
    setOverriddenOpenItems(null)
  }

  const collapseAll = () => {
    setOverriddenOpenItems(new Set())
  }

  // 모달 열기
  const openModal = useCallback((mode: 'create' | 'edit', node: CommonCodeNode) => {
    setModalMode(mode)
    if (mode === 'create') {
      setModalParentNode(node)
      setModalEditNode(null)
    } else {
      setModalParentNode(null)
      setModalEditNode(node)
    }
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setModalParentNode(null)
    setModalEditNode(null)
  }, [])

  // 폼 제출 핸들러
  const handleFormSubmit = async (data: CommonCodeFormData) => {
    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync({
          code: data.code,
          name: data.name,
          description: data.description || null,
          parentId: modalParentNode?.id ?? null,
          isActive: data.isActive,
          codeGroup: data.codeGroup,
          headOffice: data.headOffice || null,
          franchise: data.franchise || null,
        })

        // 부모 노드가 있으면 펼치기
        if (modalParentNode) {
          const current = overriddenOpenItems ?? new Set(allIds)
          const next = new Set(current)
          next.add(modalParentNode.id)
          setOverriddenOpenItems(next)
        }

        alert('등록되었습니다.')
      } else {
        if (!modalEditNode) return
        await updateMutation.mutateAsync({
          id: modalEditNode.id,
          data: {
            code: data.code,
            name: data.name,
            description: data.description || null,
            isActive: data.isActive,
            codeGroup: data.codeGroup,
            headOffice: data.headOffice || null,
            franchise: data.franchise || null,
          },
        })
        alert('수정되었습니다.')
      }
      closeModal()
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      const message =
        axiosError.response?.data?.message ??
        (modalMode === 'create' ? '등록에 실패하였습니다.' : '수정에 실패하였습니다.')
      alert(message)
    }
  }

  // 순서 변경 핸들러
  const handleReorder = async (parentId: number | null, items: CommonCodeNode[]) => {
    const validItems = items.filter((item): item is CommonCodeNode & { id: number } => item.id !== null)

    if (validItems.length !== items.length) {
      alert('일시적인 문제가 발생했습니다. 새로고침 후 다시 시도해주세요.')
      return
    }

    const ids = validItems.map((item) => item.id)
    if (new Set(ids).size !== ids.length) {
      alert('일시적인 문제가 발생했습니다. 새로고침 후 다시 시도해주세요.')
      return
    }

    try {
      await reorderMutation.mutateAsync({
        parent_id: parentId,
        orders: validItems.map((item, index) => ({
          id: item.id,
          sort_order: index + 1,
        })),
      })
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      const message = axiosError.response?.data?.message ?? '순서 변경에 실패하였습니다.'
      alert(message)
    }
  }

  // 트리 아이템 렌더링 (DraggableTree의 renderItem 콜백)
  const renderCommonCodeItem = (
    node: CommonCodeNode,
    depth: number,
    dragHandleProps: DragHandleProps,
    hasChildren: boolean,
    isOpen: boolean,
  ) => {
    const canAddChild = depth < 3

    return (
      <div className={`hierarchy-item ${!node.isActive ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}>
        <div className="hierarchy-depth">
          <button
            className="order-btn"
            aria-label="순서 변경"
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
          ></button>
          <div className="depth-inner">
            {hasChildren && (
              <button
                className="depth-arr"
                onClick={() => toggleItem(node.id)}
                aria-label="하위 코드 토글"
              ></button>
            )}
            <div className="depth-name">
              {node.code && <span style={{ color: '#888', marginRight: 8 }}>[{node.code}]</span>}
              {node.name}
            </div>
          </div>
          <div className="depth-right">
            {node.description && <div className="path-name">{node.description}</div>}
            {!node.isActive && <div className="disable-badge">비활성</div>}
            <div className="depth-btn-wrap">
              {canAddChild && (
                <button
                  className="depth-btn create"
                  aria-label="하위 코드 추가"
                  onClick={() => openModal('create', node)}
                ></button>
              )}
              <button
                className="depth-btn edit"
                aria-label="코드 수정"
                onClick={() => openModal('edit', node)}
              ></button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="cube-loader-overlay">
        <CubeLoader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="contents-wrap">
        <div className="contents-body">
          <div>{error.message}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="contents-wrap">
      <div className="contents-body">
        <div className="content-wrap">
          <div className="data-list-header">
            <div className="hierarchy-bx">
              <div className="hierarchy-tit">공통코드 계층 관리</div>
              <div className="hierarchy-txt">드래그 앤 드롭을 사용하여 동일 레벨 내 순서를 변경할 수 있습니다.</div>
            </div>
            <div className="data-header-right">
              <button className="btn-form gray s" onClick={collapseAll}>
                All Close
              </button>
              <button className="btn-form gray s" onClick={expandAll}>
                All Open
              </button>
            </div>
          </div>
          <div className="hierarchy-wrap">
            {treeData.length === 0 ? (
              <div>등록된 공통코드가 없습니다.</div>
            ) : (
              <DraggableTree
                items={treeData}
                openItems={openItems}
                renderItem={renderCommonCodeItem}
                onReorder={handleReorder}
              />
            )}
          </div>
        </div>
      </div>
      <CommonCodeFormModal
        key={isModalOpen ? `${modalMode}-${modalEditNode?.id ?? modalParentNode?.id ?? 'new'}` : 'closed'}
        isOpen={isModalOpen}
        mode={modalMode}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        parentNode={modalMode === 'create' ? modalParentNode : null}
        editNode={modalMode === 'edit' ? modalEditNode : null}
        codeGroup={codeGroup}
        headOffice={headOffice}
        franchise={franchise}
      />
    </div>
  )
}
