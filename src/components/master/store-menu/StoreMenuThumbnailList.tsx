'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Pagination from '@/components/ui/Pagination'
import CubeLoader from '@/components/common/ui/CubeLoader'
import type { StoreMenuItem } from '@/types/store-menu'

const PAGE_SIZE_OPTIONS = [50, 100, 200]

interface StoreMenuThumbnailListProps {
  rows: StoreMenuItem[]
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  statusMap: Record<string, string>
  marketingMap: Record<string, string>
  menuPropertyMap: Record<string, string>
  menuTypeMap: Record<string, string>
  setStatusMap: Record<string, string>
  menuClassMap: Record<string, string>
  selectedIds: Set<number>
  onSelectChange: (id: number, checked: boolean) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onBulkStatusChange: (operationStatus: string) => void
  onSaveDisplayOrder: (changes: Map<number, string>) => void
  onMenuClick?: (menuId: number) => void
}

function formatPrice(price: number) {
  return price.toLocaleString('ko-KR')
}

function formatDate(dateStr: string) {
  return dateStr.slice(0, 10)
}

/** 마케팅 공통코드 name → thumb-badge CSS 클래스 매핑 */
function getMarketingBadgeClass(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('new') || lower.includes('신메뉴')) return 'new'
  if (lower.includes('best') || lower.includes('인기')) return 'best'
  if (lower.includes('event') || lower.includes('이벤트')) return 'event'
  return 'new'
}

/** 온도 태그 공통코드 → temp-badge CSS 클래스 매핑 */
function getTemperatureBadgeClass(code: string): string {
  if (code === 'TMPCF_001') return 'hot'
  if (code === 'TMPCF_002') return 'cold'
  return ''
}

/** menuProperty 공통코드 name → mapping 표시 텍스트 */
function getMappingLabel(menuProperty: string, menuPropertyMap: Record<string, string>): string {
  if (!menuProperty) return '매핑 안됨'
  const name = menuPropertyMap[menuProperty]
  if (!name) return '매핑 안됨'
  if (name.includes('본사')) return '본사 마스터'
  if (name.includes('가맹점')) return '가맹점 마스터'
  return name
}

export default function StoreMenuThumbnailList({
  rows,
  page,
  pageSize,
  totalPages,
  loading,
  statusMap,
  marketingMap,
  menuPropertyMap,
  menuTypeMap,
  setStatusMap,
  menuClassMap,
  selectedIds,
  onSelectChange,
  onPageChange,
  onPageSizeChange,
  onBulkStatusChange,
  onSaveDisplayOrder,
  onMenuClick,
}: StoreMenuThumbnailListProps) {
  const displayOrderRef = useRef<Map<number, string>>(new Map())

  // 페이지/데이터 변경 시 ref 초기화
  useEffect(() => {
    displayOrderRef.current.clear()
  }, [rows])

  if (loading) {
    return (
      <div className="cube-loader-overlay">
        <CubeLoader />
      </div>
    )
  }

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left">
          <button
            type="button"
            className="btn-form basic"
            disabled={selectedIds.size === 0}
            onClick={() => onBulkStatusChange('STOPR_001')}
          >
            운영
          </button>
          <button
            type="button"
            className="btn-form gray"
            disabled={selectedIds.size === 0}
            onClick={() => onBulkStatusChange('STOPR_002')}
          >
            미운영
          </button>
        </div>
        <div className="data-header-right">
          <button
            type="button"
            className="btn-form basic"
            onClick={() => onSaveDisplayOrder(displayOrderRef.current)}
          >
            저장
          </button>
          <div className="data-count-select">
            <select
              className="select-form"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="data-list-bx">
        {rows.length === 0 ? (
          <div className="empty-wrap">
            <div className="empty-data">조회된 메뉴가 없습니다.</div>
          </div>
        ) : (
          <div className="thumb-list-wrap">
            {rows.map((menu) => (
              <div
                key={menu.id}
                className="thumb-item"
                style={{ cursor: onMenuClick ? 'pointer' : undefined }}
                onClick={() => onMenuClick?.(menu.id)}
              >
                {/* 썸네일 이미지 */}
                <div className="thumb-item-img">
                  {/* 마케팅 뱃지 (NEW, BEST, EVENT) */}
                  {menu.marketingTags?.length > 0 && (
                    <div className="thumb-badge-wrap">
                      {menu.marketingTags.map((code) => {
                        const name = marketingMap[code] ?? code
                        return (
                          <span
                            key={code}
                            className={`thumb-badge ${getMarketingBadgeClass(name)}`}
                          >
                            {name}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {menu.menuImgFile?.publicUrl ? (
                    <Image
                      src={menu.menuImgFile.publicUrl}
                      alt={menu.menuName}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      aspectRatio: '1 / 1',
                      color: '#ccc',
                      fontSize: '14px',
                    }}>
                      No Image
                    </div>
                  )}

                  {/* 온도 뱃지 (HOT, COLD) */}
                  {menu.temperatureTags?.length > 0 && (
                    <div className="temp-badge-wrap">
                      {menu.temperatureTags.map((tag) => (
                        <span
                          key={tag}
                          className={`temp-badge ${getTemperatureBadgeClass(tag)}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 정보 영역 */}
                <div className="thumb-item-info">
                  {/* 타이틀: 운영상태 뱃지 + 메뉴명 + 체크박스 */}
                  <div className="thumb-item-info-tit">
                    <div className="info-tit-left">
                      <div
                        className={`store-badge ${
                          menu.operationStatus === 'STOPR_001' ? 'blue' : 'org'
                        }`}
                      >
                        {statusMap[menu.operationStatus] ?? menu.operationStatus}
                      </div>
                      <div className="info-tit">{menu.menuName}</div>
                    </div>
                    <div className="info-tit-right">
                      <div className="check-form-box no-txt" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          id={`menu-check-${menu.id}`}
                          className="check-input"
                          checked={selectedIds.has(menu.id)}
                          onChange={(e) => onSelectChange(menu.id, e.target.checked)}
                        />
                        <label htmlFor={`menu-check-${menu.id}`} />
                      </div>
                    </div>
                  </div>

                  {/* 상세 정보 테이블 */}
                  <div className="thumb-item-info-desc">
                    <table className="thum-desc-table">
                      <colgroup>
                        <col width="70px" />
                        <col />
                      </colgroup>
                      <tbody>
                        <tr>
                          <th>소속</th>
                          <td>
                            <ul className="thum-data-list">
                              <li className="thum-data-item">
                                <span className="thum-data-text">
                                  {menu.franchiseName ? `${menu.companyName} | ${menu.franchiseName}` : menu.companyName}
                                </span>
                              </li>
                            </ul>
                          </td>
                        </tr>
                        <tr>
                          <th>mapping</th>
                          <td>
                            <ul className="thum-data-list">
                              <li className="thum-data-item">
                                <span className="thum-data-text">{menu.menuProperty ? getMappingLabel(menu.menuProperty, menuPropertyMap) : '-'}</span>
                              </li>
                            </ul>
                          </td>
                        </tr>
                        <tr>
                          <th>노출 순서</th>
                          <td>
                            <ul className="thum-data-list">
                              <li className="thum-data-item">
                                <input
                                  type="text"
                                  className="input-frame small"
                                  defaultValue={menu.displayOrder}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    displayOrderRef.current.set(menu.id, e.target.value)
                                  }}
                                />
                              </li>
                            </ul>
                          </td>
                        </tr>
                        <tr>
                          <th>분류</th>
                          <td>
                            <ul className="thum-data-list">
                              <li className="thum-data-item">
                                <span className="thum-data-text">
                                  {menuTypeMap[menu.menuType] ?? menu.menuType} | {setStatusMap[menu.setStatus] ?? menu.setStatus} | {menuClassMap[menu.menuClassificationCode] ?? menu.menuClassificationCode}
                                </span>
                              </li>
                            </ul>
                          </td>
                        </tr>
                        {menu.categories?.length > 0 && (
                          <tr>
                            <th>카테고리</th>
                            <td>
                              <ul className="thum-data-list">
                                {menu.categories.map((cat) => (
                                  <li key={cat.id} className="thum-data-item">
                                    <span className="thum-data-text">{cat.name}</span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        )}
                        <tr>
                          <th>등록일</th>
                          <td>
                            <ul className="thum-data-list">
                              <li className="thum-data-item">
                                <span className="thum-data-text">{formatDate(menu.createdAt)}</span>
                              </li>
                            </ul>
                          </td>
                        </tr>
                        <tr>
                          <th>가 격</th>
                          <td>
                            <ul className="thum-data-list">
                              <li className="thum-data-item">
                                <span className="thum-data-text">
                                  {menu.salePrice == null ? (
                                    '-'
                                  ) : menu.discountPrice != null &&
                                    menu.discountPrice > 0 &&
                                    menu.discountPrice < menu.salePrice ? (
                                    <>
                                      <i className="price">
                                        {formatPrice(menu.salePrice)}원{' '}
                                      </i>
                                      <i className="discount">
                                        {formatPrice(menu.discountPrice)}원
                                      </i>
                                    </>
                                  ) : (
                                    <>{formatPrice(menu.salePrice)}원</>
                                  )}
                                </span>
                              </li>
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {rows.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  )
}
