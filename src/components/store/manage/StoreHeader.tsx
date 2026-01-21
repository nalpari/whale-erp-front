'use client'
import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import { useStoreActions, useStoreDetail } from '@/hooks/store/useStore'
import { OperatingHourInfo } from '@/types/store'
import AnimateHeight from 'react-animate-height'

// 운영상태 코드 -> 한글 라벨 변환
const toStatusLabel = (status?: string | null) => {
  if (status === 'STOPR_001') return '운영'
  if (status === 'STOPR_002') return '미운영'
  return status ?? '-'
}

// 빈 값 표시 보정
const formatValue = (value?: string | null) => value ?? '-'

// 시간 구간 문자열 포맷
const formatTimeRange = (start?: string | null, end?: string | null) => {
  if (!start || !end) return '-'
  return `${start} ~ ${end}`
}

// 요일 라벨
const dayTypeLabel = (dayType: OperatingHourInfo['dayType']) => {
  if (dayType === 'WEEKDAY') return '평일'
  if (dayType === 'SATURDAY') return '토요일'
  return '일요일'
}

// 평일 요일 집합(주간 처리에 사용)
const weekdaySet = new Set(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'])

// API dayType을 화면 표시에 맞게 정규화
const normalizeDayType = (dayType: string): OperatingHourInfo['dayType'] | null => {
  if (dayType === 'WEEKDAY' || dayType === 'SATURDAY' || dayType === 'SUNDAY') return dayType
  if (weekdaySet.has(dayType)) return 'WEEKDAY'
  return null
}

// 점포 헤더(간단 요약) 화면
export default function StoreHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeIdParam = searchParams.get('id')
  const storeId = storeIdParam ? Number(storeIdParam) : null
  const { data: detail, loading, error } = useStoreDetail(storeId)
  const { remove, error: actionError } = useStoreActions()
  const [slideboxOpen, setSlideboxOpen] = useState(false)

  // 요일별 운영시간을 Map으로 정리(평일은 대표 1개만 유지)
  const operatingHours = useMemo(() => {
    const map = new Map<OperatingHourInfo['dayType'], OperatingHourInfo>()
    detail?.operating?.forEach((item) => {
      const rawDayType = item.dayType as string
      const normalized = normalizeDayType(rawDayType)
      if (!normalized) return
      if (normalized === 'WEEKDAY') {
        if (rawDayType === 'WEEKDAY' || !map.has('WEEKDAY')) {
          map.set('WEEKDAY', { ...item, dayType: 'WEEKDAY' })
        }
        return
      }
      map.set(normalized, { ...item, dayType: normalized })
    })
    return map
  }, [detail])

  // 점포 삭제 처리
  const handleDelete = async () => {
    if (!storeId) return
    if (!window.confirm('점포 정보를 삭제하시겠습니까?')) return

    try {
      await remove(storeId)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('store-search-state')
      }
      router.push('/store/manage/info')
    } catch {
      return
    }
  }

  // 상단 위치 표시
  const breadcrumbs = useMemo(() => ['Home', '가맹점 및 점포 관리', '점포 정보 관리'], [])

  return (
    <div className="data-wrap">
      <Location title="점포 정보 관리" list={breadcrumbs} />
      {loading && <div className="data-loading">상세 정보를 불러오는 중...</div>}
      {(error || actionError) && <div className="form-helper error">{error ?? actionError}</div>}
      {!loading && detail && (
        <div className="master-detail-data">
          <div className={`slidebox-wrap ${slideboxOpen ? '' : 'close'}`}>
            <div className="slidebox-header">
              <h2>점포 Header 정보</h2>
              <div className="slidebox-btn-wrap">
                <button className="slidebox-btn" onClick={() => router.push(`/store/manage/info`)}>
                  목록
                </button>
                <button className="slidebox-btn" onClick={handleDelete}>
                  삭제
                </button>
                <button
                  className="slidebox-btn"
                  onClick={() => router.push(`/store/manage/info/detail?id=${detail.storeInfo.id}`)}
                >
                  수정
                </button>
                <button className="slidebox-btn arr" onClick={() => setSlideboxOpen(!slideboxOpen)}>
                  <i className="arr-icon"></i>
                </button>
              </div>
            </div>
            <AnimateHeight duration={300} height={slideboxOpen ? 'auto' : 0}>
              <div className="slidebox-body">
                <div className="detail-data-wrap">
                  <table className="detail-data-table">
                    <colgroup>
                      <col width="200px" />
                      <col />
                    </colgroup>
                    <tbody>
                      <tr>
                        <th>본사/가맹점</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">{formatValue(detail.storeInfo.officeName)}</span>
                            </li>
                            <li className="detail-data-item">
                              <span className="detail-data-text">{formatValue(detail.storeInfo.franchiseName)}</span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <th>운영여부</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">
                                {toStatusLabel(detail.storeInfo.operationStatus)}
                              </span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <th>점포 정보</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">{formatValue(detail.storeInfo.storeName)}</span>
                            </li>
                            <li className="detail-data-item">
                              <span className="detail-data-text">{formatValue(detail.storeInfo.businessNumber)}</span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <th>연락처 정보</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">{formatValue(detail.storeInfo.ceoName)}</span>
                            </li>
                            <li className="detail-data-item">
                              <span className="detail-data-text">{formatValue(detail.storeInfo.ceoPhone)}</span>
                            </li>
                            <li className="detail-data-item">
                              <span className="detail-data-text">{formatValue(detail.storeInfo.storePhone)}</span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                      {(['WEEKDAY', 'SATURDAY', 'SUNDAY'] as OperatingHourInfo['dayType'][]).map((dayType) => {
                        const info = operatingHours.get(dayType)
                        return (
                          <tr key={dayType}>
                            <th>{dayTypeLabel(dayType)}</th>
                            <td>
                              <ul className="detail-data-list">
                                <li className="detail-data-item">
                                  <span className="detail-data-text">
                                    {formatTimeRange(info?.openTime, info?.closeTime)}
                                  </span>
                                </li>
                                <li className="detail-data-item">
                                  <span className="detail-data-text">
                                    {formatTimeRange(info?.breakStartTime, info?.breakEndTime)}
                                  </span>
                                </li>
                              </ul>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </AnimateHeight>
          </div>
        </div>
      )}
      {!loading && !detail && <div className="data-empty">조회할 점포를 선택하세요.</div>}
    </div>
  )
}
