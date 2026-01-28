'use client'

import { useState, useEffect } from 'react'

import type { Program } from '@/lib/schemas/program'
import { useProgram } from '@/hooks/useProgram'
import DraggableTree, { type DragHandleProps } from '@/components/common/DraggableTree'
import ProgramFormModal from '@/components/program/ProgramFormModal'

/**
 * 프로그램 목록 및 계층 관리 컴포넌트
 * - 프로그램 검색
 * - 계층 구조 표시 (3단계)
 * - 드래그 앤 드롭으로 순서 변경
 */
export default function ProgramList() {
  const {
    programs,
    loading,
    error,
    searchKeyword,
    searchResults,
    openItems,
    isModalOpen,
    modalMode,
    modalProgram,
    handleSearch,
    toggleItem,
    setOpenItems,
    expandAll,
    openModal,
    closeModal,
    handleSubmit,
    handleDelete, // eslint-disable-line @typescript-eslint/no-unused-vars -- 기획에 없어 현재 미사용
    handleReorder,
  } = useProgram()

  const [inputKeyword, setInputKeyword] = useState('')

  // 초기 로드시 트리 전체 열기
  useEffect(() => {
    if (programs.length > 0 && openItems.size === 0) {
      expandAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programs.length])

  // 프로그램의 부모 이름 찾기 (모달에서 표시용)
  const findProgramParents = (targetId: number | null): { level1Name?: string; level2Name?: string } => {
    if (targetId === null) return {}

    const findInTree = (items: Program[], parents: Program[] = []): { level1Name?: string; level2Name?: string } => {
      for (const program of items) {
        if (program.id === targetId) {
          if (parents.length === 0) return {}
          if (parents.length === 1) return { level1Name: parents[0].name }
          return { level1Name: parents[0].name, level2Name: parents[1].name }
        }

        if (program.children?.length) {
          parents.push(program)
          const result = findInTree(program.children, parents)
          if (Object.keys(result).length > 0) return result
          parents.pop()
        }
      }
      return {}
    }

    return findInTree(programs)
  }

  // 검색 키워드 하이라이트 (대소문자 구분 없음)
  const highlightKeyword = (text: string, keyword: string) => {
    if (!keyword.trim()) return text

    const index = text.toLowerCase().indexOf(keyword.toLowerCase())
    if (index === -1) return text

    const before = text.slice(0, index)
    const match = text.slice(index, index + keyword.length)
    const after = text.slice(index + keyword.length)

    return (
      <>
        {before}
        <span>{match}</span>
        {after}
      </>
    )
  }

  // 프로그램 트리 아이템 렌더링 (DraggableTree의 renderItem 콜백)
  const renderProgramItem = (
    program: Program,
    depth: number,
    dragHandleProps: DragHandleProps,
    hasChildren: boolean,
    isOpen: boolean,
  ) => {
    const canAddChild = depth < 3

    return (
      <div className={`hierarchy-item ${!program.is_active ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}>
        <div className="hierarchy-depth">
          <button className="order-btn" {...dragHandleProps.attributes} {...dragHandleProps.listeners}></button>
          <div className="depth-inner">
            {hasChildren && (
              <button
                className="depth-arr"
                onClick={() => program.id !== null && toggleItem(program.id)}
                aria-label="하위 메뉴 토글"
              ></button>
            )}
            <div className="depth-name">{program.name}</div>
          </div>
          <div className="depth-right">
            {program.path ? <div className="path-name">{program.path}</div> : null}
            {!program.is_active ? <div className="disable-badge">비활성</div> : null}
            <div className="depth-btn-wrap">
              {canAddChild && (
                <button className="depth-btn create" onClick={() => openModal('create', program)}></button>
              )}
              <button className="depth-btn edit" onClick={() => openModal('edit', program)}></button>
              {/* 삭제 기능 - 기획에 없어 주석 처리 */}
              {/* <button className="depth-btn delete" onClick={() => program.id && handleDelete(program.id, program.name)}></button> */}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 로딩/에러 상태 처리
  if (loading)
    return (
      <div className="contents-wrap">
        <div className="contents-body"></div>
      </div>
    )
  if (error)
    return (
      <div className="contents-wrap">
        <div className="contents-body">
          <div>{error}</div>
        </div>
      </div>
    )

  // 모달에 표시할 부모 이름 계산 (생성/수정 모드에 따라 다름)
  const getModalParentNames = () => {
    if (!modalProgram) return { level1Name: undefined, level2Name: undefined }

    const parents = findProgramParents(modalProgram.id)

    if (modalMode === 'create') {
      return {
        level1Name: parents.level1Name || modalProgram.name,
        level2Name: parents.level2Name || (parents.level1Name ? modalProgram.name : undefined),
      }
    }

    return parents
  }

  const { level1Name, level2Name } = getModalParentNames()

  return (
    <div className="contents-wrap">
      <div className="contents-body">
        <div className="content-wrap">
          <table className="default-table">
            <colgroup>
              <col width="120px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>메뉴 검색</th>
                <td>
                  <input
                    type="text"
                    className="input-frame"
                    value={inputKeyword}
                    onChange={(e) => setInputKeyword(e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <div className="filed-flx">
                    <div className="auto-right g8">
                      <button className="btn-form gray" onClick={() => setInputKeyword('')}>
                        초기화
                      </button>
                      <button className="btn-form basic" onClick={() => handleSearch(inputKeyword)}>
                        검색
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          {searchResults.length > 0 ? (
            <div className="program-result">
              <div className="program-result-tit">검색결과</div>
              <div className="program-result-list-wrap">
                {searchResults.map((result) => (
                  <ul key={result.programId} className="program-result-list">
                    {result.path.map((name, index) => (
                      <li key={index} className="program-result-item">
                        {highlightKeyword(name, searchKeyword)}
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="content-wrap">
          <div className="data-list-header">
            <div className="hierarchy-bx">
              <div className="hierarchy-tit">프로그램 계층 관리</div>
              <div className="hierarchy-txt">드래그 앤 드롭을 사용하여 동일 레벨 내 순서를 변경할 수 있습니다.</div>
            </div>
            <div className="data-header-right">
              <button className="btn-form gray s" onClick={() => setOpenItems(new Set())}>
                All Close
              </button>
              <button className="btn-form basic s" onClick={() => openModal('create')}>
                <i className="plus"></i> 최상위 추가
              </button>
            </div>
          </div>
          <div className="hierarchy-wrap">
            {programs.length === 0 ? (
              <div></div>
            ) : (
              <DraggableTree
                items={programs}
                openItems={openItems}
                renderItem={renderProgramItem}
                onReorder={handleReorder}
              />
            )}
          </div>
        </div>
      </div>
      <ProgramFormModal
        key={isModalOpen ? `${modalMode}-${modalProgram?.id || 'new'}` : 'closed'}
        isOpen={isModalOpen}
        mode={modalMode}
        onClose={closeModal}
        onSubmit={handleSubmit}
        level1Name={level1Name}
        level2Name={level2Name}
        editData={modalMode === 'edit' ? modalProgram : null}
      />
    </div>
  )
}
