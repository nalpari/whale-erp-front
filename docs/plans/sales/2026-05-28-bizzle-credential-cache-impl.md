# Bizzle 자격증명 브라우저 캐시 구현 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bizzle 자격증명을 사용자 브라우저 localStorage 에 Web Crypto 로 암호화 저장(7일 sliding 만료, 체크박스 default OFF)하여 재입력 부담을 줄이되, 서버 DB 에는 절대 남기지 않고 자동 수집(배치)은 하지 않는다.

**Architecture:** 순수 암호화/저장 로직을 `credential-cipher.ts` 모듈로 분리(TDD)하고, React 소비 계층은 TanStack Query 기반 `useBizzleCredential` hook 으로 감싼다. BizzleImportModal(기존 sales plan 담당)은 이 hook 인터페이스만 소비한다. 디바이스 고정 키는 IndexedDB 의 non-extractable CryptoKey 로 보관해 다른 브라우저/디바이스로 값만 복사해도 복호화가 불가능하게 한다.

**Tech Stack:** Next.js 16 / React 19 (React Compiler) / TypeScript strict / TanStack Query / Web Crypto API (AES-GCM) / IndexedDB / vitest + fake-indexeddb (신규 테스트 인프라)

**Spec:** `whale-erp-front/docs/plans/sales/2026-05-28-bizzle-credential-cache-redesign.md`

---

## 범위 (중요)

이 plan 은 **자격증명 캐시 레이어**만 만든다:
- `credential-cipher.ts` (암호화/저장/만료) — TDD
- `useBizzleCredential` hook (React 소비 인터페이스)
- BizzleImportModal 통합 **명세/예시** (모달 본체 구현은 기존 front plan §8 담당)
- 기존 plan 2개 문서 갱신

**이 plan 범위 밖** (기존 plan 재활용):
- BizzleImportModal 본체, 매출 조회/리스트/요약 UI, `POST /api/sales/scrape` mutation, 백엔드 일체

---

## File Structure

| 파일 | 책임 | 신규/수정 |
|------|------|-----------|
| `vitest.config.ts` | vitest 설정 (jsdom, alias, setup) | 신규 |
| `vitest.setup.ts` | fake-indexeddb + Web Crypto 폴리필 주입 | 신규 |
| `package.json` | devDeps + `test` 스크립트 | 수정 |
| `src/lib/crypto/credential-cipher.ts` | Web Crypto 암호화 + localStorage 저장/조회/만료 + 디바이스 키 | 신규 |
| `src/lib/crypto/credential-cipher.test.ts` | cipher 단위 테스트 | 신규 |
| `src/hooks/queries/use-bizzle-credential.ts` | cipher 를 TanStack Query 로 감싼 React hook | 신규 |
| `src/hooks/queries/query-keys.ts` | `bizzleCredentialKeys` 추가 | 수정 |
| `docs/plans/sales/2026-05-14-bizzle-sales-import-ui.md` | 자격증명 정책 갱신 | 수정 |
| `docs/plans/sales/2026-05-14-...scraper-integration.md`(api) | 배치 후속 항목 폐기 | 수정 |

---

## Task 1: vitest 테스트 인프라 셋업

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json`
- Create: `src/lib/crypto/smoke.test.ts` (셋업 검증용, 마지막에 삭제)

- [ ] **Step 1: 의존성 설치**

Run:
```bash
pnpm add -D vitest@^2 @vitejs/plugin-react jsdom fake-indexeddb
```
Expected: devDependencies 에 4개 추가, 설치 성공

- [ ] **Step 2: vitest 설정 파일 작성**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 3: setup 파일 작성 (fake-indexeddb + Web Crypto 폴리필)**

Create `vitest.setup.ts`:
```ts
import 'fake-indexeddb/auto'
import { webcrypto } from 'node:crypto'

// jsdom 환경에는 crypto.subtle 가 없을 수 있으므로 Node webcrypto 주입
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  })
}
```

- [ ] **Step 4: package.json 에 test 스크립트 추가**

Modify `package.json` scripts:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 5: 스모크 테스트로 셋업 검증**

Create `src/lib/crypto/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('vitest 셋업', () => {
  it('Web Crypto subtle 사용 가능', () => {
    expect(globalThis.crypto.subtle).toBeDefined()
  })
  it('IndexedDB 사용 가능', () => {
    expect(globalThis.indexedDB).toBeDefined()
  })
})
```

- [ ] **Step 6: 스모크 테스트 실행**

Run: `pnpm test src/lib/crypto/smoke.test.ts`
Expected: 2 passed

- [ ] **Step 7: 스모크 테스트 삭제 + 커밋**

```bash
rm src/lib/crypto/smoke.test.ts
git add vitest.config.ts vitest.setup.ts package.json pnpm-lock.yaml
git commit -m "chore: vitest + fake-indexeddb 테스트 인프라 추가"
```

---

## Task 2: 디바이스 고정 키 (getOrCreateDeviceKey)

**Files:**
- Create: `src/lib/crypto/credential-cipher.ts`
- Test: `src/lib/crypto/credential-cipher.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/lib/crypto/credential-cipher.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { __test_getOrCreateDeviceKey } from './credential-cipher'

// fake-indexeddb 는 테스트 간 상태가 남으므로 각 테스트 전에 DB 삭제
beforeEach(async () => {
  indexedDB.deleteDatabase('whale-erp-crypto')
})

describe('getOrCreateDeviceKey', () => {
  it('AES-GCM non-extractable 키를 생성한다', async () => {
    const key = await __test_getOrCreateDeviceKey()
    expect(key.type).toBe('secret')
    expect(key.algorithm).toMatchObject({ name: 'AES-GCM' })
    expect(key.extractable).toBe(false)
  })

  it('두 번 호출해도 같은 키를 반환한다 (idempotent)', async () => {
    const k1 = await __test_getOrCreateDeviceKey()
    const k2 = await __test_getOrCreateDeviceKey()
    // 같은 키면 한쪽으로 암호화한 것을 다른 쪽으로 복호화 가능
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k1, new TextEncoder().encode('x'))
    const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k2, enc)
    expect(new TextDecoder().decode(dec)).toBe('x')
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `pnpm test src/lib/crypto/credential-cipher.test.ts`
Expected: FAIL — `__test_getOrCreateDeviceKey` is not exported / 모듈 없음

- [ ] **Step 3: 최소 구현 작성**

Create `src/lib/crypto/credential-cipher.ts`:
```ts
const DEVICE_KEY_DB = 'whale-erp-crypto'
const DEVICE_KEY_STORE = 'keys'
const DEVICE_KEY_ID = 'bizzle-device-key'

function openKeyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DEVICE_KEY_DB, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(DEVICE_KEY_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DEVICE_KEY_STORE, 'readonly')
    const req = tx.objectStore(DEVICE_KEY_STORE).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DEVICE_KEY_STORE, 'readwrite')
    tx.objectStore(DEVICE_KEY_STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  const db = await openKeyDb()
  const existing = await idbGet<CryptoKey>(db, DEVICE_KEY_ID)
  if (existing) return existing
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // extractable=false → raw key export 불가
    ['encrypt', 'decrypt'],
  )
  await idbPut(db, DEVICE_KEY_ID, key)
  return key
}

// 테스트 전용 export
export const __test_getOrCreateDeviceKey = getOrCreateDeviceKey
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `pnpm test src/lib/crypto/credential-cipher.test.ts`
Expected: 2 passed

> 만약 "non-extractable CryptoKey 를 structured clone 할 수 없다"는 에러가 나면, fake-indexeddb 가 CryptoKey clone 을 지원하지 않는 것이다. 이 경우 Step 3 의 IndexedDB 저장값을 키 객체 대신 `{ created: true }` 마커 + `extractable: false` 키를 모듈 스코프 메모리에 캐시하는 방식으로 바꾸지 말 것 — 대신 테스트 환경에서만 `crypto.subtle` 의 실제 CryptoKey clone 을 지원하는 최신 fake-indexeddb(>=6) 를 쓰는지 확인한다. 실제 브라우저는 CryptoKey structured clone 을 표준 지원한다.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/crypto/credential-cipher.ts src/lib/crypto/credential-cipher.test.ts
git commit -m "feat: 자격증명 암호화용 디바이스 고정 키 (non-extractable)"
```

---

## Task 3: 비밀번호 암호화/복호화 (encryptPassword / decryptPassword)

**Files:**
- Modify: `src/lib/crypto/credential-cipher.ts`
- Test: `src/lib/crypto/credential-cipher.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가**

Append to `src/lib/crypto/credential-cipher.test.ts`:
```ts
import { __test_encryptPassword, __test_decryptPassword } from './credential-cipher'

describe('encrypt/decrypt password', () => {
  it('암호화 후 복호화하면 원문이 나온다', async () => {
    const blob = await __test_encryptPassword('s3cr3t-pw!')
    const plain = await __test_decryptPassword(blob)
    expect(plain).toBe('s3cr3t-pw!')
  })

  it('같은 평문도 매번 다른 ciphertext 를 만든다 (IV 랜덤)', async () => {
    const a = await __test_encryptPassword('same')
    const b = await __test_encryptPassword('same')
    expect(a.ciphertext).not.toBe(b.ciphertext)
    expect(a.iv).not.toBe(b.iv)
  })

  it('손상된 ciphertext 는 복호화 시 null 을 반환한다', async () => {
    const blob = await __test_encryptPassword('pw')
    const broken = { iv: blob.iv, ciphertext: 'AAAA' + blob.ciphertext.slice(4) }
    const plain = await __test_decryptPassword(broken)
    expect(plain).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `pnpm test src/lib/crypto/credential-cipher.test.ts`
Expected: FAIL — `__test_encryptPassword` not exported

- [ ] **Step 3: 구현 추가**

Add to `src/lib/crypto/credential-cipher.ts` (디바이스 키 함수 아래):
```ts
function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

interface EncryptedBlob {
  iv: string
  ciphertext: string
}

async function encryptPassword(plain: string): Promise<EncryptedBlob> {
  const key = await getOrCreateDeviceKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  )
  return { iv: bufToB64(iv.buffer), ciphertext: bufToB64(ct) }
}

async function decryptPassword(blob: EncryptedBlob): Promise<string | null> {
  try {
    const key = await getOrCreateDeviceKey()
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(b64ToBuf(blob.iv)) },
      key,
      b64ToBuf(blob.ciphertext),
    )
    return new TextDecoder().decode(pt)
  } catch {
    return null
  }
}

// 테스트 전용 export
export const __test_encryptPassword = encryptPassword
export const __test_decryptPassword = decryptPassword
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `pnpm test src/lib/crypto/credential-cipher.test.ts`
Expected: 5 passed (Task 2 의 2개 + 이번 3개)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/crypto/credential-cipher.ts src/lib/crypto/credential-cipher.test.ts
git commit -m "feat: AES-GCM 비밀번호 암호화/복호화 (실패 시 null)"
```

---

## Task 4: 저장/조회/삭제 + 7일 만료 (saveCredential / loadCredential / clearCredential)

**Files:**
- Modify: `src/lib/crypto/credential-cipher.ts`
- Test: `src/lib/crypto/credential-cipher.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가**

Append to `src/lib/crypto/credential-cipher.test.ts`:
```ts
import { saveCredential, loadCredential, clearCredential } from './credential-cipher'

const STORAGE_KEY = 'whale-erp:bizzle-credential'

beforeEach(() => {
  localStorage.clear()
})

describe('save/load/clear credential', () => {
  it('저장 후 조회하면 원본 자격증명이 나온다', async () => {
    await saveCredential({ loginId: 'user01', loginPw: 'pw1234' })
    const cred = await loadCredential()
    expect(cred).toEqual({ loginId: 'user01', loginPw: 'pw1234' })
  })

  it('localStorage 에 평문 비밀번호가 들어있지 않다', async () => {
    await saveCredential({ loginId: 'user01', loginPw: 'pw1234' })
    const raw = localStorage.getItem(STORAGE_KEY) ?? ''
    expect(raw).not.toContain('pw1234')
    expect(raw).toContain('user01') // 아이디는 평문 허용
  })

  it('만료되면 null 을 반환하고 저장값을 제거한다', async () => {
    await saveCredential({ loginId: 'user01', loginPw: 'pw1234' })
    // expiresAt 을 과거로 강제 조작
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    stored.expiresAt = Date.now() - 1
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const cred = await loadCredential()
    expect(cred).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('clearCredential 후 조회하면 null', async () => {
    await saveCredential({ loginId: 'user01', loginPw: 'pw1234' })
    await clearCredential()
    expect(await loadCredential()).toBeNull()
  })

  it('저장값이 없으면 null', async () => {
    expect(await loadCredential()).toBeNull()
  })

  it('손상된 JSON 이면 null 반환 + 제거', async () => {
    localStorage.setItem(STORAGE_KEY, 'not-json')
    expect(await loadCredential()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `pnpm test src/lib/crypto/credential-cipher.test.ts`
Expected: FAIL — `saveCredential` not exported

- [ ] **Step 3: 구현 추가**

Add to `src/lib/crypto/credential-cipher.ts`:
```ts
const STORAGE_KEY = 'whale-erp:bizzle-credential'
const TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface BizzleCredential {
  loginId: string
  loginPw: string
}

interface StoredCredential {
  loginId: string
  encryptedPw: EncryptedBlob
  savedAt: number
  expiresAt: number
}

export async function saveCredential(cred: BizzleCredential): Promise<void> {
  const encryptedPw = await encryptPassword(cred.loginPw)
  const now = Date.now()
  const stored: StoredCredential = {
    loginId: cred.loginId,
    encryptedPw,
    savedAt: now,
    expiresAt: now + TTL_MS, // sliding: 매 저장(가져오기 성공)마다 7일 뒤로 갱신
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

export async function loadCredential(): Promise<BizzleCredential | null> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  let stored: StoredCredential
  try {
    stored = JSON.parse(raw)
  } catch {
    await clearCredential()
    return null
  }

  if (typeof stored.expiresAt !== 'number' || Date.now() > stored.expiresAt) {
    await clearCredential()
    return null
  }

  const loginPw = await decryptPassword(stored.encryptedPw)
  if (loginPw === null) {
    // 디바이스 키 불일치/손상 — 자동 무효화
    await clearCredential()
    return null
  }

  return { loginId: stored.loginId, loginPw }
}

export async function clearCredential(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY)
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `pnpm test src/lib/crypto/credential-cipher.test.ts`
Expected: 11 passed (2 + 3 + 6)

- [ ] **Step 5: 테스트 전용 export 정리**

`__test_*` export 들은 그대로 두되, 파일 하단에 주석으로 명시:
```ts
// __test_* exports 는 단위 테스트 전용. 앱 코드에서 import 금지.
```

- [ ] **Step 6: 커밋**

```bash
git add src/lib/crypto/credential-cipher.ts src/lib/crypto/credential-cipher.test.ts
git commit -m "feat: 자격증명 localStorage 저장/조회/삭제 + 7일 sliding 만료"
```

---

## Task 5: React 소비 hook (useBizzleCredential)

**Files:**
- Create: `src/hooks/queries/use-bizzle-credential.ts`
- Modify: `src/hooks/queries/query-keys.ts`

> **React Compiler 규칙 주의** (CLAUDE.md): `useEffect` 내 setState 금지. 따라서 비동기 hydrate 는 직접 `useState`+`useEffect` 대신 **TanStack Query** 로 처리한다 (프로젝트 표준 패턴).

- [ ] **Step 1: query-keys 에 키 팩토리 추가**

Modify `src/hooks/queries/query-keys.ts` — 기존 export 구조를 따라 추가:
```ts
export const bizzleCredentialKeys = {
  all: ['bizzle-credential'] as const,
}
```
(파일의 다른 `*Keys` 객체와 같은 패턴/위치에 배치)

- [ ] **Step 2: hook 구현**

Create `src/hooks/queries/use-bizzle-credential.ts`:
```ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type BizzleCredential,
  loadCredential,
  saveCredential,
  clearCredential,
} from '@/lib/crypto/credential-cipher'
import { bizzleCredentialKeys } from './query-keys'

/**
 * Bizzle 자격증명 캐시 hook.
 * - credential: 미만료 저장 자격증명 (없으면 null)
 * - save: 가져오기 성공 & "기억하기" ON 시 호출 (7일 sliding 갱신)
 * - clear: "기억하기" OFF 또는 "저장 해제" 시 호출
 *
 * 평문 비밀번호는 query 캐시에 남으므로, 모달 unmount 시 호출부에서 removeCredentialCache() 로 정리한다.
 */
export function useBizzleCredential() {
  const qc = useQueryClient()

  const { data: credential = null, isLoading } = useQuery({
    queryKey: bizzleCredentialKeys.all,
    queryFn: loadCredential,
    staleTime: Infinity,
    gcTime: 0, // 구독자 사라지면 즉시 캐시 폐기 → 평문 비번 잔존 최소화
  })

  const save = async (cred: BizzleCredential) => {
    await saveCredential(cred)
    await qc.invalidateQueries({ queryKey: bizzleCredentialKeys.all })
  }

  const clear = async () => {
    await clearCredential()
    qc.setQueryData(bizzleCredentialKeys.all, null)
  }

  const removeCredentialCache = () => {
    qc.removeQueries({ queryKey: bizzleCredentialKeys.all })
  }

  return { credential, isLoading, save, clear, removeCredentialCache }
}
```

- [ ] **Step 3: 타입/lint 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과 (no `any`/`unknown`, React Compiler 규칙 위반 없음)

> hook 자체 단위 테스트는 범위 외(A 결정: cipher 만 TDD). 동작 검증은 Task 6 의 모달 통합 후 브라우저에서 수동 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/hooks/queries/use-bizzle-credential.ts src/hooks/queries/query-keys.ts
git commit -m "feat: useBizzleCredential hook (TanStack Query 기반 자격증명 캐시)"
```

---

## Task 6: BizzleImportModal 통합 명세 (모달 본체는 기존 plan §8)

> 모달 본체(폼/제출/매출 mutation)는 기존 front plan §8 의 작업 8번에서 구현한다.
> 이 Task 는 그 모달이 `useBizzleCredential` 을 **어떻게 통합하는지**를 못박는 명세다.
> 모달 구현 시점에 아래 패턴을 그대로 적용한다.

- [ ] **Step 1: 모달 상태/통합 패턴 명세 확정**

BizzleImportModal 통합 규칙:
```tsx
// 의사코드 — 기존 plan §8 모달 구현 시 적용
const { credential, save, clear, removeCredentialCache } = useBizzleCredential()

// 1) hydrate: credential 존재 → prefill + 체크박스 ON
//    React Compiler 규칙상 useEffect 내 setState 금지 →
//    모달을 credential 로딩 후 마운트하거나, 폼 초기값을 credential 기반 파생값으로 계산
const [remember, setRemember] = useState(false) // default OFF
//    초기값 주입은 key prop 리마운트 또는 defaultValue 패턴 사용 (CLAUDE.md 규칙)

// 2) 제출 (가져오기 클릭)
async function handleSubmit(form: { loginId: string; loginPw: string; startDate: string; endDate: string }) {
  if (remember) {
    await save({ loginId: form.loginId, loginPw: form.loginPw }) // 7일 sliding
  } else {
    await clear() // 이전 저장값 제거
  }
  await importMutation.mutateAsync(form) // 기존 plan 의 useImportBizzleSales
}

// 3) "저장 해제" 버튼
async function handleForget() {
  await clear()
  // 폼의 비밀번호 필드도 비움
}

// 4) 모달 unmount 시 평문 비번 캐시 정리
//    (cleanup 에서 setState 아님 → removeCredentialCache 호출은 React Compiler 규칙 무관)
useEffect(() => () => removeCredentialCache(), [removeCredentialCache])
```

체크박스 라벨: **"이 브라우저에 7일 동안 기억하기"**, default **OFF**.

- [ ] **Step 2: 기존 front plan 에 이 통합 패턴이 반영됐는지 확인**

이 명세는 Task 7(문서 갱신)에서 기존 front plan §4/§8 에 반영된다. 별도 코드 변경 없음 — 모달 구현은 기존 plan 담당.

- [ ] **Step 3: (모달 구현 후) 브라우저 수동 검증 체크리스트**

모달이 구현된 뒤 dev 서버에서 확인:
```
[ ] 체크박스 OFF 로 가져오기 → 새로고침 시 폼 비어 있음
[ ] 체크박스 ON 으로 가져오기 → 새로고침 시 아이디/비번 prefill + 체크박스 ON
[ ] localStorage 'whale-erp:bizzle-credential' 값에 평문 비번 없음 (개발자도구 확인)
[ ] "저장 해제" 클릭 → localStorage 항목 제거 + 폼 비번 비워짐
[ ] expiresAt 을 과거로 조작 후 새로고침 → 자동 제거 + 빈 폼
[ ] 다른 브라우저에서 같은 localStorage 값 주입 → 복호화 실패로 빈 폼
```

---

## Task 7: 기존 front plan 문서 갱신

**Files:**
- Modify: `docs/plans/sales/2026-05-14-bizzle-sales-import-ui.md`

- [ ] **Step 1: §2 자격증명 정책 행 교체**

`자격증명 저장 | 저장하지 않음 — sessionStorage/localStorage 모두 금지, React state(메모리)만`
→
`자격증명 저장 | localStorage 암호화 저장 (Web Crypto 디바이스 키, 7일 sliding 만료), "기억하기" 체크박스 default OFF. 상세: 2026-05-28-bizzle-credential-cache-redesign.md`

- [ ] **Step 2: §4 사용자 흐름에 hydrate/저장/해제 단계 추가** (redesign spec §5 흐름 반영)

- [ ] **Step 3: §6 보안 체크리스트의 "storage 사용 금지" 항목을 "암호화 저장 + 디바이스 키 + unmount 시 평문 캐시 정리" 로 교체**

- [ ] **Step 4: §8 작업 순서에 credential-cipher / useBizzleCredential / 체크박스 / 저장 해제 단계 추가**

- [ ] **Step 5: §10 후속의 "자격증명 저장하기 옵션" 항목을 "본 재설계로 해결됨" 으로 표시**

- [ ] **Step 6: 커밋**

```bash
git add docs/plans/sales/2026-05-14-bizzle-sales-import-ui.md
git commit -m "docs: front sales plan 자격증명 캐시 재설계 반영"
```

---

## Task 8: 기존 api plan 문서 갱신 (배치 폐기)

**Files:**
- Modify: `whale-erp-api/docs/plans/sales/2026-05-14-bizzle-sales-scraper-integration.md`

- [ ] **Step 1: §3 보류 항목에서 "자격증명 저장형 자동 수집(스케줄러 연동)" 제거 → "폐기" 명시**

- [ ] **Step 2: §12 미해결에서 "스케줄링 자동 수집" 항목 제거 → "폐기 (배치 사용 안 함, 2026-05-28 결정)"**

- [ ] **Step 3: 결정 이력 표에 행 추가**
```
| 10 | 자격증명 캐시/배치 | 브라우저 localStorage 암호화 캐시(7일), 배치/스케줄러 폐기 | redesign spec |
```

- [ ] **Step 4: 커밋**

```bash
git add docs/plans/sales/2026-05-14-bizzle-sales-scraper-integration.md
git commit -m "docs: api sales plan 배치 자동수집 폐기 반영"
```

---

## 완료 기준

- [ ] `pnpm test` 통과 (credential-cipher 11 케이스)
- [ ] `pnpm lint && pnpm build` 통과
- [ ] `credential-cipher.ts` + `useBizzleCredential.ts` 존재, 앱 코드는 `__test_*` 미사용
- [ ] 기존 plan 2개 문서에 재설계/배치폐기 반영
- [ ] (모달 구현 후) Task 6 Step 3 수동 검증 체크리스트 통과
