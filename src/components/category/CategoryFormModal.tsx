'use client'

import { useState } from 'react'
import '@/components/common/custom-css/FormHelper.css'

import { formatZodFieldErrors } from '@/lib/zod-utils'
import { categoryFormSchema, type CategoryFormData } from '@/lib/schemas/category'
import type { Category } from '@/types/category'
import { formatDateYmd } from '@/util/date-util'

interface CategoryFormModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  onClose: () => void
  onSubmit: (data: CategoryFormData) => void
  parentName?: string
  parentCode?: string
  editData?: Category | null
}

export default function CategoryFormModal({
  isOpen,
  mode,
  onClose,
  onSubmit,
  parentName,
  parentCode,
  editData,
}: CategoryFormModalProps) {
  const isTopLevelCreate = mode === 'create' && !parentName

  const initialData =
    mode === 'edit' && editData
      ? {
          categoryName: editData.categoryName,
          isActive: editData.isActive,
          isFixed: true,
        }
      : {
          categoryName: '',
          isActive: true,
          isFixed: true,
        }

  const [formData, setFormData] = useState<CategoryFormData>(initialData)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = () => {
    const result = categoryFormSchema.safeParse(formData)

    if (!result.success) {
      setFieldErrors(formatZodFieldErrors(result.error))
      return
    }

    setFieldErrors({})
    onSubmit(result.data)
  }

  const handleCancel = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-popup">
      <div className="modal-dialog ">
        <div className="modal-content">
          <div className="modal-header">
            <h2>{mode === 'edit' ? '마스터용 카테고리 수정' : '마스터용 카테고리 등록'}</h2>
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
                  {isTopLevelCreate ? null : (
                    <tr>
                      <th>Level 1</th>
                      <td>
                        <div className="filed-flx">
                          <div className="block">
                            <input type="text" className="input-frame" value={parentName ?? ''} readOnly />
                          </div>
                          <span className="explain">{parentCode ?? ''}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <th>
                      운영여부<span className="red">*</span>
                    </th>
                    <td>
                      <div className="filed-flx">
                        <div className="toggle-btn">
                          <input
                            type="checkbox"
                            id="category-is-active"
                            checked={formData.isActive}
                            disabled={isTopLevelCreate}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          />
                          <label className="slider" htmlFor="category-is-active"></label>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      고정형 여부<span className="red">*</span>
                    </th>
                    <td>
                      <div className="filed-flx">
                        <div className="toggle-btn">
                          <input
                            type="checkbox"
                            id="category-is-fixed"
                            checked={formData.isFixed}
                            disabled
                            readOnly
                          />
                          <label className="slider" htmlFor="category-is-fixed"></label>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>카테고리 코드</th>
                    <td>
                      <div className="block">
                        <input type="text" className="input-frame" value={editData?.categoryCode ?? ''} readOnly />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      카테고리 명 <span className="red">*</span>
                    </th>
                    <td>
                      <div className="block">
                        <input
                          type="text"
                          className="input-frame"
                          value={formData.categoryName}
                          onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                        />
                      </div>
                      {fieldErrors.categoryName ? <div className="warning-txt">{fieldErrors.categoryName}</div> : null}
                    </td>
                  </tr>
                  <tr>
                    <th>등록일</th>
                    <td>
                      <div className="block">
                        <input
                          type="text"
                          className="input-frame"
                          value={editData ? formatDateYmd(editData.createdAt) : ''}
                          readOnly
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="pop-btn-content">
              <button className="btn-form gray" onClick={handleCancel}>취소</button>
              <button className="btn-form basic" onClick={handleSubmit}>저장</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
