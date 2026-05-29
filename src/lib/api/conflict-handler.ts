import { AxiosError } from 'axios'

export type ConflictContext =
  | 'BP_AUTHORITY'
  | 'BP_ADMIN_AUTHORITY'
  | 'PLATFORM_ADMIN_AUTHORITY'

interface ErrorResponseBody {
  message?: string
  code?: string
}

type DiagnosticPayload = Record<string, unknown>

interface HandleConflictOptions {
  context: ConflictContext
  payload: DiagnosticPayload
  prevSnapshot?: DiagnosticPayload
  alert: (msg: string) => Promise<void> | void
  invalidate?: () => void
}

const FALLBACK_MESSAGE: Record<ConflictContext, string> = {
  BP_AUTHORITY:
    '권한 변경이 BP의 기존 권한 관계와 충돌합니다. 화면을 새로고침한 뒤 다시 시도해 주세요.',
  BP_ADMIN_AUTHORITY:
    '권한 변경이 다른 데이터와 충돌합니다. 화면을 새로고침한 뒤 다시 시도해 주세요.',
  PLATFORM_ADMIN_AUTHORITY:
    '권한 변경이 다른 데이터와 충돌합니다. 화면을 새로고침한 뒤 다시 시도해 주세요.',
}

/**
 * 409 (CONFLICT) 응답인지 검사.
 */
export function isConflictError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 409
}

/**
 * 권한 변경 시 발생하는 409 무결성 충돌을 표준 처리한다.
 *
 * 반환값:
 *  - true  → 본 함수가 사용자 알림과 invalidate를 수행함. 상위 catch는 추가 처리 불필요.
 *  - false → 409가 아니거나 처리 불가능 → 상위 catch가 일반 에러 메시지로 처리.
 *
 * dev 환경에서만 console.group 으로 payload diff + ErrorResponse 진단 출력.
 */
export async function handleAuthorityConflict(
  error: unknown,
  opts: HandleConflictOptions,
): Promise<boolean> {
  if (!isConflictError(error)) return false

  const axiosError = error as AxiosError<ErrorResponseBody>
  const body = axiosError.response?.data
  const beMessage = body?.message?.trim()
  const message = beMessage && beMessage.length > 0
    ? beMessage
    : FALLBACK_MESSAGE[opts.context]

  if (process.env.NODE_ENV === 'development') {
    console.group(`[Authority Conflict] ${opts.context}`)
    console.warn('status:', axiosError.response?.status)
    console.warn('errorBody:', body)
    console.warn('payload:', opts.payload)
    if (opts.prevSnapshot !== undefined) {
      console.warn('prevSnapshot:', opts.prevSnapshot)
      console.warn('changedKeys:', diffKeys(opts.prevSnapshot, opts.payload))
    }
    console.groupEnd()
  }

  opts.invalidate?.()
  await opts.alert(message)
  return true
}

function diffKeys(prev: DiagnosticPayload, next: DiagnosticPayload): string[] {
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)])
  const changed: string[] = []
  for (const key of keys) {
    if (!shallowEqual(prev[key], next[key])) {
      changed.push(key)
    }
  }
  return changed
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (
    a != null &&
    b != null &&
    typeof a === 'object' &&
    typeof b === 'object'
  ) {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  return false
}
