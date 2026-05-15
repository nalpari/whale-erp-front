'use client'

import { useMemo } from 'react'
import Location from '@/components/ui/Location'
import AlimTalkTemplateSearch from '@/components/alim-talk-templates/AlimTalkTemplateSearch'
import AlimTalkTemplateList from '@/components/alim-talk-templates/AlimTalkTemplateList'
import { useAlimTalkTemplateList } from '@/hooks/queries/use-alim-talk-template-queries'
import { useAlimTalkTemplateSearchStore } from '@/stores/alim-talk-template-search-store'
import type { AlimTalkTemplateSearchParams } from '@/types/notification'

const BREADCRUMBS = ['시스템 관리', '발송 템플릿 관리']

export default function AlimTalkTemplates() {
  const appliedFilters = useAlimTalkTemplateSearchStore((s) => s.appliedFilters)
  const page = useAlimTalkTemplateSearchStore((s) => s.page)
  const pageSize = useAlimTalkTemplateSearchStore((s) => s.pageSize)
  const hasSearched = useAlimTalkTemplateSearchStore((s) => s.hasSearched)
  const setPage = useAlimTalkTemplateSearchStore((s) => s.setPage)
  const setPageSize = useAlimTalkTemplateSearchStore((s) => s.setPageSize)

  const listParams: AlimTalkTemplateSearchParams = useMemo(
    () => ({
      sendType: appliedFilters.sendType,
      categoryCode: appliedFilters.categoryCode || undefined,
      templateCode: appliedFilters.templateCode || undefined,
      title: appliedFilters.title || undefined,
      useYn: 'Y',
      page,
      size: pageSize,
    }),
    [appliedFilters, page, pageSize],
  )

  const isAlimTalk = appliedFilters.sendType === 'ALIM_TALK'
  const enabled = hasSearched && isAlimTalk
  const { data: response, isPending, error } = useAlimTalkTemplateList(listParams, enabled)

  const loading = isPending && enabled
  const resultCount = enabled ? response?.totalElements ?? 0 : 0
  const rows = enabled ? response?.content ?? [] : []

  return (
    <div className="data-wrap">
      <Location title="발송 템플릿 관리" list={BREADCRUMBS} />
      <AlimTalkTemplateSearch resultCount={resultCount} />
      {!isAlimTalk && (
        <p className="warning-txt" style={{ margin: '8px 0' }}>
          ※ 이메일/문자 템플릿은 후속 작업에서 지원됩니다.
        </p>
      )}
      <AlimTalkTemplateList
        rows={rows}
        loading={loading}
        error={error?.message}
        page={page}
        pageSize={pageSize}
        totalPages={response?.totalPages ?? 0}
        sendType={appliedFilters.sendType}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
