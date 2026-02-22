'use client'

import { useState, useMemo, useCallback } from 'react'
import { useCommonCodeTree, useReorderCommonCodes, useCreateCommonCode, useUpdateCommonCode, useDeleteCommonCode, type CommonCodeNode } from '@/hooks/queries/use-common-code-queries'
import DraggableTree, { type DragHandleProps } from '@/components/common/DraggableTree'
import CommonCodeFormModal, { type CommonCodeFormData } from '@/components/system/common-code/CommonCodeFormModal'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { useAlert } from '@/components/common/ui/Alert'

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
  const { alert: showAlert, confirm: showConfirm } = useAlert()
  const reorderMutation = useReorderCommonCodes()
  const createMutation = useCreateCommonCode()
  const updateMutation = useUpdateCommonCode()
  const deleteMutation = useDeleteCommonCode()

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
  const openModal = useCallback((mode: 'create' | 'edit', node?: CommonCodeNode) => {
    setModalMode(mode)
    if (mode === 'create') {
      setModalParentNode(node ?? null)
      setModalEditNode(null)
    } else if (node) {
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

        await showAlert('등록되었습니다.')
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
        await showAlert('수정되었습니다.')
      }
      closeModal()
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      const message =
        axiosError.response?.data?.message ??
        (modalMode === 'create' ? '등록에 실패하였습니다.' : '수정에 실패하였습니다.')
      await showAlert(message)
    }
  }

  // 삭제 핸들러
  const handleDelete = async (node: CommonCodeNode) => {
    const confirmed = await showConfirm(
      `"[${node.code}] ${node.name}" 공통코드를 삭제하시겠습니까?`,
      { title: '공통코드 삭제', confirmText: '삭제', cancelText: '취소' },
    )
    if (!confirmed) return

    try {
      await deleteMutation.mutateAsync(node.id)
      await showAlert('삭제되었습니다.')
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      const message = axiosError.response?.data?.message ?? '삭제에 실패하였습니다.'
      await showAlert(message)
    }
  }

  // 순서 변경 핸들러
  const handleReorder = async (parentId: number | null, items: CommonCodeNode[]) => {
    const validItems = items.filter((item): item is CommonCodeNode & { id: number } => item.id !== null)

    if (validItems.length !== items.length) {
      await showAlert('일시적인 문제가 발생했습니다. 새로고침 후 다시 시도해주세요.')
      return
    }

    const ids = validItems.map((item) => item.id)
    if (new Set(ids).size !== ids.length) {
      await showAlert('일시적인 문제가 발생했습니다. 새로고침 후 다시 시도해주세요.')
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
      await showAlert(message)
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
              <button
                className="depth-btn delete"
                aria-label="코드 삭제"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='18' viewBox='0 0 16 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.5815 3.47217L13.2689 8.53256M1.91479 3.47217L2.38505 11.2692C2.50548 13.2661 2.5657 14.2645 3.06488 14.9825C3.31168 15.3375 3.62964 15.6371 3.9985 15.8623C4.52062 16.181 5.16674 16.2767 6.19257 16.3055' stroke='%23E53935' stroke-width='1.5' stroke-linecap='round'/%3E%3Cpath d='M13.9746 10.8611L8.53015 16.3052M13.9746 16.3056L8.53015 10.8615' stroke='%23E53935' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M0.75 3.47221H14.75M10.9045 3.47221L10.3735 2.37689C10.0208 1.64931 9.84443 1.28551 9.54022 1.05863C9.47274 1.0083 9.40129 0.963532 9.32657 0.924767C8.98971 0.75 8.58543 0.75 7.77686 0.75C6.94798 0.75 6.53354 0.75 6.19109 0.932092C6.11519 0.97245 6.04276 1.01903 5.97456 1.07135C5.66683 1.30743 5.49493 1.68454 5.15114 2.43875L4.68005 3.47221' stroke='%23E53935' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")` }}
                onClick={() => handleDelete(node)}
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
              <button className="btn-form basic s" onClick={() => openModal('create')}>
                <i className="plus"></i> 최상위 추가
              </button>
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
