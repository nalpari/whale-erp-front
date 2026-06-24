import { describe, it, expect, vi, beforeEach } from 'vitest'
import { importSales } from '@/lib/api/sales'
import { salesImportKeySchema } from '@/lib/schemas/sales'

// importSales는 두 백엔드를 호출한다:
//  - import-key 발급 → sales-rader 직접 호출(@/lib/sales-rader)
//  - 실제 수집(/import) → whale-erp-api 중계(@/lib/api)
// 둘 다 통째로 mock하고, env는 가변 mock으로 두어 발급→import 흐름과 env 누락 가드를 함께 검증한다.
const { apiPost } = vi.hoisted(() => ({ apiPost: vi.fn() }))
const { raderPost } = vi.hoisted(() => ({ raderPost: vi.fn() }))
const { envMock } = vi.hoisted(() => ({
  envMock: { NEXT_PUBLIC_SALES_RADER_URL: 'http://localhost:7000' },
}))
vi.mock('@/lib/api', () => ({ default: { post: apiPost } }))
vi.mock('@/lib/sales-rader', () => ({ default: { post: raderPost } }))
vi.mock('@/lib/schemas/env', () => ({ env: envMock }))

const importResult = { status: 'SUCCESS', totalCount: 10, savedCount: 10, message: '완료' }

beforeEach(() => {
  apiPost.mockReset()
  raderPost.mockReset()
  envMock.NEXT_PUBLIC_SALES_RADER_URL = 'http://localhost:7000'
})

describe('salesImportKeySchema', () => {
  it('정상 key 문자열은 통과한다', () => {
    expect(salesImportKeySchema.safeParse({ key: 'KEY-abc123' }).success).toBe(true)
  })

  it('빈 문자열 key는 거부한다(min(1))', () => {
    expect(salesImportKeySchema.safeParse({ key: '' }).success).toBe(false)
  })

  it('key 누락은 거부한다', () => {
    expect(salesImportKeySchema.safeParse({}).success).toBe(false)
  })

  it('문자열이 아닌 key는 거부한다', () => {
    expect(salesImportKeySchema.safeParse({ key: 123 }).success).toBe(false)
  })
})

describe('importSales', () => {
  it('sales-rader에서 직접 발급받은 key를 X-Sales-Import-Key 헤더에 실어 api로 import를 호출하고 결과를 반환한다', async () => {
    // sales-rader 응답은 envelope 없이 raw { key } (axios response.data === { key })
    raderPost.mockResolvedValue({ data: { key: 'KEY-1' } })
    apiPost.mockResolvedValue({ data: { data: importResult } })

    const result = await importSales(2026, 6, 'bizzleId', 'bizzlePw')

    expect(result).toEqual(importResult)
    // import-key는 api 중계 없이 sales-rader로 직접 (경로는 sales-rader 라우터 prefix /api)
    expect(raderPost).toHaveBeenCalledWith('/api/import-key', { year: 2026, month: 6 })
    // 실제 수집은 기존대로 api 경유
    expect(apiPost).toHaveBeenCalledWith(
      '/api/v1/sales/import',
      { year: 2026, month: 6, loginId: 'bizzleId', loginPw: 'bizzlePw' },
      { timeout: 310000, headers: { 'X-Sales-Import-Key': 'KEY-1' } },
    )
  })

  it('sales-rader 주소(env)가 없으면 발급 전에 throw하고 어떤 백엔드도 호출하지 않는다', async () => {
    envMock.NEXT_PUBLIC_SALES_RADER_URL = ''

    await expect(importSales(2026, 6, 'id', 'pw')).rejects.toThrow('NEXT_PUBLIC_SALES_RADER_URL')
    expect(raderPost).not.toHaveBeenCalled()
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('발급 응답에 key가 없으면 발급 단계에서 throw하고 import는 호출하지 않는다', async () => {
    raderPost.mockResolvedValue({ data: {} })

    await expect(importSales(2026, 6, 'id', 'pw')).rejects.toThrow('import-key 발급')
    expect(raderPost).toHaveBeenCalledTimes(1)
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('발급 응답 key가 빈 문자열이면 throw하고 import는 호출하지 않는다', async () => {
    raderPost.mockResolvedValue({ data: { key: '' } })

    await expect(importSales(2026, 6, 'id', 'pw')).rejects.toThrow('import-key 발급')
    expect(raderPost).toHaveBeenCalledTimes(1)
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('발급 단계(sales-rader) 네트워크 오류는 그대로 전파되고 import는 호출하지 않는다', async () => {
    raderPost.mockRejectedValue(new Error('Network Error'))

    await expect(importSales(2026, 6, 'id', 'pw')).rejects.toThrow('Network Error')
    expect(raderPost).toHaveBeenCalledTimes(1)
    expect(apiPost).not.toHaveBeenCalled()
  })
})
