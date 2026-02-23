'use client'

import { useState } from 'react'
import type { CommonCodeNode } from '@/hooks/queries/use-common-code-queries'

export interface CommonCodeFormData {
  code: string
  name: string
  description: string
  isActive: boolean
  codeGroup: string
  headOffice: string
  franchise: string
}

interface CommonCodeFormModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  onClose: () => void
  onSubmit: (data: CommonCodeFormData) => void
  parentNode?: CommonCodeNode | null
  editNode?: CommonCodeNode | null
  codeGroup: string
  headOffice?: string
  franchise?: string
}

const CODE_GROUP_OPTIONS = [
  { value: 'platform', label: '플랫폼' },
  { value: 'bp', label: 'BP' },
]

const INITIAL_FORM_DATA: CommonCodeFormData = {
  code: '',
  name: '',
  description: '',
  isActive: true,
  codeGroup: '',
  headOffice: '',
  franchise: '',
}

/**
 * 공통코드 등록/수정 모달 컴포넌트
 */
export default function CommonCodeFormModal({
  isOpen,
  mode,
  onClose,
  onSubmit,
  parentNode,
  editNode,
  codeGroup,
  headOffice,
  franchise,
}: CommonCodeFormModalProps) {
  const initialData: CommonCodeFormData =
    mode === 'edit' && editNode
      ? {
          code: editNode.code,
          name: editNode.name,
          description: editNode.description ?? '',
          isActive: editNode.isActive,
          codeGroup,
          headOffice: headOffice ?? '',
          franchise: franchise ?? '',
        }
      : {
          ...INITIAL_FORM_DATA,
          codeGroup,
          headOffice: headOffice ?? '',
          franchise: franchise ?? '',
        }

  const [formData, setFormData] = useState<CommonCodeFormData>(initialData)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.code.trim()) {
      errors.code = '※ 코드는 필수입니다.'
    }
    if (!formData.name.trim()) {
      errors.name = '※ 코드명은 필수입니다.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="modal-popup">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h2>공통코드 {mode === 'create' ? '등록' : '수정'}</h2>
            <button className="modal-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="pop-frame">
              <table className="pop-table">
                <colgroup>
                  <col width="120px" />
                  <col />
                  <col width="120px" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th>
                      코드 그룹 {mode === 'create' && !parentNode && <span className="red">*</span>}
                    </th>
                    <td colSpan={3}>
                      <div className="block">
                        {mode === 'create' && !parentNode ? (
                          <select
                            className="select-form"
                            value={formData.codeGroup}
                            onChange={(e) => setFormData({ ...formData, codeGroup: e.target.value })}
                          >
                            {CODE_GROUP_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="input-frame"
                            value={CODE_GROUP_OPTIONS.find((o) => o.value === formData.codeGroup)?.label ?? formData.codeGroup}
                            readOnly
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                  {mode === 'create' && parentNode && (
                    <tr>
                      <th>상위 코드</th>
                      <td colSpan={3}>
                        <div className="block">
                          <input
                            type="text"
                            className="input-frame"
                            value={`[${parentNode.code}] ${parentNode.name}`}
                            readOnly
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                  {mode === 'edit' && editNode && editNode.depth > 0 && (
                    <tr>
                      <th>상위 코드</th>
                      <td colSpan={3}>
                        <div className="block">
                          <input
                            type="text"
                            className="input-frame"
                            value="(현재 부모 노드)"
                            readOnly
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <th>
                      코드 <span className="red">*</span>
                    </th>
                    <td colSpan={3}>
                      <div className="block">
                        <input
                          type="text"
                          className="input-frame"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          readOnly={mode === 'edit'}
                          placeholder="코드를 입력하세요"
                        />
                      </div>
                      {fieldErrors.code && <div className="warning-txt">{fieldErrors.code}</div>}
                    </td>
                  </tr>
                  <tr>
                    <th>
                      코드명 <span className="red">*</span>
                    </th>
                    <td colSpan={3}>
                      <div className="block">
                        <input
                          type="text"
                          className="input-frame"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="코드명을 입력하세요"
                        />
                      </div>
                      {fieldErrors.name && <div className="warning-txt">{fieldErrors.name}</div>}
                    </td>
                  </tr>
                  <tr>
                    <th>설명</th>
                    <td colSpan={3}>
                      <div className="block">
                        <input
                          type="text"
                          className="input-frame"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="설명을 입력하세요"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      운영 여부 <span className="red">*</span>
                    </th>
                    <td colSpan={3}>
                      <div className="filed-flx">
                        <div className="toggle-btn">
                          <input
                            type="checkbox"
                            id="common-code-is-active"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          />
                          <label className="slider" htmlFor="common-code-is-active"></label>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="pop-btn-content">
              <button className="btn-form gray" onClick={onClose}>
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
