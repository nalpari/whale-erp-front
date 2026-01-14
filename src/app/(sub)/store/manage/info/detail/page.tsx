'use client'
import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import { useStoreActions, useStoreDetail } from '@/hooks/use-store'
import { OperatingHourInfo } from '@/types/store'

const toStatusLabel = (status: string) => {
  if (status === 'STOPR_001') return '운영'
  if (status === 'STOPR_002') return '미운영'
  return status
}

const dayTypeLabel = (dayType: OperatingHourInfo['dayType']) => {
  if (dayType === 'WEEKDAY') return '평일'
  if (dayType === 'SATURDAY') return '토요일'
  return '일요일'
}

const formatTimeRange = (start?: string | null, end?: string | null) => {
  if (!start || !end) return '-'
  return `${start} ~ ${end}`
}

const hasBreakTime = (info?: OperatingHourInfo) => {
  if (!info) return false
  if (info.breakTimeEnabled !== undefined) return info.breakTimeEnabled
  return Boolean(info.breakStartTime && info.breakEndTime)
}

export default function StoreInfoDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeIdParam = searchParams.get('id')
  const storeId = storeIdParam ? Number(storeIdParam) : null
  const { data: detail, loading, error } = useStoreDetail(storeId)
  const { remove, saving, error: actionError } = useStoreActions()

  const operatingHours = useMemo(() => {
    const map = new Map<OperatingHourInfo['dayType'], OperatingHourInfo>()
    detail?.operating?.forEach((item) => map.set(item.dayType, item))
    return map
  }, [detail])

  const handleDelete = async () => {
    if (!storeId) return
    if (!window.confirm('점포 정보를 삭제하시겠습니까?')) return

    try {
      await remove(storeId)
      router.push('/store/manage/info')
    } catch {
      return
    }
  }

  const breadcrumbs = useMemo(() => ['Home', '가맹점 및 점포 관리', '점포 정보 관리', '점포 상세'], [])

  return (
    <div className="data-wrap">
      <Location title="점포 상세" list={breadcrumbs} />
      {loading && <div className="data-loading">상세 정보를 불러오는 중...</div>}
      {(error || actionError) && <div className="form-helper error">{error ?? actionError}</div>}
      {!loading && detail && (
        <div className="detail-wrap">
          <div className="detail-header">
            <div className="detail-title">점포 정보 상세조회</div>
            <div className="detail-actions">
              <button className="btn-form gray" type="button" onClick={() => router.push('/store/manage/info')}>
                목록
              </button>
              <button className="btn-form basic" type="button" onClick={handleDelete} disabled={saving}>
                삭제
              </button>
            </div>
          </div>

          <table className="default-table">
            <colgroup>
              <col width="160px" />
              <col />
              <col width="160px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>본사/가맹점</th>
                <td>{detail.storeInfo.officeName ?? '-'} / {detail.storeInfo.franchiseName ?? '-'}</td>
                <th>운영여부</th>
                <td>{toStatusLabel(detail.storeInfo.operationStatus)}</td>
              </tr>
              <tr>
                <th>점포명</th>
                <td>{detail.storeInfo.storeName}</td>
                <th>사업자등록번호</th>
                <td>{detail.storeInfo.businessNumber ?? '-'}</td>
              </tr>
              <tr>
                <th>대표자명</th>
                <td>{detail.storeInfo.ceoName ?? '-'}</td>
                <th>대표자 휴대폰</th>
                <td>{detail.storeInfo.ceoPhone ?? '-'}</td>
              </tr>
              <tr>
                <th>점포 전화번호</th>
                <td>{detail.storeInfo.storePhone ?? '-'}</td>
                <th>점포 주소</th>
                <td>
                  {detail.storeInfo.storeAddress ?? '-'} {detail.storeInfo.storeAddressDetail ?? ''}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="detail-section">
            <div className="detail-section-title">운영시간</div>
            <table className="default-table">
              <colgroup>
                <col width="160px" />
                <col />
                <col width="160px" />
                <col />
              </colgroup>
              <tbody>
                {(['WEEKDAY', 'SATURDAY', 'SUNDAY'] as OperatingHourInfo['dayType'][]).map((dayType) => {
                  const info = operatingHours.get(dayType)
                  return (
                    <tr key={dayType}>
                      <th>{dayTypeLabel(dayType)}</th>
                      <td>{info?.isOperating ? '운영' : '미운영'}</td>
                      <th>운영 시간</th>
                      <td>{formatTimeRange(info?.openTime, info?.closeTime)}</td>
                    </tr>
                  )
                })}
                {(['WEEKDAY', 'SATURDAY', 'SUNDAY'] as OperatingHourInfo['dayType'][]).map((dayType) => {
                  const info = operatingHours.get(dayType)
                  return (
                    <tr key={`${dayType}-break`}>
                      <th>{dayTypeLabel(dayType)} Break Time</th>
                      <td>{hasBreakTime(info) ? '운영' : '미운영'}</td>
                      <th>Break 시간</th>
                      <td>{formatTimeRange(info?.breakStartTime, info?.breakEndTime)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!loading && !detail && <div className="data-empty">조회할 점포를 선택하세요.</div>}
    </div>
  )
}
