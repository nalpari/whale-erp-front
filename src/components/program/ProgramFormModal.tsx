'use client'

import { useState } from 'react'
import '@/components/common/custom-css/FormHelper.css'

import { formatZodFieldErrors } from '@/lib/zod-utils'
import { programFormSchema, type Program, type ProgramFormData } from '@/lib/schemas/program'
import { formatDateYmd } from '@/util/date-util'
import { useCommonCodeHierarchy } from '@/hooks/queries/use-common-code-queries'

interface ProgramFormModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  onClose: () => void
  onSubmit: (data: ProgramFormData) => void
  level1Name?: string
  level2Name?: string
  parentMenuKind?: string
  editData?: Program | null
}

const INITIAL_FORM_DATA: ProgramFormData = {
  menu_kind: '',
  name: '',
  path: '',
  icon_url: '',
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
  parentMenuKind,
  editData,
}: ProgramFormModalProps) {
  const { data: menuKindCodes = [] } = useCommonCodeHierarchy('MNKND')

  const initialData =
    mode === 'edit' && editData
      ? {
          menu_kind: editData.menu_kind,
          name: editData.name,
          path: editData.path || '',
          icon_url: editData.icon_url || '',
          is_active: editData.is_active,
        }
      : mode === 'create' && parentMenuKind
        ? {
            ...INITIAL_FORM_DATA,
            menu_kind: parentMenuKind,
          }
        : {
            ...INITIAL_FORM_DATA,
            menu_kind: menuKindCodes[0]?.code || '',
          }

  const [formData, setFormData] = useState<ProgramFormData>(initialData)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  /**
   * 폼 제출 핸들러 - Zod 검증 후 상위 컴포넌트로 전달
   */
  const handleSubmit = () => {
    const result = programFormSchema.safeParse(formData)

    if (!result.success) {
      setFieldErrors(formatZodFieldErrors(result.error))
      return
    }

    setFieldErrors({}) // 에러 초기화
    onSubmit(result.data)
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
                  <col width="120px" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th>
                      메뉴 구분 {mode === 'create' && !parentMenuKind && <span className="red">*</span>}
                    </th>
                    <td colSpan={3}>
                      <div className="block">
                        {mode === 'create' && !parentMenuKind ? (
                          <select
                            className="select-form"
                            value={formData.menu_kind}
                            onChange={(e) => setFormData({ ...formData, menu_kind: e.target.value })}
                          >
                            {menuKindCodes.map((code) => (
                              <option key={code.code} value={code.code}>
                                {code.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="input-frame"
                            value={menuKindCodes.find((c) => c.code === formData.menu_kind)?.name || formData.menu_kind}
                            readOnly
                          />
                        )}
                      </div>
                      {fieldErrors.menu_kind && <div className="form-helper error">{fieldErrors.menu_kind}</div>}
                    </td>
                  </tr>
                  {level1Name && (
                    <tr>
                      <th>Level 1</th>
                      <td colSpan={3}>
                        <div className="block">
                          <input type="text" className="input-frame" value={level1Name} readOnly />
                        </div>
                      </td>
                    </tr>
                  )}
                  {level2Name && (
                    <tr>
                      <th>Level 2</th>
                      <td colSpan={3}>
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
                    <td colSpan={3}>
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
                    <td colSpan={3}>
                      <div className="block">
                        <input
                          type="text"
                          className="input-frame"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      {fieldErrors.name && <div className="form-helper error">{fieldErrors.name}</div>}
                    </td>
                  </tr>
                  <tr>
                    <th>메뉴 URL</th>
                    <td colSpan={3}>
                      <div className="block">
                        <input
                          type="text"
                          className="input-frame"
                          value={formData.path ?? ''}
                          onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>아이콘 URL</th>
                    <td colSpan={3}>
                      <div className="block">
                        <input
                          type="text"
                          className="input-frame"
                          value={formData.icon_url ?? ''}
                          onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                        />
                      </div>
                    </td>
                  </tr>
                  {mode === 'edit' && editData && (
                    <>
                      <tr>
                        <th>등록자</th>
                        <td>
                          <div className="block">
                            <input
                              type="text"
                              className="input-frame"
                              value={editData.created_by_name || '-'}
                              readOnly
                            />
                          </div>
                        </td>
                        <th>등록일</th>
                        <td>
                          <div className="block">
                            <input
                              type="text"
                              className="input-frame"
                              value={formatDateYmd(editData.created_at)}
                              readOnly
                            />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <th>최종 수정자</th>
                        <td>
                          <div className="block">
                            <input
                              type="text"
                              className="input-frame"
                              value={editData.updated_by_name || '-'}
                              readOnly
                            />
                          </div>
                        </td>
                        <th>최종 수정일</th>
                        <td>
                          <div className="block">
                            <input
                              type="text"
                              className="input-frame"
                              value={formatDateYmd(editData.updated_at)}
                              readOnly
                            />
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
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
