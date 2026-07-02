import { describe, it, expect } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'

// api.ts는 import 시 env 검증을 실행하므로 sales.test.ts와 동일하게 env를 mock한다.
// (getSafeErrorLog는 순수 함수라 실제 네트워크/queryClient 동작과 무관)
import { vi } from 'vitest'
vi.mock('@/lib/schemas/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8080',
    NEXT_PUBLIC_SALES_RADER_URL: 'http://localhost:7000',
  },
}))

import { getSafeErrorLog } from '@/lib/api'

// 실제 직원 초대 실패 상황을 재현: Authorization 토큰 헤더 + PII 요청 본문이 config 에 박힌 AxiosError
function makeInviteAxiosError() {
  const headers = new AxiosHeaders({
    Authorization: 'Bearer SECRET_ACCESS_TOKEN_xyz',
    affiliationId: 'org-123',
  })
  const config = {
    method: 'post',
    url: '/api/v1/employee/info',
    headers,
    // 요청 본문 = 직원 PII
    data: JSON.stringify({
      employeeName: '홍길동',
      mobilePhone: '010-1234-5678',
      email: 'hong@example.com',
    }),
  }
  const response = {
    status: 409,
    statusText: 'Conflict',
    headers: new AxiosHeaders(),
    config,
    data: { code: 'ERR8002', message: '이미 등록된 이메일입니다.' },
  }
  return new AxiosError(
    'Request failed with status code 409',
    'ERR_BAD_REQUEST',
    config,
    {},
    response,
  )
}

describe('getSafeErrorLog', () => {
  it('AxiosError 에서 status/code/message 만 추출한다', () => {
    const result = getSafeErrorLog(makeInviteAxiosError())
    expect(result).toEqual({
      status: 409,
      code: 'ERR8002',
      message: '이미 등록된 이메일입니다.',
    })
  })

  it('직렬화해도 토큰(Authorization)과 PII 요청 본문이 노출되지 않는다', () => {
    const serialized = JSON.stringify(getSafeErrorLog(makeInviteAxiosError()))
    expect(serialized).not.toContain('SECRET_ACCESS_TOKEN')
    expect(serialized).not.toContain('Bearer')
    expect(serialized).not.toContain('affiliationId')
    expect(serialized).not.toContain('010-1234-5678')
    expect(serialized).not.toContain('hong@example.com')
    expect(serialized).not.toContain('홍길동')
  })

  it('반환 객체에 config/headers/request/response 참조가 없다', () => {
    const result = getSafeErrorLog(makeInviteAxiosError())
    expect(Object.keys(result).sort()).toEqual(['code', 'message', 'status'])
  })

  it('백엔드 message 가 없으면 axios message 로 폴백한다', () => {
    const err = new AxiosError('timeout of 10000ms exceeded', 'ECONNABORTED')
    const result = getSafeErrorLog(err)
    expect(result.message).toBe('timeout of 10000ms exceeded')
    expect(result.code).toBeUndefined()
    expect(result.status).toBeUndefined()
  })

  it('일반 Error 는 message 만 추출한다', () => {
    const result = getSafeErrorLog(new Error('something broke'))
    expect(result).toEqual({ message: 'something broke' })
  })

  it('Error 가 아닌 임의 값은 String() 으로 안전 처리한다', () => {
    expect(getSafeErrorLog('plain string error')).toEqual({ message: 'plain string error' })
    // 객체를 던져도 속성 열거 없이 "[object Object]" 로만 직렬화된다
    expect(getSafeErrorLog({ secret: 'token' })).toEqual({ message: '[object Object]' })
    expect(getSafeErrorLog(null)).toEqual({ message: 'null' })
  })
})
