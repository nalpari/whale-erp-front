'use client'

import { useState } from 'react'
import { useOperatingOptionMenus } from '@/hooks/queries/use-master-menu-queries'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { Input } from '@/components/common/ui'
import type { MenuResponse } from '@/lib/schemas/menu'

interface FindOptionPopProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (menu: MenuResponse) => void
  bpId: number
}

export default function FindOptionPop({ isOpen, onClose, onSelect, bpId }: FindOptionPopProps) {
  const [keyword, setKeyword] = useState('')
  const { data: menus = [], isLoading } = useOperatingOptionMenus(bpId, isOpen)

  if (!isOpen) return null

  const filtered = keyword
    ? menus.filter((m) => m.menuName.toLowerCase().includes(keyword.toLowerCase()))
    : menus

  const handleSelect = (menu: MenuResponse) => {
    onSelect(menu)
    setKeyword('')
    onClose()
  }

  const handleClose = () => {
    setKeyword('')
    onClose()
  }

  return (
    <div className="modal-popup show">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">옵션 찾기</h2>
            <button type="button" className="modal-close" onClick={handleClose}>
              <i className="close-icon"></i>
            </button>
          </div>
          <div className="modal-body">
            <div className="pop-guide">
              <p>옵션 메뉴를 선택하세요.</p>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="옵션명 검색"
                showClear
                onClear={() => setKeyword('')}
                fullWidth
              />
            </div>
            <div className="pop-table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {isLoading ? (
                <div className="cube-loader-overlay">
                  <CubeLoader />
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-wrap">
                  <div className="empty-data">조회된 옵션 메뉴가 없습니다.</div>
                </div>
              ) : (
                <table className="default-table">
                  <colgroup>
                    <col />
                    <col width="120px" />
                    <col width="100px" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>옵션명</th>
                      <th>소속</th>
                      <th>선택</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((menu) => (
                      <tr key={menu.id}>
                        <td>{menu.menuName}</td>
                        <td>{menu.companyName ?? '-'}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-form outline s"
                            onClick={() => handleSelect(menu)}
                          >
                            선택
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="pop-btn-content">
            <button type="button" className="btn-form gray" onClick={handleClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
