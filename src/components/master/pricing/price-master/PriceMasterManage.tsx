'use client'

import { useState, useRef, useMemo } from 'react'
import PriceMasterSearch, { type PriceMasterSearchFilters } from './PriceMasterSearch'
import PriceMasterList, { type PriceMasterListHandle } from './PriceMasterList'
import Location from '@/components/ui/Location'
import { isAxiosError } from 'axios'
import { useAlert } from '@/components/common/ui'
import { usePriceMasterList, useCreatePriceSchedule, useCancelPriceSchedule, useCommonCodeHierarchy, useBpHeadOfficeTree } from '@/hooks/queries'
import type { PriceMasterListParams, PriceScheduleSaveRequest } from '@/types/price-master'
import type { RadioOption } from '@/components/common/ui'
import type { SelectOption } from '@/components/ui/common/SearchSelect'

const BREADCRUMBS = ['Home', '가격 Master', '마스터용 가격 관리']

const DEFAULT_FILTERS: PriceMasterSearchFilters = {
  officeId: null,
  franchiseId: null,
  operationStatus: '',
  menuClassificationCode: '',
  menuName: '',
  priceAppliedAtFrom: null,
  priceAppliedAtTo: null,
  salePriceFrom: '',
  salePriceTo: '',
  discountPriceFrom: '',
  discountPriceTo: '',
}

const toIsoDateTime = (date: Date | null, endOfDay = false): string | undefined => {
  if (!date) return undefined
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T${endOfDay ? '23:59:59' : '00:00:00'}`
}

const parseIntOrUndefined = (value: string): number | undefined => {
  if (!value) return undefined
  const n = parseInt(value, 10)
  return isNaN(n) ? undefined : n
}

const PriceMasterManage = () => {
  const [filters, setFilters] = useState<PriceMasterSearchFilters>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PriceMasterSearchFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [hasCheckedRows, setHasCheckedRows] = useState(false)

  // 예약 관련 상태
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null)
  const [scheduleHour, setScheduleHour] = useState('00')
  const [scheduleMinute, setScheduleMinute] = useState('00')

  const { alert } = useAlert()

  const listRef = useRef<PriceMasterListHandle>(null)

  // BP 트리 (본사명 조회용, HeadOfficeFranchiseStoreSelect와 캐시 공유)
  const { data: bpTree = [] } = useBpHeadOfficeTree()
  const officeNameMap = useMemo(() =>
    new Map(bpTree.map((o) => [o.id, o.name])),
    [bpTree])

  // 공통코드 조회
  const { data: operationStatusCodes = [] } = useCommonCodeHierarchy('STOPR')
  const { data: menuClassCodes = [] } = useCommonCodeHierarchy('MNCF')

  // 운영여부 라디오 옵션 (전체 포함)
  const operationStatusOptions: RadioOption[] = useMemo(() => [
    { value: '', label: '전체' },
    ...operationStatusCodes.map((c) => ({ value: c.code, label: c.name })),
  ], [operationStatusCodes])

  // 메뉴분류 셀렉트 옵션
  const menuClassificationOptions: SelectOption[] = useMemo(() =>
    menuClassCodes.map((c) => ({ value: c.code, label: c.name })),
    [menuClassCodes])

  // 코드 → 이름 변환 Map
  const menuClassCodeMap = useMemo(() =>
    new Map(menuClassCodes.map((c) => [c.code, c.name])),
    [menuClassCodes])

  const operationStatusCodeMap = useMemo(() =>
    new Map(operationStatusCodes.map((c) => [c.code, c.name])),
    [operationStatusCodes])

  // API 파라미터 조립
  const canFetchList = appliedFilters.officeId != null
  const queryParams = useMemo<PriceMasterListParams>(() => ({
    bpId: appliedFilters.officeId ?? 0,
    operationStatus: appliedFilters.operationStatus || undefined,
    menuClassificationCode: appliedFilters.menuClassificationCode || undefined,
    menuName: appliedFilters.menuName || undefined,
    priceAppliedAtFrom: toIsoDateTime(appliedFilters.priceAppliedAtFrom),
    priceAppliedAtTo: toIsoDateTime(appliedFilters.priceAppliedAtTo, true),
    salePriceFrom: parseIntOrUndefined(appliedFilters.salePriceFrom),
    salePriceTo: parseIntOrUndefined(appliedFilters.salePriceTo),
    discountPriceFrom: parseIntOrUndefined(appliedFilters.discountPriceFrom),
    discountPriceTo: parseIntOrUndefined(appliedFilters.discountPriceTo),
    page,
    size: pageSize,
  }), [appliedFilters, page, pageSize])
  const { data: response, isFetching: loading } = usePriceMasterList(queryParams, canFetchList)

  const createScheduleMutation = useCreatePriceSchedule()
  const cancelScheduleMutation = useCancelPriceSchedule()

  const handleSearch = () => {
    setAppliedFilters(filters)
    setPage(0)
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
  }

  const handleRemoveFilter = (key: string) => {
    const resetMap: Record<string, Partial<PriceMasterSearchFilters>> = {
      operationStatus: { operationStatus: '' },
      menuClassificationCode: { menuClassificationCode: '' },
      menuName: { menuName: '' },
      priceAppliedAt: { priceAppliedAtFrom: null, priceAppliedAtTo: null },
      salePrice: { salePriceFrom: '', salePriceTo: '' },
      discountPrice: { discountPriceFrom: '', discountPriceTo: '' },
    }
    const patch = resetMap[key]
    if (!patch) return
    const nextFilters = { ...appliedFilters, ...patch }
    setFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setPage(0)
  }

  const listData = response?.content ?? []
  const totalCount = response?.totalElements ?? 0
  const totalPages = response?.totalPages ?? 1
  const scheduledCount = listData.filter((row) => row.scheduledAt != null).length

  return (
    <div className="data-wrap">
      <Location title="마스터용 가격 관리" list={BREADCRUMBS} />
      <PriceMasterSearch
        filters={filters}
        appliedFilters={appliedFilters}
        operationStatusOptions={operationStatusOptions}
        menuClassificationOptions={menuClassificationOptions}
        officeNameMap={officeNameMap}
        operationStatusCodeMap={operationStatusCodeMap}
        menuClassCodeMap={menuClassCodeMap}
        resultCount={totalCount}
        hasCheckedRows={hasCheckedRows}
        scheduleDate={scheduleDate}
        scheduleHour={scheduleHour}
        scheduleMinute={scheduleMinute}
        onScheduleDateChange={setScheduleDate}
        onScheduleHourChange={setScheduleHour}
        onScheduleMinuteChange={setScheduleMinute}
        onCancelSchedule={() => {
          const selected = listRef.current?.getSelectedRows() ?? []
          const menuIds = selected
            .filter((row) => row.scheduledAt != null)
            .map((row) => row.id)
          if (menuIds.length === 0) {
            alert('예약이 존재하는 항목을 선택해주세요.')
            return
          }
          cancelScheduleMutation.mutate(menuIds, {
            onSuccess: () => {
              alert('예약이 취소되었습니다.')
              listRef.current?.clearSelection()
              setHasCheckedRows(false)
            },
            onError: (error) => {
              const message = isAxiosError(error) && error.response?.data?.message
                ? error.response.data.message
                : '예약 취소에 실패했습니다.'
              alert(message)
            },
          })
        }}
        onApplySchedule={() => {
          if (!scheduleDate) {
            alert('예약 날짜를 선택해주세요.')
            return
          }
          const scheduled = new Date(scheduleDate)
          scheduled.setHours(parseInt(scheduleHour, 10), parseInt(scheduleMinute, 10), 0, 0)
          if (scheduled.getTime() <= Date.now()) {
            alert('현재 시간 이후로 예약해주세요.')
            return
          }
          const selected = listRef.current?.getSelectedRows() ?? []
          if (selected.length === 0) {
            alert('예약할 항목을 선택해주세요.')
            return
          }
          const priceChanges = listRef.current?.getPriceChanges()
          const pad = (n: number) => String(n).padStart(2, '0')
          const y = scheduleDate.getFullYear()
          const mo = pad(scheduleDate.getMonth() + 1)
          const d = pad(scheduleDate.getDate())
          const tzOffset = -new Date().getTimezoneOffset()
          const tzSign = tzOffset >= 0 ? '+' : '-'
          const tzAbs = Math.abs(tzOffset)
          const tzStr = `${tzSign}${pad(Math.floor(tzAbs / 60))}:${pad(tzAbs % 60)}`
          const scheduledAt = `${y}-${mo}-${d}T${scheduleHour}:${scheduleMinute}:00${tzStr}`

          const requests: PriceScheduleSaveRequest[] = selected.map((row) => {
            const changes = priceChanges?.get(row.id)
            return {
              id: row.id,
              bpId: row.bpId,
              scheduledSalePrice: changes?.salePrice !== undefined && changes.salePrice !== ''
                ? parseInt(changes.salePrice, 10)
                : row.salePrice,
              scheduledDiscountPrice: changes?.discountPrice !== undefined && changes.discountPrice !== ''
                ? parseInt(changes.discountPrice, 10)
                : row.discountPrice,
              scheduledAt,
            }
          })
          createScheduleMutation.mutate(requests, {
            onSuccess: () => {
              alert('반영 예약이 설정되었습니다.')
              listRef.current?.clearSelection()
              setHasCheckedRows(false)
            },
            onError: (error) => {
              const message = isAxiosError(error) && error.response?.data?.message
                ? error.response.data.message
                : '반영 예약에 실패했습니다.'
              alert(message)
            },
          })
        }}
        onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        onSearch={handleSearch}
        onReset={handleReset}
        onRemoveFilter={handleRemoveFilter}
      />
      <PriceMasterList
        rows={listData}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        menuClassCodeMap={menuClassCodeMap}
        operationStatusCodeMap={operationStatusCodeMap}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
        scheduledCount={scheduledCount}
        onSelectionChange={setHasCheckedRows}
        ref={listRef}
      />
    </div>
  )
}

export default PriceMasterManage
