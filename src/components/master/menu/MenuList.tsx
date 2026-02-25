'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Pagination from '@/components/ui/Pagination'
import CubeLoader from '@/components/common/ui/CubeLoader'
import AddStoreMenuPop from '@/components/master/menu/AddStoreMenuPop'
import { useCommonCodeHierarchy } from '@/hooks/queries/use-common-code-queries'
import { formatDateYmd } from '@/util/date-util'
import type { MenuResponse } from '@/lib/schemas/menu'

interface MenuListProps {
  rows: MenuResponse[]
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  bpId: number | null
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onCheckedChange: (hasChecked: boolean) => void
  onOperationStatusChange: (menuIds: number[], operationStatus: string) => Promise<void>
}

const PLACEHOLDER_IMG = '/assets/images/contents/thumb_img.png'

function formatPrice(value: number | null) {
  if (value == null) return '-'
  return `${value.toLocaleString('ko-KR')}원`
}

interface CodeMaps {
  marketingCodeMap: Map<string, string>
  temperatureCodeMap: Map<string, string>
  menuTypeCodeMap: Map<string, string>
  setStatusCodeMap: Map<string, string>
  menuClassCodeMap: Map<string, string>
}

function MenuCard({ menu, checked, onCheck, onCardClick, codeMaps }: { menu: MenuResponse; checked: boolean; onCheck: (id: number, checked: boolean) => void; onCardClick: (id: number) => void; codeMaps: CodeMaps }) {
  const imgSrc = menu.menuImgFile?.publicUrl ?? PLACEHOLDER_IMG
  const hasDiscount = menu.discountPrice != null && menu.discountPrice > 0
  const categories = menu.categories?.map((c) => c.name).join(' | ') || '-'
  return (
    <div className="thumb-item cursor-pointer" onClick={() => onCardClick(menu.id)}>
      <div className="thumb-item-img">
        {/* 마케팅 배지 */}
        {menu.marketingTags && menu.marketingTags.length > 0 && (
          <div className="thumb-badge-wrap">
            {menu.marketingTags.map((tag) => {
              const name = codeMaps.marketingCodeMap.get(tag) ?? tag
              return (
                <span key={tag} className={`thumb-badge ${name.toLowerCase()}`}>
                  {name}
                </span>
              )
            })}
          </div>
        )}

        <Image
          src={imgSrc}
          alt={menu.menuName}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          style={{ objectFit: 'cover' }}
        />

        {/* 온도 배지 */}
        {menu.temperatureTags && menu.temperatureTags.length > 0 && (
          <div className="temp-badge-wrap">
            {menu.temperatureTags.map((tag) => {
              const name = codeMaps.temperatureCodeMap.get(tag) ?? tag
              return (
                <span key={tag} className={`temp-badge ${name.toLowerCase()}`} />
              )
            })}
          </div>
        )}
      </div>

      <div className="thumb-item-info">
        <div className="thumb-item-info-tit">
          <div className="info-tit-left">
            {menu.operationStatus === 'STOPR_001' ? (
              <div className="store-badge blue">운영</div>
            ) : (
              <div className="store-badge org">미운영</div>
            )}
            <div className="info-tit">{menu.menuName}</div>
          </div>
          <div className="info-tit-right" onClick={(e) => e.stopPropagation()}>
            <div className="check-form-box no-txt">
              <input
                type="checkbox"
                id={`menu-check-${menu.id}`}
                className="check-input"
                checked={checked}
                onChange={(e) => onCheck(menu.id, e.target.checked)}
              />
              <label htmlFor={`menu-check-${menu.id}`}></label>
            </div>
          </div>
        </div>

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
                      <span className="thum-data-text">{menu.companyName ?? '-'}</span>
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
                        {[
                          codeMaps.menuTypeCodeMap.get(menu.menuType),
                          codeMaps.setStatusCodeMap.get(menu.setStatus),
                          menu.menuClassificationCode ? codeMaps.menuClassCodeMap.get(menu.menuClassificationCode) : null,
                        ].filter(Boolean).join(' | ') || '-'}
                      </span>
                    </li>
                  </ul>
                </td>
              </tr>
              <tr>
                <th>카테고리</th>
                <td>
                  <ul className="thum-data-list">
                    <li className="thum-data-item">
                      <span className="thum-data-text">{categories}</span>
                    </li>
                  </ul>
                </td>
              </tr>
              <tr>
                <th>등록일</th>
                <td>
                  <ul className="thum-data-list">
                    <li className="thum-data-item">
                      <span className="thum-data-text">{formatDateYmd(menu.createdAt)}</span>
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
                        {hasDiscount ? (
                          <>
                            <i className="price">{formatPrice(menu.salePrice)} </i>
                            <i className="discount">{formatPrice(menu.discountPrice)}</i>
                          </>
                        ) : (
                          formatPrice(menu.salePrice)
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
  )
}

export default function MenuList({
  rows,
  page,
  pageSize,
  totalPages,
  loading,
  bpId,
  onPageChange,
  onPageSizeChange,
  onCheckedChange,
  onOperationStatusChange,
}: MenuListProps) {
  const router = useRouter()
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [isAddStorePopOpen, setIsAddStorePopOpen] = useState(false)
  const { data: marketingCodes = [] } = useCommonCodeHierarchy('MKCF')
  const { data: temperatureCodes = [] } = useCommonCodeHierarchy('TMPCF')
  const { data: menuTypeCodes = [] } = useCommonCodeHierarchy('MNTYP')
  const { data: setStatusCodes = [] } = useCommonCodeHierarchy('STST')
  const { data: menuClassCodes = [] } = useCommonCodeHierarchy('MNCF')
  const marketingCodeMap = useMemo(() => new Map(marketingCodes.map((c) => [c.code, c.name])), [marketingCodes])
  const temperatureCodeMap = useMemo(() => new Map(temperatureCodes.map((c) => [c.code, c.name])), [temperatureCodes])
  const menuTypeCodeMap = useMemo(() => new Map(menuTypeCodes.map((c) => [c.code, c.name])), [menuTypeCodes])
  const setStatusCodeMap = useMemo(() => new Map(setStatusCodes.map((c) => [c.code, c.name])), [setStatusCodes])
  const menuClassCodeMap = useMemo(() => new Map(menuClassCodes.map((c) => [c.code, c.name])), [menuClassCodes])

  // 페이지 변경 시 체크 초기화 (렌더 중 상태 리셋 패턴)
  const resetKey = `${page}-${pageSize}`
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey)
    setCheckedIds(new Set())
  }

  const hasChecked = checkedIds.size > 0

  const handleOperationStatus = async (operationStatus: string) => {
    const menuIds = Array.from(checkedIds)
    await onOperationStatusChange(menuIds, operationStatus)
    setCheckedIds(new Set())
    onCheckedChange(false)
  }

  const handleCardClick = (menuId: number) => {
    router.push(`/master/menu/${menuId}`)
  }

  const handleCheck = (id: number, checked: boolean) => {
    const next = new Set(checkedIds)
    if (checked) {
      next.add(id)
    } else {
      next.delete(id)
    }
    setCheckedIds(next)
    onCheckedChange(next.size > 0)
  }

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left">
          <button type="button" className="btn-form basic" disabled={!hasChecked} onClick={() => handleOperationStatus('STOPR_001')}>운영</button>
          <button type="button" className="btn-form basic" disabled={!hasChecked} onClick={() => handleOperationStatus('STOPR_002')}>미운영</button>
          <button type="button" className="btn-form basic" disabled={!hasChecked || !bpId} onClick={() => setIsAddStorePopOpen(true)}>점포메뉴 추가</button>
        </div>
        <div className="data-header-right">
          <button type="button" className="btn-form basic" onClick={() => router.push('/master/menu/create')}>등록</button>
          <div className="data-count-select">
            <select
              className="select-form"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              <option value={20}>20</option>
              <option value={40}>40</option>
              <option value={60}>60</option>
            </select>
          </div>
        </div>
      </div>

      <div className="data-list-bx">
        {loading ? (
          <div className="cube-loader-overlay">
            <CubeLoader />
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-wrap">
            <div className="empty-data">등록된 메뉴가 없습니다.</div>
          </div>
        ) : (
          <>
            <div className="thumb-list-wrap">
              {rows.map((menu) => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  checked={checkedIds.has(menu.id)}
                  onCheck={handleCheck}
                  onCardClick={handleCardClick}
                  codeMaps={{ marketingCodeMap, temperatureCodeMap, menuTypeCodeMap, setStatusCodeMap, menuClassCodeMap }}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
          </>
        )}
      </div>
      {bpId && (
        <AddStoreMenuPop
          isOpen={isAddStorePopOpen}
          onClose={() => setIsAddStorePopOpen(false)}
          onSyncSuccess={() => { setCheckedIds(new Set()); onCheckedChange(false) }}
          bpId={bpId}
          checkedMenuIds={Array.from(checkedIds)}
        />
      )}
    </div>
  )
}
