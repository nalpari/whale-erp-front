'use client'

import { useMemo } from 'react'
import AnimateHeight from 'react-animate-height'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { Input } from '@/components/common/ui'
import { useCommonCodeHierarchy } from '@/hooks/queries'
import { useAlimTalkTemplateSearchStore } from '@/stores/alim-talk-template-search-store'
import type { SendType } from '@/types/notification'

interface AlimTalkTemplateSearchProps {
  resultCount: number
}

const SEND_TYPE_OPTIONS: SelectOption[] = [
  { label: '알림톡', value: 'ALIM_TALK' },
  { label: '이메일', value: 'EMAIL' },
  { label: '문자', value: 'SMS' },
]

const SEND_TYPE_LABEL: Record<SendType, string> = {
  ALIM_TALK: '알림톡',
  EMAIL: '이메일',
  SMS: '문자',
}

export default function AlimTalkTemplateSearch({ resultCount }: AlimTalkTemplateSearchProps) {
  const filters = useAlimTalkTemplateSearchStore((s) => s.filters)
  const appliedFilters = useAlimTalkTemplateSearchStore((s) => s.appliedFilters)
  const searchOpen = useAlimTalkTemplateSearchStore((s) => s.searchOpen)
  const setFilters = useAlimTalkTemplateSearchStore((s) => s.setFilters)
  const applyFilters = useAlimTalkTemplateSearchStore((s) => s.applyFilters)
  const setSearchOpen = useAlimTalkTemplateSearchStore((s) => s.setSearchOpen)
  const removeFilter = useAlimTalkTemplateSearchStore((s) => s.removeFilter)
  const reset = useAlimTalkTemplateSearchStore((s) => s.reset)

  const { data: categoryCodes = [], isPending: categoryLoading, error: categoryError } =
    useCommonCodeHierarchy('SNDCTG')

  const categoryOptions = useMemo<SelectOption[]>(
    () => categoryCodes.map((c) => ({ label: c.name, value: c.code })),
    [categoryCodes],
  )

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>()
    categoryCodes.forEach((c) => map.set(c.code, c.name))
    return map
  }, [categoryCodes])

  const appliedTags: { key: string; value: string; category: string }[] = []
  if (appliedFilters.sendType !== 'ALIM_TALK') {
    appliedTags.push({
      key: 'sendType',
      value: SEND_TYPE_LABEL[appliedFilters.sendType],
      category: '발송 구분',
    })
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
                      options={SEND_TYPE_OPTIONS}
                      value={SEND_TYPE_OPTIONS.find((opt) => opt.value === filters.sendType) ?? null}
                      onChange={(opt) =>
                        setFilters({ sendType: (opt?.value as SendType) ?? 'ALIM_TALK' })
                      }
                      placeholder="알림톡"
                    />
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
                      placeholder="템플릿 코드 입력"
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
                      placeholder="제목 입력"
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
