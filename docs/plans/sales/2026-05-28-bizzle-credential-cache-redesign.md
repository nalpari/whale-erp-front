# Bizzle 자격증명 브라우저 캐시 재설계 (Design Spec)

- 작성일: 2026-05-28
- 상태: **설계 합의 — 구현 plan 작성 대기**
- 작성자: 재영 + 클로 (brainstorming 세션)
- 관련 plan:
  - `whale-erp-front/docs/plans/sales/2026-05-14-bizzle-sales-import-ui.md` (갱신 대상)
  - `whale-erp-api/docs/plans/sales/2026-05-14-bizzle-sales-scraper-integration.md` (후속 항목 정리)
  - `whale-erp-api/docs/plans/sales/2026-05-27-bizzle-scraper-deployment-discussion.md` (영향 없음, 그대로 유효)

---

## 1. 배경 / 동기

기존 sales scraper plan(2026-05-14)은 자격증명을 **매 호출마다 사용자가 모달에 직접 입력**하고, 브라우저 어디에도 저장하지 않는(`sessionStorage`/`localStorage` 모두 금지, React state만) 정책이었다.

재설계 동기:
1. **매번 재입력 UX 부담** — 사용자가 주기적으로 수집할 때마다 Bizzle 아이디/비밀번호를 다시 입력해야 함
2. **서버 DB 저장은 여전히 거부** — 자격증명을 whale-erp DB에 보관하는 것은 보안상 받아들이지 않음
3. **배치/스케줄러 자동 수집 폐기** — 자격증명을 서버에 저장해 자동 수집하는 후속 방향 자체를 접음. 수집은 **사용자가 직접 트리거**할 때만 발생

결론: 자격증명을 **사용자 브라우저(localStorage)에 암호화 저장**하여 재입력 부담을 줄이되, 서버 DB에는 절대 남기지 않고, 자동 수집(배치)은 하지 않는다.

---

## 2. 결정 요약 (brainstorming)

| # | 영역 | 결정 |
|---|------|------|
| 1 | 자격증명 저장 위치 | **localStorage** (브라우저), **7일 만료** |
| 2 | 만료 방식 | **sliding window** — 매 사용 시 만료 시각을 7일 뒤로 갱신 |
| 3 | 서버 측 처리 | 기존 그대로 — 매 호출 `{loginId, loginPw, ...}` body 전송, 서버는 일회성 메모리, DB/로그 안 남김 |
| 4 | 배치/스케줄러 | **사용 안 함** — 사용자 트리거 only. "스케줄링 자동 수집" 후속 항목 명시적 폐기 |
| 5 | 재설계 범위 | **좁은 변경** — 기존 9개 결정 유지, 자격증명 처리 + 배치 정책만 갱신. 백엔드 API 시그니처 불변 |
| 6 | 저장 UX | 모달에 "7일 동안 기억하기" 체크박스, **default OFF** |
| 7 | 자동 hydrate | 저장된 자격증명은 모달 진입 시 prefill 하지만 **자동 수집 호출은 안 함** (수동 클릭 필수) |
| 8 | 보안 가드 | **Web Crypto API + 디바이스 고정 키** (non-extractable CryptoKey, AES-GCM) |

---

## 3. 범위 (변경 / 불변)

### 변경 (이 spec 의 핵심)
- front: 자격증명 입력/저장/hydrate/clear 흐름
- front: 암호화 모듈 신규
- front: 저장 체크박스 UX
- plan 문서: 자동 수집/스케줄러 후속 항목 폐기 명시

### 불변 (기존 plan 그대로 유지)
- 백엔드 `POST /api/sales/scrape` 시그니처 (`{loginId, loginPw, startDate, endDate}`)
- 서버 측 Playwright 처리 + 자격증명 일회성 메모리 + DB/로그 비저장
- 데이터 귀속 단위 `member_id`
- UNIQUE `(member_id, acquirer, approval_number)`
- 시각 타입 `LocalDateTime`(KST naive)
- 카드번호 뒤4 마스킹
- 동시 호출 가드 (`ConcurrentHashMap`)
- 수집 기간 ≤31일 강제
- 수집 중 안내 텍스트 UX
- **Alpine + Playwright 배치 아키텍트 논의**(별도 문서) — 이 spec 과 독립적으로 여전히 미결

---

## 4. 자격증명 처리 아키텍처

### 4.1 localStorage 데이터 구조

```ts
// localStorage key: 'whale-erp:bizzle-credential'
interface StoredCredential {
  loginId: string          // 평문 (아이디는 식별자라 평문 허용)
  encryptedPw: {
    iv: string             // base64, AES-GCM IV (매 저장마다 새로 생성)
    ciphertext: string     // base64, AES-GCM 암호문
  }
  savedAt: number          // epoch ms
  expiresAt: number        // savedAt + 7*24*60*60*1000 (sliding window 로 매 사용 시 갱신)
}
```

> 아이디는 평문 저장(식별자), **비밀번호만 암호화**. 비밀번호는 절대 평문으로 localStorage 에 두지 않는다.

### 4.2 암호화 모듈 (신규)

위치: `src/lib/crypto/credential-cipher.ts` (확정 시 plan 에서 조정 가능)

```ts
// 디바이스 고정 키 — IndexedDB 에 non-extractable CryptoKey 로 1회 생성 후 재사용
async function getOrCreateDeviceKey(): Promise<CryptoKey>

// 비밀번호 암호화 (AES-GCM 256, 매번 새 IV)
async function encryptPassword(plain: string): Promise<{ iv: string; ciphertext: string }>

// 복호화 — 디바이스 키 없음/불일치 시 null (자동 무효화)
async function decryptPassword(blob: { iv: string; ciphertext: string }): Promise<string | null>
```

**디바이스 키 특성**:
- `crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, /* extractable */ false, ['encrypt', 'decrypt'])`
- `extractable: false` → JS 가 raw key bytes 를 `exportKey` 할 수 없음 → XSS 가 키를 다른 환경으로 탈취 불가
- IndexedDB 에 `CryptoKey` 객체 자체를 저장 (structured clone 으로 non-extractable 키 보관 가능)
- 같은 origin/브라우저에서만 복호화 가능. 다른 브라우저/익스텐션/디바이스로 localStorage 값만 복사해도 복호화 불가

### 4.3 저장/조회/만료/제거 흐름

| 동작 | 트리거 | 처리 |
|------|--------|------|
| **hydrate** | 모달 mount | localStorage 읽기 → 만료 체크 (만료면 자동 제거 + 빈 폼) → 복호화 (실패면 자동 제거 + 빈 폼) → loginId/loginPw prefill + 체크박스 ON |
| **저장** | "가져오기" 클릭 & 체크박스 ON | 비번 암호화 → `savedAt=now`, `expiresAt=now+7d` 로 localStorage 갱신 (sliding) |
| **갱신(sliding)** | 저장된 자격증명으로 재수집 & 체크박스 ON 유지 | `expiresAt` 을 다시 7일 뒤로 |
| **명시적 OFF** | "가져오기" 클릭 & 체크박스 OFF (이전 저장값 존재) | localStorage 항목 제거 |
| **자동 만료** | hydrate 시 `now > expiresAt` | localStorage 항목 제거 |
| **수동 해제** | 별도 메뉴 (마이페이지 등) "Bizzle 저장 자격증명 삭제" | `clearCredential()` 즉시 호출 |

### 4.4 "자동 수집 안 함" 원칙

- prefill 된 자격증명이 있어도 **자동으로 `/scrape` 호출하지 않는다**
- 사용자가 기간을 확인하고 "가져오기" 버튼을 명시적으로 클릭해야만 수집
- 이것이 "배치/스케줄러 폐기" 결정의 front 측 구현 (어떤 자동 트리거도 없음)

---

## 5. 사용자 흐름

1. 사이드바 "매출" 진입 → 대시보드가 기본 기간(최근 30일)으로 summary 조회 (기존과 동일)
2. "Bizzle에서 가져오기" 클릭 → `BizzleImportModal` open
   - **hydrate**: 미만료 저장 자격증명 있으면 loginId/loginPw prefill + "7일 동안 기억하기" 체크박스 ON
   - 없거나 만료/복호화 실패 → 빈 폼 + 체크박스 OFF
3. 사용자가 폼 확인/수정 + 기간 입력 (Zod refine: ≤31일, end≤today)
4. "가져오기" 클릭:
   - 체크박스 ON → 비번 암호화 후 localStorage 저장/갱신 (sliding 7일)
   - 체크박스 OFF → 기존 저장값 있으면 제거
   - `POST /api/sales/scrape` 호출 (mutation isPending 동안 버튼/입력 잠금 — 기존 동시 호출 가드 유지)
5. 응답 처리 (기존 plan §4 그대로): SUCCESS/PARTIAL/FAILED + ErrorCode 별 메시지
6. 모달 unmount 시: **메모리상의 평문 비번 state 클리어**. (localStorage 의 암호화 값은 체크박스 ON 이면 유지)

---

## 6. 보안 분석

### 6.1 위협 모델과 대응

| 위협 | 대응 | 잔여 위험 |
|------|------|-----------|
| **같은 PC 다른 사용자가 개발자도구로 열람** | 비번은 암호화, 키는 non-extractable | 낮음 — ciphertext 만 보임, 복호화는 같은 브라우저 JS 컨텍스트 필요 |
| **localStorage 값만 다른 디바이스로 복사** | 디바이스 고정 키 (다른 브라우저는 키 없음) | 없음 — 복호화 불가 |
| **XSS (악성 JS 주입)** | 부분 대응 — 키 export 는 막지만, 같은 페이지 JS 는 `decryptPassword` 호출 가능 | **있음** — XSS 자체를 막는 건 CSP/입력 검증 등 별도 레이어 책임 |
| **만료 후 잔존** | sliding 7일 + hydrate 시 자동 제거 | 낮음 |
| **공용 PC 무심코 저장** | 체크박스 default OFF | 낮음 — 사용자가 의식적으로 체크해야 |

### 6.2 한계 명시 (정직하게)

- **XSS 완전 방어가 아님**: non-extractable 키는 "탈취 후 다른 환경 재사용"을 막을 뿐, 같은 페이지에서 실행되는 악성 JS 는 키를 사용해 복호화할 수 있다. XSS 방어는 CSP, 입력 sanitize, 의존성 점검 등 앱 전반의 책임이며 본 spec 범위 밖이다.
- **localStorage 자체의 한계**: 브라우저/OS 레벨 멀웨어가 IndexedDB+localStorage 를 함께 덤프하면 복호화 가능. 완벽한 비밀 보관소는 아니다.
- 이 설계는 "서버 DB 저장 회피 + 재입력 UX 개선" 과 "합리적 수준의 클라이언트 보관 보안" 사이의 절충이다.

---

## 7. 백엔드 영향 (없음)

- `POST /api/sales/scrape` 시그니처/동작 변경 없음
- 서버는 여전히 자격증명을 body 로 받아 일회성 사용, DB/로그 비저장
- 기존 API plan 의 §4·§5·§6·§7·§8·§9·§10 모두 그대로

### 후속 항목 폐기 (API plan 정리)
- §3 보류: "자격증명 저장형 자동 수집(스케줄러 연동)" → **폐기** (배치 안 씀)
- §12 미해결: "스케줄링 자동 수집" → **폐기**

---

## 8. 기존 plan 문서 갱신 목록

### front plan (`2026-05-14-bizzle-sales-import-ui.md`)
- §2 핵심 정책: "자격증명 저장: 저장 안 함(storage 금지)" → "**localStorage 암호화 저장(7일 sliding, 체크박스 default OFF)**" 로 변경 + 본 spec 링크
- §4 사용자 흐름: hydrate/저장/clear 단계 추가
- §5 API/쿼리 레이어: 암호화 모듈(`credential-cipher.ts`) 참조 추가
- §6 보안 체크리스트: "storage 금지" 항목 → "암호화 저장 + 디바이스 키" 항목으로 교체
- §8 작업 순서: 암호화 모듈, 체크박스, hydrate, 수동 해제 메뉴 단계 추가
- §10 후속: "자격증명 저장하기 옵션(저장형 정책 협의 후)" → 본 spec 으로 해결됨 표시

### api plan (`2026-05-14-bizzle-sales-scraper-integration.md`)
- §3 보류 / §12 미해결: 스케줄러 자동 수집 항목 폐기
- 결정 이력 표: 배치 폐기 + 자격증명 캐시 재설계 행 추가 + 본 spec 링크

---

## 9. 작업 순서 (구현 plan 에서 상세화)

> front 신 기능 표준 순서: types → schemas → (crypto util) → query hooks → 컴포넌트 → 라우트

1. [ ] `src/lib/crypto/credential-cipher.ts` — Web Crypto + IndexedDB 디바이스 키, encrypt/decrypt/store/load/clear
2. [ ] **단위 테스트** — 암호화/복호화 round-trip, 만료 제거, 디바이스 키 불일치 시 null
3. [ ] `BizzleImportModal` — "7일 동안 기억하기" 체크박스(default OFF), hydrate prefill, 저장/제거 분기
4. [ ] 모달 unmount 시 메모리 평문 비번 클리어 (기존 정책 유지)
5. [ ] 수동 해제 메뉴/버튼 (마이페이지 또는 모달 내 "저장 해제")
6. [ ] 기존 동시 호출 가드/Zod 기간 제한 흐름과 통합 (기존 plan 유지)
7. [ ] `pnpm lint` + `pnpm build` + React Compiler 규칙 점검
8. [ ] 기존 plan 2개 문서 갱신 (§8 목록대로)

---

## 10. 미해결 / 후속

- [ ] 만료 7일이 적정한지 운영 후 재평가 (3/7/14/30일 조정 여지)
- [ ] 멀티 디바이스: 각 브라우저가 독립 저장 (디바이스 키가 달라 공유 불가) — 의도된 동작, 별도 동기화 안 함
- [ ] Bizzle 측 IP 화이트리스트는 서버 IP 기준 (변경 없음 — 자격증명 위치만 바뀜)
- [ ] (독립) Alpine + Playwright 배치 아키텍트 논의는 그대로 진행
