'use client'

import { useMemo } from 'react'
import AnimateHeight from 'react-animate-height'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { Input } from '@/components/common/ui'
import { useCommonCodeHierarchy } from '@/hooks/queries'
import { useMessageTemplateSearchStore } from '@/stores/message-template-search-store'
import type { SendType } from '@/types/notification'

interface MessageTemplateSearchProps {
  resultCount: number
}

/**
 * 공통코드(SNDTYP) → 프론트 enum 매핑.
 * - SNDTYP_001 → ALIM_TALK
 * - SNDTYP_002 → EMAIL
 * - SNDTYP_003 → SMS
 *
 * 백엔드 API가 받는 sendType은 enum string이므로 공통코드 값에서 변환 필요.
 */
const SNDTYP_TO_ENUM: Record<string, SendType> = {
  SNDTYP_001: 'ALIM_TALK',
  SNDTYP_002: 'EMAIL',
  SNDTYP_003: 'SMS',
}
const ENUM_TO_SNDTYP: Record<SendType, string> = {
  ALIM_TALK: 'SNDTYP_001',
  EMAIL: 'SNDTYP_002',
  SMS: 'SNDTYP_003',
}

export default function MessageTemplateSearch({ resultCount }: MessageTemplateSearchProps) {
  const filters = useMessageTemplateSearchStore((s) => s.filters)
  const appliedFilters = useMessageTemplateSearchStore((s) => s.appliedFilters)
  const searchOpen = useMessageTemplateSearchStore((s) => s.searchOpen)
  const setFilters = useMessageTemplateSearchStore((s) => s.setFilters)
  const applyFilters = useMessageTemplateSearchStore((s) => s.applyFilters)
  const setSearchOpen = useMessageTemplateSearchStore((s) => s.setSearchOpen)
  const removeFilter = useMessageTemplateSearchStore((s) => s.removeFilter)
  const reset = useMessageTemplateSearchStore((s) => s.reset)

  const { data: categoryCodes = [], isPending: categoryLoading, error: categoryError } =
    useCommonCodeHierarchy('SNDCTG')

  const { data: sendTypeCodes = [], isPending: sendTypeLoading, error: sendTypeError } =
    useCommonCodeHierarchy('SNDTYP')

  const categoryOptions = useMemo<SelectOption[]>(
    () => categoryCodes.map((c) => ({ label: c.name, value: c.code })),
    [categoryCodes],
  )

  const sendTypeOptions = useMemo<SelectOption[]>(
    () => sendTypeCodes.map((c) => ({ label: c.name, value: c.code })),
    [sendTypeCodes],
  )

  const sendTypeNameMap = useMemo(() => {
    const map = new Map<string, string>()
    sendTypeCodes.forEach((c) => map.set(c.code, c.name))
    return map
  }, [sendTypeCodes])

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>()
    categoryCodes.forEach((c) => map.set(c.code, c.name))
    return map
  }, [categoryCodes])

  const appliedTags: { key: string; value: string; category: string }[] = []
  if (appliedFilters.sendType !== 'ALIM_TALK') {
    const name = sendTypeNameMap.get(ENUM_TO_SNDTYP[appliedFilters.sendType])
    if (name) appliedTags.push({ key: 'sendType', value: name, category: '발송 구분' })
  }
  if (appliedFilters.categoryCode) {
    const name = categoryNameMap.get(appliedFilters.categoryCode)
    if (name) appliedTags.push({ key: 'categoryCode', value: name, category: '템플릿 분류' })
  }
  if (appliedFilters.templateCode) {
    appliedTags.push({
      key: 'templateCode',
      value: appliedFilters.templateCode,
      category: '템플릿 코드',
    })
  }
  if (appliedFilters.title) {
    appliedTags.push({ key: 'title', value: appliedFilters.title, category: '제목' })
  }

  const handleSearch = () => {
    applyFilters()
    setSearchOpen(false)
  }

  const handleReset = () => {
    reset()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="search-result-wrap">
        <ul className="search-result-list">
          {appliedTags.map((tag) => (
            <li key={tag.key} className="search-result-item">
              <div className="search-result-item-txt">
                <span>{tag.value}</span> ({tag.category})
              </div>
              <button
                type="button"
                className="search-result-item-btn"
                onClick={() => removeFilter(tag.key as never)}
                aria-label={`${tag.category} 필터 제거`}
              ></button>
            </li>
          ))}
          <li className="search-result-item">
            <div className="search-result-item-txt">
              <span>{resultCount.toLocaleString()}건</span>
            </div>
          </li>
        </ul>
        <button
          type="button"
          className="search-filed-btn"
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label="검색 영역 열기/닫기"
        ></button>
      </div>
      <AnimateHeight duration={300} height={searchOpen ? 'auto' : 0}>
        <div className="search-filed">
          <table className="default-table">
            <colgroup>
              <col width="120px" />
              <col />
              <col width="120px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>발송 구분</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={sendTypeOptions}
                      value={
                        sendTypeOptions.find(
                          (opt) => opt.value === ENUM_TO_SNDTYP[filters.sendType],
                        ) ?? null
                      }
                      onChange={(opt) => {
                        const nextEnum: SendType = opt?.value
                          ? SNDTYP_TO_ENUM[opt.value] ?? 'ALIM_TALK'
                          : 'ALIM_TALK'
                        setFilters({ sendType: nextEnum })
                      }}
                      placeholder="알림톡"
                      isLoading={sendTypeLoading}
                      error={!!sendTypeError}
                    />
                    {sendTypeError && (
                      <span className="warning-txt">※ 발송 구분 목록을 불러올 수 없습니다.</span>
                    )}
                  </div>
                </td>
                <th>템플릿 분류</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={categoryOptions}
                      value={categoryOptions.find((opt) => opt.value === filters.categoryCode) ?? null}
                      onChange={(opt) => setFilters({ categoryCode: opt?.value ?? '' })}
                      placeholder="전체"
                      isClearable
                      isLoading={categoryLoading}
                      error={!!categoryError}
                    />
                    {categoryError && (
                      <span className="warning-txt">※ 분류 목록을 불러올 수 없습니다.</span>
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <th>템플릿 코드</th>
                <td>
                  <div className="data-filed">
                    <Input
                      value={filters.templateCode}
                      onChange={(e) => setFilters({ templateCode: e.target.value })}
                      onKeyDown={handleKeyDown}
                      showClear
                      onClear={() => setFilters({ templateCode: '' })}
                    />
                  </div>
                </td>
                <th>제목</th>
                <td>
                  <div className="data-filed">
                    <Input
                      value={filters.title}
                      onChange={(e) => setFilters({ title: e.target.value })}
                      onKeyDown={handleKeyDown}
                      showClear
                      onClear={() => setFilters({ title: '' })}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="btn-filed">
            <button className="btn-form gray" onClick={() => setSearchOpen(false)} type="button">
              닫기
            </button>
            <button className="btn-form gray" onClick={handleReset} type="button">
              초기화
            </button>
            <button className="btn-form basic" onClick={handleSearch} type="button">
              검색
            </button>
          </div>
        </div>
      </AnimateHeight>
    </div>
  )
}
