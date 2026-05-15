'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { Input } from '@/components/common/ui'
import Location from '@/components/ui/Location'
import { useCommonCodeHierarchy } from '@/hooks/queries'
import {
  useCreateMessageTemplate,
  useDeleteMessageTemplate,
  useUpdateMessageTemplate,
} from '@/hooks/queries/use-message-template-queries'
import type {
  MessageTemplateCreateRequest,
  MessageTemplateDetail,
  MessageTemplateUpdateRequest,
  SendType,
} from '@/types/notification'

interface MessageTemplateFormProps {
  mode: 'create' | 'edit'
  sendType: SendType
  initial?: MessageTemplateDetail
}

const BREADCRUMBS = ['시스템 관리', '발송 템플릿 관리']

const SEND_TYPE_LABEL: Record<SendType, string> = {
  ALIM_TALK: '알림톡',
  EMAIL: '이메일',
  SMS: '문자',
}

interface FormState {
  categoryCodeId: number | null
  templateCode: string
  title: string
  sendTimingCodeId: number | null
  body: string
}

const EMPTY_FORM: FormState = {
  categoryCodeId: null,
  templateCode: '',
  title: '',
  sendTimingCodeId: null,
  body: '',
}

export default function MessageTemplateForm({ mode, sendType, initial }: MessageTemplateFormProps) {
  const router = useRouter()

  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          categoryCodeId: initial.categoryCodeId,
          templateCode: initial.templateCode,
          title: initial.title ?? '',
          sendTimingCodeId: initial.sendTimingCodeId,
          body: initial.body,
        }
      : EMPTY_FORM,
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data: categoryCodes = [] } = useCommonCodeHierarchy('SNDCTG')

  const categoryOptions = useMemo<SelectOption[]>(
    () => categoryCodes.map((c) => ({ label: c.name, value: String(c.id) })),
    [categoryCodes],
  )

  const createMutation = useCreateMessageTemplate()
  const updateMutation = useUpdateMessageTemplate(initial?.id ?? 0)
  const deleteMutation = useDeleteMessageTemplate()

  const canSubmit =
    form.categoryCodeId !== null &&
    form.templateCode.trim() !== '' &&
    form.title.trim() !== '' &&
    form.body.trim() !== ''

  const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }))

  const goList = () => router.push('/notification/message-templates')

  const handleSubmit = async () => {
    if (!canSubmit || form.categoryCodeId === null) return
    setErrorMsg(null)
    try {
      if (mode === 'create') {
        const request: MessageTemplateCreateRequest = {
          sendType,
          categoryCodeId: form.categoryCodeId,
          templateCode: form.templateCode.trim(),
          title: form.title.trim(),
          sendTimingCodeId: form.sendTimingCodeId ?? null,
          body: form.body,
        }
        await createMutation.mutateAsync(request)
      } else if (initial) {
        const request: MessageTemplateUpdateRequest = {
          sendType,
          categoryCodeId: form.categoryCodeId,
          templateCode: form.templateCode.trim(),
          title: form.title.trim(),
          sendTimingCodeId: form.sendTimingCodeId ?? null,
          body: form.body,
        }
        await updateMutation.mutateAsync(request)
      }
      goList()
    } catch (e) {
      const message =
        (e as { response?: { data?: { message?: string } } }).response?.data?.message ??
        '저장 중 오류가 발생했습니다.'
      setErrorMsg(message)
    }
  }

  const handleDelete = async () => {
    if (!initial) return
    if (!window.confirm('정말 삭제하시겠습니까? (사용 여부 N으로 전환)')) return
    try {
      await deleteMutation.mutateAsync(initial.id)
      goList()
    } catch (e) {
      const message =
        (e as { response?: { data?: { message?: string } } }).response?.data?.message ??
        '삭제 중 오류가 발생했습니다.'
      setErrorMsg(message)
    }
  }

  const pageTitle =
    mode === 'create'
      ? `${SEND_TYPE_LABEL[sendType]} 템플릿 등록`
      : `${SEND_TYPE_LABEL[sendType]} 템플릿 수정`

  return (
    <div className="data-wrap">
      <Location title={pageTitle} list={BREADCRUMBS} />
      <div className="contents-wrap">
        <div className="contents-btn">
          <button className="btn-form gray" type="button" onClick={goList}>
            목록
          </button>
          {mode === 'edit' && (
            <button
              className="btn-form red"
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              삭제
            </button>
          )}
          <button
            className="btn-form basic"
            type="button"
            disabled={!canSubmit || createMutation.isPending || updateMutation.isPending}
            onClick={handleSubmit}
          >
            저장
          </button>
        </div>
        <div className="contents-body">
        {errorMsg && <div className="form-helper error">{errorMsg}</div>}
        <table className="default-table">
          <colgroup>
            <col width="160px" />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>템플릿 분류 *</th>
              <td>
                <div className="data-filed">
                  <SearchSelect
                    options={categoryOptions}
                    value={
                      categoryOptions.find(
                        (opt) => opt.value === String(form.categoryCodeId ?? ''),
                      ) ?? null
                    }
                    onChange={(opt) =>
                      update({ categoryCodeId: opt?.value ? Number(opt.value) : null })
                    }
                    placeholder="선택"
                  />
                </div>
              </td>
            </tr>
            <tr>
              <th>템플릿 명 *</th>
              <td>
                <Input
                  value={form.title}
                  onChange={(e) => update({ title: e.target.value })}
                  maxLength={200}
                />
              </td>
            </tr>
            <tr>
              <th>템플릿 코드 *</th>
              <td>
                <Input
                  value={form.templateCode}
                  onChange={(e) => update({ templateCode: e.target.value })}
                  maxLength={50}
                />
              </td>
            </tr>
            <tr>
              <th>발송시점</th>
              <td>
                <Input
                  value={form.sendTimingCodeId ? String(form.sendTimingCodeId) : ''}
                  onChange={(e) =>
                    update({
                      sendTimingCodeId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </td>
            </tr>
            <tr>
              <th>내용 *</th>
              <td>
                <textarea
                  className="default-textarea"
                  value={form.body}
                  onChange={(e) => update({ body: e.target.value })}
                  rows={14}
                  style={{ width: '100%', minHeight: '12rem' }}
                />
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
