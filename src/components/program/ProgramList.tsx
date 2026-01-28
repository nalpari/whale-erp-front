'use client'

import { useState, useEffect } from 'react'
import AnimateHeight from 'react-animate-height'

import ProgramFormModal from '@/components/program/ProgramFormModal'
import { useProgram } from '@/hooks/useProgram'
import type { Program } from '@/lib/schemas/program'

/**
 * 프로그램 목록 및 계층 관리 컴포넌트
 * @returns {JSX.Element} 프로그램 목록 UI
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
  } = useProgram()

  // 실시간 입력 검색어 (로컬 state)
  const [inputKeyword, setInputKeyword] = useState('')

  // 초기 로드시 트리 전체 열기 (한 번만)
  useEffect(() => {
    if (programs.length > 0 && openItems.size === 0) {
      expandAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programs.length])

  /**
   * 프로그램 트리에서 특정 프로그램의 부모 정보 찾기
   * @param targetId - 찾을 프로그램 ID
   * @returns Level1, Level2 부모 이름
   */
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

  /**
   * 키워드 하이라이트 처리
   * @param text - 원본 텍스트
   * @param keyword - 하이라이트할 키워드
   * @returns 하이라이트 처리된 JSX 요소
   */
  const highlightKeyword = (text: string, keyword: string) => {
    if (!keyword.trim()) return text

    const lowerText = text.toLowerCase()
    const lowerKeyword = keyword.toLowerCase()
    const index = lowerText.indexOf(lowerKeyword)

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

  /**
   * 최상위 프로그램 추가 모달 열기
   */
  const handleCreateTop = () => {
    openModal('create')
  }

  /**
   * 하위 프로그램 추가 모달 열기
   * @param program - 부모 프로그램
   */
  const handleCreate = (program: Program) => {
    openModal('create', program)
  }

  /**
   * 프로그램 수정 모달 열기
   * @param program - 수정할 프로그램
   */
  const handleEdit = (program: Program) => {
    openModal('edit', program)
  }

  /**
   * 프로그램 삭제
   * @param program - 삭제할 프로그램
   */
  const handleDelete = (program: Program) => {
    if (!confirm(`"${program.name}" 프로그램을 삭제하시겠습니까?`)) return

    // TODO: 삭제 API 구현
    alert('삭제 기능은 아직 구현되지 않았습니다.')
  }


  /**
   * 트리 아이템 재귀 렌더링
   * @param program - 렌더링할 프로그램 객체
   * @param depth - 현재 depth 레벨
   * @returns {JSX.Element} 트리 아이템 JSX
   */
  const renderTreeItem = (program: Program, depth: number) => {
    const hasChildren = program.children && program.children.length > 0
    const isOpen = program.id !== null && openItems.has(program.id)
    const canAddChild = depth < 3 // depth 3(최하위)이 아니면 하위 추가 가능
    // children ul에는 다음 depth 클래스 적용 (depth01 -> depth02 -> depth03)
    const childDepthClass = `depth0${Math.min(depth + 1, 3)}`

    return (
      <li
        key={program.id}
        className={`hierarchy-item ${!program.is_active ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
      >
        <div className="hierarchy-depth">
          <button className="order-btn"></button>
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
            {program.path && <div className="path-name">{program.path}</div>}
            {!program.is_active && <div className="disable-badge">비활성</div>}
            <div className="depth-btn-wrap">
              {canAddChild && (
                <button className="depth-btn create" onClick={() => handleCreate(program)}></button>
              )}
              <button className="depth-btn edit" onClick={() => handleEdit(program)}></button>
              <button className="depth-btn delete" onClick={() => handleDelete(program)}></button>
            </div>
          </div>
        </div>
        {hasChildren && (
          <AnimateHeight duration={300} height={isOpen ? 'auto' : 0}>
            <ul className={`hierarchy-list ${childDepthClass}`}>
              {program.children.map((child) => renderTreeItem(child, depth + 1))}
            </ul>
          </AnimateHeight>
        )}
      </li>
    )
  }

  if (loading) {
    return (
      <div className="contents-wrap">
        <div className="contents-body">{/* 로딩 중... */}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="contents-wrap">
        <div className="contents-body">
          <div>{error}</div>
        </div>
      </div>
    )
  }

  /**
   * 모달 부모 이름 계산
   */
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch(inputKeyword)
                      }
                    }}
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <div className="filed-flx">
                    <div className="auto-right g8">
                      <button
                        className="btn-form gray"
                        onClick={() => setInputKeyword('')}
                      >
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
          {searchResults.length > 0 && (
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
          )}
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
              <button className="btn-form basic s" onClick={handleCreateTop}>
                <i className="plus"></i> 최상위 추가
              </button>
            </div>
          </div>
          <div className="hierarchy-wrap">
            {programs.length === 0 ? (
              <div>{/* 등록된 프로그램이 없습니다. */}</div>
            ) : (
              <ul className="hierarchy-list depth01">
                {programs.map((program) => renderTreeItem(program, 1))}
              </ul>
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