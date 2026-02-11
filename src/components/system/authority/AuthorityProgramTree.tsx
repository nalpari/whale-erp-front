'use client'

import { useState, useEffect, useRef } from 'react'
import AnimateHeight from 'react-animate-height'
import { Tooltip } from 'react-tooltip'
import { useAuthorityList, useAuthorityDetail, useUpdateProgramAuthority } from '@/hooks/queries/use-authority-queries'
import type { AuthorityDetailNode, AuthorityFilterType, AuthorityListItem } from '@/lib/schemas/authority'

/**
 * 권한별 프로그램 트리 컴포넌트
 *
 * 계층 구조로 프로그램을 표시하고, 각 프로그램별로 Read/Create,Delete/Update 권한을 설정
 * 상위 프로그램의 권한 변경 시 하위 프로그램에 자동 전파
 * 다른 권한에서 복사 기능 제공
 *
 * @param programTree - 프로그램 트리 데이터
 * @param onChange - 프로그램 트리 변경 핸들러
 * @param currentOwnerCode - 현재 권한의 owner_code (권한 복사 필터링용)
 * @param authorityId - 권한 ID (수정 모드에서 낙관적 업데이트용)
 */
interface AuthorityProgramTreeProps {
  programTree: AuthorityDetailNode[]
  onChange: (tree: AuthorityDetailNode[]) => void
  currentOwnerCode?: string
  authorityId?: number
}

export default function AuthorityProgramTree({
  programTree,
  onChange,
  currentOwnerCode,
  authorityId,
}: AuthorityProgramTreeProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  const [activeFilter, setActiveFilter] = useState<AuthorityFilterType>(null)

  // 프로그램 권한 수정 mutation (낙관적 업데이트용)
  const { mutateAsync: updateProgramAuthority } = useUpdateProgramAuthority()

  // Loading state: API 호출 중인 프로그램 ID 추적
  const [loadingPrograms, setLoadingPrograms] = useState<Set<number>>(new Set())

  // Race condition 방지: 최신 요청 ID 추적
  const latestRequestIdRef = useRef<number>(0)

  // 모든 프로그램 ID 수집 (재귀)
  const collectAllProgramIds = (nodes: AuthorityDetailNode[]): number[] => {
    const ids: number[] = []
    for (const node of nodes) {
      ids.push(node.program_id)
      if (node.children) {
        ids.push(...collectAllProgramIds(node.children))
      }
    }
    return ids
  }

  // 초기 로드 시 모든 토글 열기
  useEffect(() => {
    if (programTree.length > 0 && openItems.size === 0) {
      const allIds = collectAllProgramIds(programTree)
      setOpenItems(new Set(allIds))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run when programTree changes
  }, [programTree])

  // 권한 복사 관련 상태
  const [copyAuthorityId, setCopyAuthorityId] = useState<number | null>(null)

  // owner_code에서 owner_group 추출 (PRGRP_001_001 → PRGRP_001, PRGRP_002_001 → PRGRP_002)
  const ownerGroup = currentOwnerCode?.split('_').slice(0, 2).join('_')

  // 권한 목록 조회 (복사용 - 현재 owner_code와 동일한 권한만)
  const { data: authorityListData } = useAuthorityList(
    ownerGroup
      ? {
          owner_group: ownerGroup,
          page: 1,
          size: 100,
        }
      : { owner_group: '', page: 1, size: 100 }
  )

  // 선택된 권한 상세 조회 (복사용)
  const { data: selectedAuthority } = useAuthorityDetail(copyAuthorityId || 0)

  // 전체 닫기
  const handleAllClose = () => {
    setOpenItems(new Set())
  }

  // 토글 아이템
  const handleToggleItem = (programId: number) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(programId)) {
        newSet.delete(programId)
      } else {
        newSet.add(programId)
      }
      return newSet
    })
  }

  // 필터 토글
  const handleFilterToggle = (filter: AuthorityFilterType) => {
    if (activeFilter === filter) {
      setActiveFilter(null)
    } else {
      setActiveFilter(filter)
    }
  }

  /**
   * 노드가 현재 활성화된 필터와 일치하는지 확인
   * @param node - 프로그램 노드
   * @returns 필터와 일치하면 true
   */
  const matchesFilter = (node: AuthorityDetailNode): boolean => {
    if (!activeFilter) return false

    switch (activeFilter) {
      case 'read':
        return node.can_read ?? false
      case 'create_delete':
        return node.can_create_delete ?? false
      case 'update':
        return node.can_update ?? false
      default:
        return false
    }
  }

  // 권한 변경 핸들러 (낙관적 업데이트 + API 호출)
  const handlePermissionChange = async (
    programId: number,
    field: 'can_read' | 'can_create_delete' | 'can_update',
    value: boolean
  ) => {
    // 중복 탐색 방지: 업데이트된 트리와 대상 노드를 함께 반환
    type UpdateResult = {
      newTree: AuthorityDetailNode[]
      targetNode: AuthorityDetailNode | null
    }

    const updateNodeAndChildren = (
      nodes: AuthorityDetailNode[],
      targetId: number
    ): UpdateResult => {
      let foundNode: AuthorityDetailNode | null = null

      const updatedNodes = nodes.map((node) => {
        if (node.program_id === targetId) {
          // 현재 노드 업데이트
          const updatedNode = { ...node, [field]: value }

          // can_read가 false면 나머지도 false
          if (field === 'can_read' && !value) {
            updatedNode.can_create_delete = false
            updatedNode.can_update = false
          }

          // 하위 노드도 동일하게 업데이트
          if (updatedNode.children) {
            updatedNode.children = updatedNode.children.map((child) =>
              updateNodeRecursive(child, field, value)
            )
          }

          foundNode = updatedNode
          return updatedNode
        } else if (node.children) {
          const result = updateNodeAndChildren(node.children, targetId)
          if (result.targetNode) {
            foundNode = result.targetNode
          }
          return { ...node, children: result.newTree }
        }
        return node
      })

      return { newTree: updatedNodes, targetNode: foundNode }
    }

    const updateNodeRecursive = (
      node: AuthorityDetailNode,
      field: 'can_read' | 'can_create_delete' | 'can_update',
      value: boolean
    ): AuthorityDetailNode => {
      const updatedNode = { ...node, [field]: value }

      // can_read가 false면 나머지도 false
      if (field === 'can_read' && !value) {
        updatedNode.can_create_delete = false
        updatedNode.can_update = false
      }

      // 하위 노드도 동일하게 업데이트
      if (updatedNode.children) {
        updatedNode.children = updatedNode.children.map((child) =>
          updateNodeRecursive(child, field, value)
        )
      }

      return updatedNode
    }

    // 이전 상태 저장 (에러 시 롤백용)
    const previousTree = programTree

    // 1. 낙관적 업데이트: 즉시 UI 반영
    const { newTree, targetNode } = updateNodeAndChildren(programTree, programId)
    onChange(newTree)

    // 2. 수정 모드에서만 API 호출 (생성 모드는 저장 버튼 클릭 시 한번에 전송)
    if (authorityId) {
      if (!targetNode) {
        console.error('프로그램을 찾을 수 없습니다:', programId)
        return
      }

      // Race condition 방지: 현재 요청 ID 생성
      const currentRequestId = ++latestRequestIdRef.current

      // Loading state 추가
      setLoadingPrograms((prev) => new Set(prev).add(programId))

      try {
        // API 호출
        const response = await updateProgramAuthority({
          id: authorityId,
          programId,
          data: {
            can_read: targetNode.can_read ?? false,
            can_create_delete: targetNode.can_create_delete ?? false,
            can_update: targetNode.can_update ?? false,
          },
        })

        // Race condition 방지: 최신 요청만 적용
        if (currentRequestId !== latestRequestIdRef.current) {
          console.log('이전 요청 무시 (최신 요청이 있음)')
          return
        }

        // 응답 검증 및 동기화
        if (response?.details) {
          onChange(response.details)
        } else {
          console.warn('서버 응답에 details가 없습니다')
        }
      } catch (error) {
        console.error('프로그램 권한 업데이트 실패:', error)

        // Race condition 방지: 최신 요청만 롤백
        if (currentRequestId === latestRequestIdRef.current) {
          // 에러 발생 시 이전 상태로 롤백
          onChange(previousTree)
          alert('권한 업데이트에 실패했습니다.')
        }
      } finally {
        // Loading state 제거
        setLoadingPrograms((prev) => {
          const next = new Set(prev)
          next.delete(programId)
          return next
        })
      }
    }
  }

  // 권한 복사 적용
  const handleApplyCopy = () => {
    if (!selectedAuthority?.details) return

    onChange(selectedAuthority.details)
  }

  // 트리 노드 렌더링
  const renderTreeNode = (node: AuthorityDetailNode, depth: number) => {
    const hasChildren = node.children && node.children.length > 0
    const isOpen = openItems.has(node.program_id)
    const isHighlighted = matchesFilter(node)
    const isLoading = loadingPrograms.has(node.program_id)

    const childDepth = depth + 1
    const childDepthClass = `depth0${Math.min(childDepth, 3)}`

    return (
      <li
        key={node.program_id}
        className={`hierarchy-item ${isOpen ? 'open' : ''}`}
      >
        <div className={`hierarchy-depth ${isHighlighted ? 'filter' : ''}`}>
          <div className="depth-inner">
            {hasChildren && (
              <button
                className="depth-arr"
                onClick={() => handleToggleItem(node.program_id)}
                aria-label="하위 메뉴 토글"
              ></button>
            )}
            <div className="depth-name">{node.program_name}</div>
          </div>
          <div className="depth-right">
            <div className="authority-check">
              <div className="check-form-box">
                <input
                  type="checkbox"
                  id={`read-${node.program_id}`}
                  checked={node.can_read ?? false}
                  onChange={(e) => handlePermissionChange(node.program_id, 'can_read', e.target.checked)}
                  disabled={isLoading || node.max_can_read === false}
                />
                <label htmlFor={`read-${node.program_id}`}>Read{isLoading && ' (저장중...)'}</label>
              </div>
              <div className="check-form-box">
                <input
                  type="checkbox"
                  id={`create-delete-${node.program_id}`}
                  checked={node.can_create_delete ?? false}
                  onChange={(e) =>
                    handlePermissionChange(node.program_id, 'can_create_delete', e.target.checked)
                  }
                  disabled={isLoading || !node.can_read || node.max_can_create_delete === false}
                />
                <label htmlFor={`create-delete-${node.program_id}`}>Create, Delete</label>
              </div>
              <div className="check-form-box">
                <input
                  type="checkbox"
                  id={`update-${node.program_id}`}
                  checked={node.can_update ?? false}
                  onChange={(e) => handlePermissionChange(node.program_id, 'can_update', e.target.checked)}
                  disabled={isLoading || !node.can_read || node.max_can_update === false}
                />
                <label htmlFor={`update-${node.program_id}`}>Update</label>
              </div>
            </div>
          </div>
        </div>
        {hasChildren && (
          <AnimateHeight duration={300} height={isOpen ? 'auto' : 0}>
            <ul className={`hierarchy-list ${childDepthClass}`}>
              {node.children?.map((child) => renderTreeNode(child, childDepth))}
            </ul>
          </AnimateHeight>
        )}
      </li>
    )
  }

  return (
    <div className="content-wrap">
      <div className="authority-table-wrap">
        <div className="authority-table-header">
          <button className="tooltip-btn">
            <span className="tooltip-icon" id="tooltip-btn-anchor"></span>
            <Tooltip className="tooltip-txt" anchorSelect="#tooltip-btn-anchor" opacity={1}>
              <div>기존에 등록된 메뉴별 권한을 copy하여 현재 조회/등록 중인 권한을 만들 수 있습니다.</div>
            </Tooltip>
          </button>
          <div className="default-txt">다른 권한 COPY</div>
          <div className="hierarchy-select">
            <select
              className="select-form"
              value={copyAuthorityId || ''}
              onChange={(e) => setCopyAuthorityId(Number(e.target.value))}
              disabled={!currentOwnerCode}
            >
              <option value="">권한 선택</option>
              {authorityListData?.content
                ?.filter((auth: AuthorityListItem) =>
                  auth.owner_code === currentOwnerCode
                )
                .map((auth: AuthorityListItem) => (
                  <option key={auth.id} value={auth.id}>
                    {auth.name}
                  </option>
                ))}
            </select>
          </div>
          <button className="btn-form basic" onClick={handleApplyCopy} disabled={!copyAuthorityId}>
            적용하기
          </button>
          <button
            className={`btn-form ${activeFilter === 'read' ? 'basic' : 'gray'}`}
            onClick={() => handleFilterToggle('read')}
          >
            {activeFilter === 'read' && <i className="check"></i>}
            Read
          </button>
          <button
            className={`btn-form ${activeFilter === 'create_delete' ? 'basic' : 'outline'} s`}
            onClick={() => handleFilterToggle('create_delete')}
          >
            {activeFilter === 'create_delete' && <i className="check"></i>}
            Create, Delete
          </button>
          <button
            className={`btn-form ${activeFilter === 'update' ? 'basic' : 'gray'}`}
            onClick={() => handleFilterToggle('update')}
          >
            {activeFilter === 'update' && <i className="check"></i>}
            Update
          </button>
          <button className="btn-form gray s" onClick={handleAllClose}>
            All Close
          </button>
        </div>
        <div className="hierarchy-wrap">
          <ul className="hierarchy-list depth01">
            {programTree.map((node) => renderTreeNode(node, 1))}
          </ul>
        </div>
      </div>
    </div>
  )
}
