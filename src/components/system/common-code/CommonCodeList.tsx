'use client'

import { useState } from 'react'
import { useCommonCodeTree, type CommonCodeNode } from '@/hooks/queries/use-common-code-queries'
import CubeLoader from '@/components/common/ui/CubeLoader'

interface CommonCodeListProps {
  codeGroup: string
  headOffice?: string
  franchise?: string
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
 * ProgramList와 유사한 계층 트리 UI를 제공한다.
 * /api/v1/common-codes/tree API를 호출하여 데이터를 표시한다.
 */
export default function CommonCodeList({ codeGroup, headOffice, franchise }: CommonCodeListProps) {
  const { data: treeData = [], isPending, error } = useCommonCodeTree(codeGroup, 3, headOffice, franchise)
  // 닫힌 항목만 추적 (기본 전체 열림)
  const [closedItems, setClosedItems] = useState<Set<number>>(new Set())

  const toggleItem = (id: number) => {
    setClosedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    setClosedItems(new Set())
  }

  const collapseAll = () => {
    setClosedItems(new Set(collectAllIds(treeData)))
  }

  // 재귀 트리 렌더링
  const renderTreeItems = (nodes: CommonCodeNode[], depth: number) => {
    return nodes.map((node) => {
      const hasChildren = !!node.children?.length
      const isOpen = !closedItems.has(node.id)

      return (
        <div key={node.id} className="hierarchy-depth-wrap">
          <div className={`hierarchy-item ${!node.isActive ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}>
            <div className="hierarchy-depth" style={{ paddingLeft: depth * 24 }}>
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
                  {depth < 3 && (
                    <button
                      className="depth-btn create"
                      aria-label="하위 코드 추가"
                    ></button>
                  )}
                  <button
                    className="depth-btn edit"
                    aria-label="코드 수정"
                  ></button>
                </div>
              </div>
            </div>
          </div>
          {hasChildren && isOpen && (
            <div className="hierarchy-children">
              {renderTreeItems(node.children!, depth + 1)}
            </div>
          )}
        </div>
      )
    })
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
              renderTreeItems(treeData, 0)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
