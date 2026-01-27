'use client'

import { useState } from 'react'

import type { Program, ProgramFormData } from '@/lib/schemas/program'

interface ProgramFormModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  onClose: () => void
  onSubmit: (data: ProgramFormData) => void
  level1Name?: string
  level2Name?: string
  editData?: Program | null
}

const INITIAL_FORM_DATA: ProgramFormData = {
  name: '',
  path: '',
  is_active: true,
}

/**
 * 프로그램 등록/수정 모달 컴포넌트
 * @param isOpen - 모달 오픈 여부
 * @param mode - 'create' | 'edit'
 * @param onClose - 모달 닫기 핸들러
 * @param onSubmit - 폼 제출 핸들러
 * @param level1Name - Level1 부모 프로그램 이름
 * @param level2Name - Level2 부모 프로그램 이름
 * @param editData - 수정할 프로그램 데이터
 */
export default function ProgramFormModal({
  isOpen,
  mode,
  onClose,
  onSubmit,
  level1Name,
  level2Name,
  editData,
}: ProgramFormModalProps) {
  const initialData =
    mode === 'edit' && editData
      ? {
          name: editData.name,
          path: editData.path || '',
          is_active: editData.is_active,
        }
      : INITIAL_FORM_DATA

  const [formData, setFormData] = useState<ProgramFormData>(initialData)

  /**
   * 폼 제출 핸들러 - 검증 후 상위 컴포넌트로 전달
   */
  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('메뉴명을 입력해주세요.')
      return
    }
    onSubmit(formData)
  }

  /**
   * 모달 닫기 핸들러
   */
  const handleCancel = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-popup">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h2>프로그램 {mode === 'create' ? '등록' : '수정'}</h2>
            <button className="modal-close" onClick={handleCancel}></button>
          </div>
          <div className="modal-body">
            <div className="pop-frame">
              <table className="pop-table">
                <colgroup>
                  <col width="120px" />
                  <col />
                </colgroup>
                <tbody>
                  {level1Name && (
                    <tr>
                      <th>Level 1</th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame" value={level1Name} readOnly />
                        </div>
                      </td>
                    </tr>
                  )}
                  {level2Name && (
                    <tr>
                      <th>Level 2</th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame" value={level2Name} readOnly />
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <th>
                      운영 여부<span className="red">*</span>
                    </th>
                    <td>
                      <div className="filed-flx">
                        <div className="toggle-btn">
                          <input
                            type="checkbox"
                            id="program-is-active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          />
                          <label className="slider" htmlFor="program-is-active"></label>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      메뉴명 <span className="red">*</span>
                    </th>
                    <td>
                      <div className="block">
                        <input
                          type="text"
                          className="input-frame"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="메뉴명을 입력하세요"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>메뉴 URL</th>
                    <td>
                      <div className="block">
                        <input
                          type="text"
                          className="input-frame"
                          value={formData.path}
                          onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                          placeholder="/path/to/menu"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="pop-btn-content">
              <button className="btn-form gray" onClick={handleCancel}>
                취소
              </button>
              <button className="btn-form basic" onClick={handleSubmit}>
                저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
