'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import { Input, useAlert } from '@/components/common/ui'
import CubeLoader from '@/components/common/ui/CubeLoader'
import RadioButtonGroup from '@/components/common/ui/RadioButtonGroup'
import CheckboxButtonGroup from '@/components/store-menu/CheckboxButtonGroup'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { useStoreMenuDetail, useDeleteStoreMenu } from '@/hooks/queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { formatDateYmd } from '@/util/date-util'
import type { StoreMenuOptionSet } from '@/types/store-menu'
import AnimateHeight from 'react-animate-height'

const BREADCRUMBS = ['Home', 'Master data 관리', '메뉴 정보 관리']

function formatPrice(price: number) {
  return price.toLocaleString('ko-KR')
}

const TAX_OPTIONS = [
  { value: 'TAXABLE', label: '과세' },
  { value: 'TAX_FREE', label: '면세' },
  { value: 'ZERO_RATED', label: '영세' },
] as const

export default function StoreMenuDetail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const menuIdParam = searchParams.get('id')
  const menuId = menuIdParam ? Number(menuIdParam) : null

  const { data: detail, isPending: loading } = useStoreMenuDetail(menuId)
  const { mutateAsync: deleteMenu } = useDeleteStoreMenu()
  const { alert, confirm } = useAlert()

  const [menuInfoOpen, setMenuInfoOpen] = useState(true)
  const [optionInfoOpen, setOptionInfoOpen] = useState(true)
  const [categoryInfoOpen, setCategoryInfoOpen] = useState(true)

  // 공통코드 조회
  const { children: statusChildren } = useCommonCode('STOPR', true)
  const { children: menuTypeChildren } = useCommonCode('MNTYP', true)
  const { children: marketingChildren } = useCommonCode('MKCF', true)
  const { children: temperatureChildren } = useCommonCode('TMPCF', true)
  const { children: menuPropertyChildren } = useCommonCode('MNPRP', true)

  // 공통코드 매핑
  const codeMap = useMemo(() => {
    const build = (items: { code: string; name: string }[]) =>
      items.reduce<Record<string, string>>((acc, item) => {
        acc[item.code] = item.name
        return acc
      }, {})
    return {
      status: build(statusChildren),
      menuType: build(menuTypeChildren),
      marketing: build(marketingChildren),
      temperature: build(temperatureChildren),
      menuProperty: build(menuPropertyChildren),
    }
  }, [statusChildren, menuTypeChildren, marketingChildren, temperatureChildren, menuPropertyChildren])

  // 공통코드 → RadioButtonGroup/CheckboxButtonGroup 옵션 변환
  const statusOptions = useMemo(
    () => statusChildren.map((c) => ({ value: c.code, label: c.name })),
    [statusChildren],
  )
  const menuTypeOptions = useMemo(
    () => menuTypeChildren.map((c) => ({ value: c.code, label: c.name })),
    [menuTypeChildren],
  )
  const marketingOptions = useMemo(
    () => marketingChildren.map((c) => ({ value: c.code, label: c.name })),
    [marketingChildren],
  )
  const temperatureOptions = useMemo(
    () => temperatureChildren.map((c) => ({ value: c.code, label: c.name })),
    [temperatureChildren],
  )

  const handleGoList = () => {
    router.push('/master/menu/store')
  }

  const handleDelete = async () => {
    if (menuId == null) return
    const confirmed = await confirm('해당 메뉴를 삭제하시겠습니까?')
    if (!confirmed) return
    try {
      await deleteMenu(menuId)
      handleGoList()
    } catch {
      await alert('메뉴 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  if (loading && !detail) {
    return (
      <div className="data-wrap">
        <Location title="메뉴 정보 관리" list={BREADCRUMBS} />
        <div className="cube-loader-overlay">
          <CubeLoader />
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="data-wrap">
        <Location title="메뉴 정보 관리" list={BREADCRUMBS} />
        <div className="empty-wrap">
          <div className="empty-data">메뉴 정보를 찾을 수 없습니다.</div>
        </div>
      </div>
    )
  }

  // 마스터 메뉴 매핑 표시 텍스트
  const masterMappingText =
    detail.masterMenuName || detail.masterMenuCode
      ? `${codeMap.menuProperty[detail.menuProperty] ?? detail.menuProperty} / ${detail.masterMenuName ?? '-'} / ${detail.masterMenuCode ?? '-'}`
      : '매핑 안됨'

  // 프로모션 가격 표시 텍스트
  const promotionText =
    detail.discountPrice != null
      ? detail.promotionStartDate || detail.promotionEndDate
        ? `${formatPrice(detail.discountPrice)}원 (${formatDateYmd(detail.promotionStartDate)} ~ ${formatDateYmd(detail.promotionEndDate)})`
        : `${formatPrice(detail.discountPrice)}원`
      : '-'

  return (
    <div className="data-wrap">
      <Location title="메뉴 정보 관리" list={BREADCRUMBS} />
      <div className="detail-wrap">
        {/* 헤더 버튼 영역 */}
        <div className="detail-header">
          <div className="detail-actions" style={{ justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
            <button className="btn-form basic" type="button" onClick={handleGoList}>
              목록
            </button>
            <button className="btn-form gray" type="button" onClick={handleDelete}>
              저장
            </button>
          </div>
        </div>

        {/* 본사/가맹점 + 점포 선택 테이블 (readOnly) */}
        <div className="detail-data-wrap" style={{ marginBottom: '24px' }}>
          <table className="detail-data-table">
            <colgroup>
              <col width="200px" />
              <col />
              <col width="200px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <HeadOfficeFranchiseStoreSelect
                  fields={['office', 'store']}
                  isDisabled={true}
                  officeId={detail.bpId}
                  franchiseId={null}
                  storeId={null}
                  onChange={() => {}}
                />
              </tr>
            </tbody>
          </table>
        </div>

        {/* 메뉴 정보 섹션 */}
        <div className={`slidebox-wrap ${menuInfoOpen ? '' : 'close'}`} style={{ marginBottom: '24px' }}>
          <div className="slidebox-header">
            <h2>메뉴 정보</h2>
            <div className="slidebox-btn-wrap">
              <button className="slidebox-btn arr" onClick={() => setMenuInfoOpen(!menuInfoOpen)}>
                <i className="arr-icon"></i>
              </button>
            </div>
          </div>
          <AnimateHeight duration={300} height={menuInfoOpen ? 'auto' : 0}>
            <div className="slidebox-body">
              <div className="detail-data-wrap">
                <table className="detail-data-table">
                  <colgroup>
                    <col width="200px" />
                    <col />
                  </colgroup>
                  <tbody>
                    {/* 1. 운영여부 */}
                    <tr>
                      <th>운영여부</th>
                      <td>
                        <RadioButtonGroup
                          options={statusOptions}
                          value={detail.operationStatus}
                          onChange={() => {}}
                          disabled={true}
                        />
                      </td>
                    </tr>
                    {/* 2. 마스터용 메뉴 mapping */}
                    <tr>
                      <th>마스터용 메뉴 mapping</th>
                      <td>
                        <Input defaultValue={masterMappingText} disabled />
                      </td>
                    </tr>
                    {/* 3. 메뉴 타입 */}
                    <tr>
                      <th>메뉴 타입 <span className="red">*</span></th>
                      <td>
                        <RadioButtonGroup
                          options={menuTypeOptions}
                          value={detail.menuType}
                          onChange={() => {}}
                          disabled={true}
                        />
                      </td>
                    </tr>
                    {/* 4. 메뉴명(대표) */}
                    <tr>
                      <th>메뉴명(대표) <span className="red">*</span></th>
                      <td>
                        <Input defaultValue={detail.menuName ?? '-'} disabled />
                      </td>
                    </tr>
                    {/* 5. 메뉴명 영어 */}
                    <tr>
                      <th>메뉴명 영어</th>
                      <td>
                        <Input defaultValue={detail.menuNameEng ?? '-'} disabled />
                      </td>
                    </tr>
                    {/* 6. 메뉴명 중국어(간체/번체) */}
                    <tr>
                      <th>메뉴명 중국어(간체/번체)</th>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Input defaultValue={detail.menuNameChs ?? '-'} disabled />
                          <Input defaultValue={detail.menuNameCht ?? '-'} disabled />
                        </div>
                      </td>
                    </tr>
                    {/* 7. 메뉴명 일어 */}
                    <tr>
                      <th>메뉴명 일어</th>
                      <td>
                        <Input defaultValue={detail.menuNameJpn ?? '-'} disabled />
                      </td>
                    </tr>
                    {/* 8. 과세 */}
                    <tr>
                      <th>과세</th>
                      <td>
                        <RadioButtonGroup
                          options={TAX_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                          value={detail.taxType}
                          onChange={() => {}}
                          disabled={true}
                        />
                      </td>
                    </tr>
                    {/* 9. 가격 */}
                    <tr>
                      <th>가격</th>
                      <td>
                        <Input
                          defaultValue={detail.salePrice != null ? `${formatPrice(detail.salePrice)}원` : '-'}
                          disabled
                        />
                      </td>
                    </tr>
                    {/* 10. 프로모션 가격 */}
                    <tr>
                      <th>프로모션 가격</th>
                      <td>
                        <Input defaultValue={promotionText} disabled />
                      </td>
                    </tr>
                    {/* 11. 마케팅 분류 */}
                    <tr>
                      <th>마케팅 분류</th>
                      <td>
                        <CheckboxButtonGroup
                          options={marketingOptions}
                          values={detail.marketingTags ?? []}
                          onChange={() => {}}
                          disabled={true}
                        />
                      </td>
                    </tr>
                    {/* 12. 온도 분류 */}
                    <tr>
                      <th>온도 분류</th>
                      <td>
                        <CheckboxButtonGroup
                          options={temperatureOptions}
                          values={detail.temperatureTags ?? []}
                          onChange={() => {}}
                          disabled={true}
                        />
                      </td>
                    </tr>
                    {/* 13. 노출 순서 */}
                    <tr>
                      <th>노출 순서</th>
                      <td>
                        <Input defaultValue={String(detail.displayOrder ?? '-')} disabled />
                      </td>
                    </tr>
                    {/* 14. 메뉴 Description */}
                    <tr>
                      <th>메뉴 Description <span className="red">*</span></th>
                      <td>
                        <Input defaultValue={detail.description ?? '-'} disabled />
                      </td>
                    </tr>
                    {/* 15. 메뉴 이미지 */}
                    <tr>
                      <th>메뉴 이미지</th>
                      <td>
                        {detail.menuImgFile?.publicUrl ? (
                          <div style={{ padding: '8px 0' }}>
                            <a
                              href={detail.menuImgFile.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}
                            >
                              {detail.menuImgFile.originalFileName}
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: '#999', fontSize: '13px', padding: '8px 0', display: 'inline-block' }}>이미지 없음</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </AnimateHeight>
        </div>

        {/* 옵션 구성 섹션 */}
        {detail.optionSets?.length > 0 && (
          <div className={`slidebox-wrap ${optionInfoOpen ? '' : 'close'}`} style={{ marginBottom: '24px' }}>
            <div className="slidebox-header">
              <h2>옵션 구성</h2>
              <div className="slidebox-btn-wrap">
                <button className="slidebox-btn arr" onClick={() => setOptionInfoOpen(!optionInfoOpen)}>
                  <i className="arr-icon"></i>
                </button>
              </div>
            </div>
            <AnimateHeight duration={300} height={optionInfoOpen ? 'auto' : 0}>
              <div className="slidebox-body">
                {detail.optionSets.map((optionSet: StoreMenuOptionSet) => (
                  <div key={optionSet.id} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 500, fontSize: '14px' }}>{optionSet.setName}</span>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {optionSet.isRequired ? '필수 선택' : '필수 선택 아님'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {optionSet.isMultipleChoice ? '다중 선택' : '다중 선택 아님'}
                      </span>
                    </div>
                    <table className="default-table">
                      <colgroup>
                        <col width="60px" />
                        <col width="80px" />
                        <col />
                        <col width="120px" />
                        <col width="100px" />
                        <col width="80px" />
                        <col width="80px" />
                        <col width="80px" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>운영여부</th>
                          <th>메뉴명</th>
                          <th>메뉴코드</th>
                          <th>가격</th>
                          <th>수량입력</th>
                          <th>디폴트</th>
                          <th>활성</th>
                        </tr>
                      </thead>
                      <tbody>
                        {optionSet.optionSetItems?.map((item, idx) => (
                          <tr key={item.id}>
                            <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ textAlign: 'center' }}>
                              {codeMap.status[item.operationStatus] ?? item.operationStatus}
                            </td>
                            <td>{item.optionSetItemName}</td>
                            <td>{item.optionSetItemCode}</td>
                            <td style={{ textAlign: 'right' }}>
                              {item.additionalPrice != null ? `${formatPrice(item.additionalPrice)}원` : '-'}
                            </td>
                            <td style={{ textAlign: 'center' }}>{item.isQuantity ? 'Y' : 'N'}</td>
                            <td style={{ textAlign: 'center' }}>{item.isDefault ? 'Y' : 'N'}</td>
                            <td style={{ textAlign: 'center' }}>{item.isActive ? 'Y' : 'N'}</td>
                          </tr>
                        ))}
                        {(!optionSet.optionSetItems || optionSet.optionSetItems.length === 0) && (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', color: '#999' }}>옵션 항목이 없습니다.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </AnimateHeight>
          </div>
        )}

        {/* 카테고리 설정 섹션 */}
        {detail.categories?.length > 0 && (
          <div className={`slidebox-wrap ${categoryInfoOpen ? '' : 'close'}`} style={{ marginBottom: '24px' }}>
            <div className="slidebox-header">
              <h2>카테고리 설정</h2>
              <div className="slidebox-btn-wrap">
                <button className="slidebox-btn arr" onClick={() => setCategoryInfoOpen(!categoryInfoOpen)}>
                  <i className="arr-icon"></i>
                </button>
              </div>
            </div>
            <AnimateHeight duration={300} height={categoryInfoOpen ? 'auto' : 0}>
              <div className="slidebox-body">
                <table className="default-table">
                  <colgroup>
                    <col width="60px" />
                    <col />
                    <col width="120px" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>카테고리명</th>
                      <th>운영여부</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.categories.map((cat, idx) => (
                      <tr key={cat.id}>
                        <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                        <td>{cat.name}</td>
                        <td style={{ textAlign: 'center' }}>{cat.isActive ? '운영' : '미운영'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AnimateHeight>
          </div>
        )}
      </div>

      {/* 메타데이터 테이블 */}
      <div className="detail-data-info-wrap" style={{ marginTop: '20px' }}>
        <table className="default-table">
          <colgroup>
            <col width="120px" />
            <col />
            <col width="120px" />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>등록자</th>
              <td>
                <Input defaultValue={detail.createdBy ?? '-'} disabled />
              </td>
              <th>등록일시</th>
              <td>
                <Input defaultValue={formatDateYmd(detail.createdAt)} disabled />
              </td>
            </tr>
            <tr>
              <th>최종 수정자</th>
              <td>
                <Input defaultValue={detail.updatedBy ?? '-'} disabled />
              </td>
              <th>최종 수정일시</th>
              <td>
                <Input defaultValue={formatDateYmd(detail.updatedAt)} disabled />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
