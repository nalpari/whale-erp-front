'use client'

import { useMemo } from 'react'
import Location from '@/components/ui/Location'
import MessageTemplateSearch from '@/components/message-templates/MessageTemplateSearch'
import MessageTemplateList from '@/components/message-templates/MessageTemplateList'
import { useMessageTemplateList } from '@/hooks/queries/use-message-template-queries'
import { useMessageTemplateSearchStore } from '@/stores/message-template-search-store'
import type { MessageTemplateSearchParams } from '@/types/notification'

const BREADCRUMBS = ['시스템 관리', '발송 템플릿 관리']

export default function MessageTemplates() {
  const appliedFilters = useMessageTemplateSearchStore((s) => s.appliedFilters)
  const page = useMessageTemplateSearchStore((s) => s.page)
  const pageSize = useMessageTemplateSearchStore((s) => s.pageSize)
  const hasSearched = useMessageTemplateSearchStore((s) => s.hasSearched)
  const setPage = useMessageTemplateSearchStore((s) => s.setPage)
  const setPageSize = useMessageTemplateSearchStore((s) => s.setPageSize)

  const listParams: MessageTemplateSearchParams = useMemo(
    () => ({
      sendType: appliedFilters.sendType,
      categoryCode: appliedFilters.categoryCode || undefined,
      templateCode: appliedFilters.templateCode || undefined,
      title: appliedFilters.title || undefined,
      page,
      size: pageSize,
    }),
    [appliedFilters, page, pageSize],
  )

  const isAlimTalk = appliedFilters.sendType === 'ALIM_TALK'
  const enabled = hasSearched && isAlimTalk
  const { data: response, isPending, error } = useMessageTemplateList(listParams, enabled)

  const loading = isPending && enabled
  const resultCount = enabled ? response?.totalElements ?? 0 : 0
  const rows = enabled ? response?.content ?? [] : []

  return (
    <div className="data-wrap">
      <Location title="발송 템플릿 관리" list={BREADCRUMBS} />
      <MessageTemplateSearch resultCount={resultCount} />
      {!isAlimTalk && (
        <p className="warning-txt" style={{ margin: '8px 0' }}>
          ※ 이메일/문자 템플릿은 후속 작업에서 지원됩니다.
        </p>
      )}
      <MessageTemplateList
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
