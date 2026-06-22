# Bizzle 매출 가져오기 변조방지 가드 (Design Spec)

- 작성일: 2026-06-12
- 개정일: 2026-06-19 — 3계층 중계 구조 반영, key 검증 주체를 sales-rader 로 정정, 동시 진행 락(목표 2) 보류, 419 인터셉터 검증 완료
- 상태: **설계 합의 — 백엔드(sales-rader) key 엔드포인트 구현 대기**
- 작성자: 창규 + 클로 (grill-me 세션)
- 관련 문서:
  - `whale-erp-front/docs/plans/sales/2026-05-14-bizzle-sales-import-ui.md` (가져오기 UI 원안)
  - `whale-erp-front/docs/plans/sales/2026-05-28-bizzle-credential-cache-redesign.md` (자격증명 캐시 재설계)
  - `whale-erp-api/...` 백엔드 sales scraper 중계 plan (이 spec 의 중계 계층 구현 주체)
  - `sales-rader/backend` (FastAPI) — 이 spec 의 key 생성·검증·스크래핑 **실제 구현 주체**

---

## 1. 배경 / 동기

### 1.1 시스템 구성 (3계층)

일/월별 매출 조회의 "데이터 가져오기"는 **3계층**을 거쳐 외부 사이트 `https://bizzle.smartro.co.kr` 를
스크래핑한다.

```
whale-erp-front (:3000)
   │  POST /api/v1/sales/import   (→ :8080)
   ▼
whale-erp-api (:8080)            ← 중계(프록시) 계층
   │  POST /api/scrape-aggregate (→ :7000)
   ▼
sales-rader backend (:7000, FastAPI + Playwright)   ← 실제 Bizzle 로그인·스크래핑 (수 분 소요)
   │
   ▼
https://bizzle.smartro.co.kr
```

- front 는 sales-rader 를 **직접 호출하지 않는다.** 항상 whale-erp-api 를 경유한다
  (front env 는 `NEXT_PUBLIC_API_URL=http://localhost:8080` 단일 백엔드).
- sales-rader 는 `docker-compose.yml` 에서 `127.0.0.1:7000:8000` 으로 **localhost 에만 바인딩**되어
  외부에서 직접 접근 불가. **외부에 노출된 공격 표면은 whale-erp-api(:8080) 뿐이다.**

### 1.2 우려

**인증된 사용자가 정상 모달 UI를 거치지 않고 `/import` I/F를 임의 경로(Postman·스크립트 등)로 직접 호출**하면,
외부 사이트에 부하 또는 변조 위험이 발생할 수 있다.

### 1.3 목표

1. **모달 외 경로의 "맨손 단발 직접 호출" 차단** — 1회성 key 핸드셰이크 (이번 범위 / 신규 구현)
2. **의도적 동시 부하 차단** — **이미 whale-erp-api 에 member 단위로 구현돼 있음** (`SalesImportConcurrencyGuard`,
   409 `SALES_IMPORT_IN_PROGRESS`). 추가 작업 불필요 (§7-1). 단 이 가드는 동일 회원의 *동시* 실행만 막고
   순차 반복 호출은 막지 않는다.

> ⚠️ 설계 한계(합의됨): 공격자가 유효한 Bearer 토큰을 가진 인증 사용자인 한, key 발급 경로도 같은 인증 뒤에 있으므로
> [발급→import] 핸드셰이크 전체를 흉내 내는 정교한 호출까지는 막지 못한다.
> 즉 key는 **"문턱을 크게 높이는 억지력(deterrent)"** 이지 암호학적 차단이 아니다. "단순하게" 처리하는 것이 목적이므로 이 수준을 수용한다.

---

## 2. 결정 요약 (grill-me)

| # | 영역 | 결정 |
|---|------|------|
| 1 | 막을 대상 | 인증 사용자의 **모달 외 경로 맨손 단발 직접 호출** (반복 부하 차단은 이번 범위 제외 → §7-1) |
| 2 | key 발급 시점 | 모달 "가져오기" 확인 클릭 순간 발급 → **즉시 import** (back-to-back, front 의 하나의 메서드) |
| 3 | key 생성·검증 주체 | **sales-rader** (whale-erp-api 아님). whale-erp-api 는 발급·검증을 **하지 않고 순수 중계만** 한다 |
| 4 | key 전달 주체 | **front** 가 발급받은 key 를 헤더에 실어 import 호출 (api 가 자동 발급·부착하면 가드 무력화 → §4.3) |
| 5 | key 바인딩 | `(year, month)` — 발급 시 지정한 월의 import 에만 사용 가능 |
| 6 | key 저장소 | **sales-rader 인메모리** (단일 인스턴스 전제), 검증 즉시 삭제(**1회용 소멸**) |
| 7 | TTL | **60초** — 정상 key 는 그 전에 소멸. 60초는 "발급됐으나 import 가 끝내 오지 않은 **버려진 key** 청소용 안전망" |
| 8 | key 거부 신호 | **HTTP 419** + body `code: "INVALID_IMPORT_KEY"` (메시지 문자열 매칭 아닌 code 분기) |
| 9 | 메서드 위치 | front `src/lib/api/sales.ts` 의 `importSales` 내부에서 [issue-key → import] 연속 호출 |
| 10 | Bizzle 차단 주체 | **sales-rader** — import 진입 즉시 key 검증, 실패 시 **Bizzle 호출 전에** 에러 반환. api 는 그 에러를 그대로 중계, front 는 alert 만 |

---

## 3. 흐름

```
[모달 "가져오기" 확인 클릭]
      │  (front: importSales 하나의 메서드)
      ▼
① POST /api/v1/sales/import-key   body: { year, month }     (front → api)
      │   api: 그대로 중계 → sales-rader (key 발급 요청)
      │   ← sales-rader: 1회용 key 생성, 인메모리에 { key → (year, month, expiresAt=now+60s) } 저장, { key } 반환
      │   ← api: { key } 그대로 front 로 중계
      ▼
② POST /api/v1/sales/import       header: X-Sales-Import-Key: <key>     (front → api)
      │                           body:   { year, month, loginId, loginPw }
      │   api: 헤더·바디 그대로 중계 → sales-rader (key 검증·부착·생성 일절 안 함)
      ▼ sales-rader 진입부, Bizzle 건드리기 전에 순서대로 검사:
        1. key 검증: 존재 · 미만료(≤60s) · (year, month) 일치
              실패 → 419 { code: "INVALID_IMPORT_KEY" }   (Bizzle 호출 안 함)
        2. key 즉시 delete (1회용 소멸)
        3. Bizzle 로그인·스크래핑(수 분) → Supabase 저장
      │   api: sales-rader 응답(성공/419)을 그대로 front 로 중계
      ▼
   기존 SalesImportResponse 반환
```

> 핵심: ①·② **둘 다 front 가 api 를 경유해 호출**한다. api 는 양쪽 모두 **순수 패스스루**이고,
> key 의 생성·저장·검증·소멸은 전부 sales-rader 가 담당한다.

---

## 4. API 계약

### 4.1 front ↔ whale-erp-api (front 가 호출하는 경로)

#### ① 신규: `POST /api/v1/sales/import-key`
- 인증: 기존과 동일 (Bearer + affiliation 헤더, 인터셉터 자동)
- Request body: `{ "year": number, "month": number }`
- Response: 기존 envelope 준수 → `{ "data": { "key": string } }`
- 동작: whale-erp-api 는 이 요청을 sales-rader 의 key 발급 엔드포인트로 **그대로 중계**하고 응답을 반환한다.

#### ② 변경: `POST /api/v1/sales/import`
- 추가 요청 헤더: `X-Sales-Import-Key: <key>` (필수)
- Request body: 기존 그대로 `{ year, month, loginId, loginPw }`
- 동작: whale-erp-api 는 `X-Sales-Import-Key` 헤더를 **변경·생성·검증 없이** sales-rader 로 그대로 전달한다.
- 신규 에러 응답(sales-rader 가 내려준 것을 그대로 중계):
  - `419` `{ "code": "INVALID_IMPORT_KEY", "message": "..." }` — key 없음/만료/불일치/재사용
- 성공 응답: 기존 `SalesImportResponse` 불변

### 4.2 whale-erp-api ↔ sales-rader (백엔드 내부 중계)

- **신규 필요**: sales-rader 에 key 발급 엔드포인트 추가 (예: `POST /api/import-key`).
  현재 sales-rader 라우터(`backend/app/routers/`)에는 key 관련 코드가 **전혀 없으므로 신규 구현 대상**이다.
- **변경 필요**: sales-rader 의 실제 스크래핑 엔드포인트(`POST /api/scrape-aggregate`) 진입부에
  `X-Sales-Import-Key` 헤더 검증 → 소멸 로직 추가. 실패 시 Bizzle 호출 전에 419 반환.
- **key 바인딩 파라미터: `(year, month)` 로 확정.** whale-erp-api 는 발급(`import-key`)·검증(`import`)
  양쪽에 `year`/`month` 를 그대로 sales-rader 로 넘기고, sales-rader 는 `(year, month)` 단위로 key 를 저장·대조한다.
  scrape-aggregate 가 내부에서 쓰는 `start_date`/`end_date` 변환은 **key 검증과 무관하게** 기존대로 둔다.
  - 근거: 사용자 선택 단위가 월이고 front↔api 계약도 `{ year, month }` 이므로 비교 단위도 월이면 충분하다.
    `start_date`/`end_date` 까지 정밀 비교하면 월 경계(1일~말일) 계산이 양쪽에서 1바이트라도 어긋날 때
    멀쩡한 key 가 불일치로 거부될 위험이 있어, 거친 단위(year, month)로 비교하는 편이 더 안전하다.

### 4.3 왜 "front 가 key 를 전달" 해야 하는가 (api 대행 금지 근거)

가드의 본질은 **[key 발급]과 [import 호출]을 클라이언트(front)가 의식적으로 밟는 2단계 동작**으로 만드는 것이다.

- 만약 whale-erp-api 가 import 요청을 받을 때 **내부에서 자동으로 key 를 발급받아 헤더에 붙여** sales-rader 로
  보내면, 공격자가 Postman 으로 `/api/v1/sales/import` 를 맨손으로 호출해도 api 가 똑같이 key 를 붙여주므로
  **항상 통과 = 가드 완전 무력화**된다.
- 따라서 key 는 반드시 **front 가 ①에서 받아 ②에 직접 실어** 보내야 하고, api 는 그 헤더에 손대지 않는다.
- 공격자가 칠 수 있는 지점은 api(:8080) 뿐이고(sales-rader 는 localhost 바인딩), api 가 key 를 대행하지 않으므로
  "맨손 단발 import 직접 호출"은 sales-rader 의 key 검증에서 걸러진다.

---

## 5. 변경 / 불변

### 변경
- **sales-rader**: key 발급 엔드포인트 신규, 인메모리 key store(TTL 60s, 1회용)
- **sales-rader**: scrape-aggregate 진입부에 key 검증 → 소멸 (실패 시 Bizzle 호출 전 419)
- **whale-erp-api**: `import-key` 중계 엔드포인트 신규, `import` 의 `X-Sales-Import-Key` 헤더 패스스루
- **프론트**: `src/lib/api/sales.ts` `importSales` — issue-key 호출 후 받은 key 를 헤더에 넣어 import 호출
- **프론트**: `DailySales.tsx` `handleImport` 에러 분기에 `INVALID_IMPORT_KEY` 전용 alert 추가

### 불변
- 인증 방식(Bearer + affiliation), import body 시그니처(`year/month/loginId/loginPw`)
- import 타임아웃(310s), 자격증명 비저장 정책, 부분 수집 판별 로직
- 일/월별 조회 화면·조회 API
- whale-erp-api ↔ sales-rader 의 기존 스크래핑 중계 흐름(헤더 검증·발급만 추가)

---

## 6. 프론트 변경 상세

### `src/lib/api/sales.ts`
- `importSales(year, month, loginId, loginPw)` 내부:
  1. `const { key } = (await api.post('/api/v1/sales/import-key', { year, month })).data.data`
  2. 기존 import 호출에 `headers: { 'X-Sales-Import-Key': key }` 추가
- issue-key 단계 실패(네트워크 등)는 "잘못된 방식"이 아니라 일반 오류로 처리되도록 주의
  (419 INVALID_IMPORT_KEY 는 issue-key 가 아니라 import 단계에서만 발생)

### `DailySales.tsx` `handleImport` catch 분기
- api 응답 body `code === 'ERR13008'`(= `SALES_INVALID_IMPORT_KEY`) → `await alert('잘못된 데이터 가져오기 방식입니다.')`
  - ⚠️ sales-rader 내부 신호는 `INVALID_IMPORT_KEY` 지만, whale-erp-api 가 이를 `ErrorCode.SALES_INVALID_IMPORT_KEY`
    (code **`ERR13008`**)로 변환해 내려주므로, **front 가 보는 분기 키는 `ERR13008`** 이다.
  - HTTP status(419/400)에 의존하지 않고 body `code` 로 분기 → 419↔400 결정과 무관하게 동작.
- 타임아웃 / 자격증명 오류 등 → 기존 분기 유지

---

## 7. 미결 / 리스크

1. **동시 진행 락(목표 2) — 이미 구현됨, 추가 작업 불필요** — whale-erp-api `SalesImportConcurrencyGuard`
   (`domain/sales/service/SalesImportConcurrencyGuard.kt`)가 **member(memberId) 단위**로 동시 import 를
   직렬화하고, 이미 진행 중이면 즉시 409 `SALES_IMPORT_IN_PROGRESS`(ERR13007)로 거절한다. plan 원안의
   "affiliation 단위 신규 락"은 불필요 — 기존 member 단위 가드로 대체된다.
   단 이 가드는 동일 회원의 *동시* 실행만 막고, **순차 반복 호출 자체는 막지 않는다**(key 도 반복하면 매번 새로 발급 가능).
   순차 반복 부하가 실제 관측되면 sales-rader/api 단 rate-limit 을 별건으로 검토한다.
2. **단일 인스턴스 전제** — **확정.** sales-rader 는 단일 인스턴스(`127.0.0.1:7000`)이므로 인메모리 key store 가 유효하다.
   추후 다중 인스턴스로 확장 시 공유 저장소(Redis 등)로 교체 필요.
3. **419 상태코드 — front 검증 완료 / api 구현 제약 있음**
   - front: **검증 완료.** `src/lib/api.ts` 응답 인터셉터는 401(refresh/logout)·403(권한 캐시 무효화)만 특수 처리하고,
     **419 는 그대로 reject** 하므로 강제 로그아웃되지 않는다(ERP 로그인 상태 유지). 향후 인터셉터에 419 핸들링이
     추가되면 깨질 수 있으니 주석으로 의존성을 남긴다.
   - api: **제약 있음.** `ErrorCode.status` 가 `HttpStatus` enum 타입인데 **419 는 이 enum 에 존재하지 않는다**(Spring).
     419 를 내려주려면 enum 필드 타입을 `HttpStatusCode` 로 넓혀 `HttpStatusCode.valueOf(419)` 를 쓰거나, 전역 핸들러에서
     해당 코드만 419 로 매핑해야 한다(상세: api 작업서). **403 은 금지** — front 인터셉터가 403 에서 my-authority 캐시를
     무효화하는 부작용이 있다. 419 가 부담되면 **400** 으로 단순화 가능(분기는 어차피 body `code` 로 하므로 status 는 보조).
4. **issue-key 자체 남용** — issue-key 는 Bizzle 을 건드리지 않아 비용이 낮지만, 무한 발급 시 sales-rader 메모리 증가 여지.
   TTL 60s 만료 청소로 상한이 잡히나, 필요 시 issue-key 에도 가벼운 rate-limit 검토.

---

## 8. 다음 단계
1. 백엔드팀과 §4 API 계약(front↔api↔sales-rader 3계층) + §7 미결 항목 합의
2. **sales-rader**: key 발급 엔드포인트 + scrape-aggregate 진입부 key 검증·소멸 구현
3. **whale-erp-api**: import-key 중계 + import 헤더 패스스루 구현
4. 프론트 §6 구현 (백엔드 엔드포인트 준비 후 통합 검증)
5. `pnpm lint` / 타입체크 / 빌드체크
