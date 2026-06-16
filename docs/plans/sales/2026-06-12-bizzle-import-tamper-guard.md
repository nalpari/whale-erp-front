# Bizzle 매출 가져오기 변조방지 가드 (Design Spec)

- 작성일: 2026-06-12
- 상태: **설계 합의 — 백엔드 계약 확정 및 구현 대기**
- 작성자: 창규 + 클로 (grill-me 세션)
- 관련 문서:
  - `whale-erp-front/docs/plans/sales/2026-05-14-bizzle-sales-import-ui.md` (가져오기 UI 원안)
  - `whale-erp-front/docs/plans/sales/2026-05-28-bizzle-credential-cache-redesign.md` (자격증명 캐시 재설계)
  - `whale-erp-api/...` 백엔드 sales scraper plan (이 spec 의 ①②③ 구현 주체)

---

## 1. 배경 / 동기

일/월별 매출 조회의 "데이터 가져오기"는 sales-rader(백엔드)가 외부 사이트 `https://bizzle.smartro.co.kr`에
로그인·스크래핑하여 수집한다(`POST /api/v1/sales/import`, 수 분 소요).

우려: **인증된 사용자가 정상 모달 UI를 거치지 않고 `/import` I/F를 임의 경로(Postman·스크립트 등)로 직접·반복 호출**하면,
외부 사이트에 부하 또는 변조 위험이 발생할 수 있다.

목표(우선순위 순):
1. **모달 외 경로의 "맨손 직접 호출" 차단** — key 핸드셰이크
2. **의도적 동시 부하 차단** — 단일 진행 락

> ⚠️ 설계 한계(합의됨): 공격자가 유효한 Bearer 토큰을 가진 인증 사용자인 한, key 발급 엔드포인트도 같은 인증 뒤에 있으므로
> [발급→import] 핸드셰이크 전체를 흉내 내는 정교한 호출까지는 막지 못한다.
> 즉 key는 **"문턱을 크게 높이는 억지력(deterrent)"** 이지 암호학적 차단이 아니다. "단순하게" 처리하는 것이 목적이므로 이 수준을 수용한다.
> 의도적 부하(반복 호출)를 실제로 막는 것은 key가 아니라 **단일 진행 락**이다.

---

## 2. 결정 요약 (grill-me)

| # | 영역 | 결정 |
|---|------|------|
| 1 | 막을 대상 | 인증 사용자의 모달 외 경로 임의 호출 + 의도적 동시 부하 |
| 2 | key 발급 시점 | 모달 "가져오기" 확인 클릭 순간 발급 → **즉시 import** (back-to-back, 하나의 메서드) |
| 3 | key 바인딩 | `(year, month)` — 발급 시 지정한 월의 import 에만 사용 가능 |
| 4 | key 저장소 | sales-rader **인메모리 Map** (단일 인스턴스 전제), 검증 즉시 삭제(**1회용 소멸**) |
| 5 | TTL | **60초** — 정상 key 는 그 전에 소멸. 60초는 "발급됐으나 import 가 끝내 오지 않은 **버려진 key** 청소용 안전망" |
| 6 | key 거부 신호 | **HTTP 419** + body `code: "INVALID_IMPORT_KEY"` (메시지 문자열 매칭 아닌 code 분기) |
| 7 | 부하 방어 | **단일 진행 락** — 범위 **affiliation(조직) 단위**. 진행 중 신규 요청 거부 |
| 8 | 락 충돌 신호 | **HTTP 409** + body `code: "IMPORT_IN_PROGRESS"` |
| 9 | 메서드 위치 | front `src/lib/api/sales.ts` 의 `importSales` 내부에서 [issue-key → import] 연속 호출 |
| 10 | Bizzle 차단 주체 | **백엔드** — sales-rader 가 import 진입 즉시 key·락 검증, 실패 시 **Bizzle 호출 전에** 에러 반환. front 는 alert 만 |

---

## 3. 흐름

```
[모달 "가져오기" 확인 클릭]
      │  (front: importSales 하나의 메서드)
      ▼
① POST /api/v1/sales/import-key      body: { year, month }
      │   ← sales-rader: 1회용 key 생성, Map 에 { key → (year, month, expiresAt=now+60s) } 저장, { key } 반환
      ▼
② POST /api/v1/sales/import          header: X-Sales-Import-Key: <key>
      │                              body:   { year, month, loginId, loginPw }
      │
      ▼ sales-rader 진입부, Bizzle 건드리기 전에 순서대로 검사:
        1. key 검증: 존재 · 미만료(≤60s) · (year, month) 일치
              실패 → 419 { code: "INVALID_IMPORT_KEY" }   (Bizzle 호출 안 함)
        2. key 즉시 delete (1회용 소멸)
        3. 진행 락 확인 (affiliation 단위): 이미 진행 중
              → 409 { code: "IMPORT_IN_PROGRESS" }        (Bizzle 호출 안 함)
        4. 락 설정 → Bizzle 로그인·스크래핑(수 분) → 저장 → 완료 시 **반드시 락 해제(finally)**
      ▼
   기존 SalesImportResponse 반환
```

---

## 4. API 계약 (백엔드 ↔ 프론트)

### ① 신규: `POST /api/v1/sales/import-key`
- 인증: 기존과 동일 (Bearer + affiliation 헤더, 인터셉터 자동)
- Request body: `{ "year": number, "month": number }`
- Response: 기존 envelope 준수 → `{ "data": { "key": string } }`
- key 는 추측 불가한 난수(예: UUIDv4 / 32+ bytes base64url)

### ② 변경: `POST /api/v1/sales/import`
- 추가 요청 헤더: `X-Sales-Import-Key: <key>` (필수)
- Request body: 기존 그대로 `{ year, month, loginId, loginPw }`
- 신규 에러 응답:
  - `419` `{ "code": "INVALID_IMPORT_KEY", "message": "..." }` — key 없음/만료/불일치/재사용
  - `409` `{ "code": "IMPORT_IN_PROGRESS", "message": "..." }` — 동일 affiliation import 진행 중
- 성공 응답: 기존 `SalesImportResponse` 불변

---

## 5. 변경 / 불변

### 변경
- 백엔드: `import-key` 엔드포인트 신규, 인메모리 key store(TTL 60s, 1회용)
- 백엔드: `/import` 진입부에 key 검증 → 소멸 → affiliation 단위 진행 락 → finally 해제
- 프론트: `src/lib/api/sales.ts` `importSales` — issue-key 호출 후 받은 key 를 헤더에 넣어 import 호출
- 프론트: `DailySales.tsx` `handleImport` 에러 분기에 `INVALID_IMPORT_KEY` / `IMPORT_IN_PROGRESS` 전용 alert 추가

### 불변
- 인증 방식(Bearer + affiliation), import body 시그니처(`year/month/loginId/loginPw`)
- import 타임아웃(310s), 자격증명 비저장 정책, 부분 수집 판별 로직
- 일/월별 조회 화면·조회 API

---

## 6. 프론트 변경 상세

### `src/lib/api/sales.ts`
- `importSales(year, month, loginId, loginPw)` 내부:
  1. `const { key } = (await api.post('/api/v1/sales/import-key', { year, month })).data.data`
  2. 기존 import 호출에 `headers: { 'X-Sales-Import-Key': key }` 추가
- issue-key 단계 실패(네트워크 등)는 "잘못된 방식"이 아니라 일반 오류로 처리되도록 주의

### `DailySales.tsx` `handleImport` catch 분기
- `INVALID_IMPORT_KEY` → `await alert('잘못된 데이터 가져오기 방식입니다.')`
- `IMPORT_IN_PROGRESS` → `await alert('이미 데이터 가져오기가 진행 중입니다. 잠시 후 다시 시도해주세요.')`
- 타임아웃 / 자격증명 오류 등 → 기존 분기 유지
- 분기 키는 응답 body 의 `code` 필드 (HTTP status 보조)

---

## 7. 미결 / 리스크 (백엔드 협의 필요)

1. **기존 동시 호출 가드와의 통합** — 자격증명 캐시 재설계 문서(line 56)에 이미 `ConcurrentHashMap` 동시 호출 가드가 언급됨.
   본 spec 의 "affiliation 단위 진행 락"이 그것과 동일/중복인지, 범위(member_id vs affiliation)가 일치하는지 백엔드와 확인 후 통합한다.
2. **단일 인스턴스 전제** — 인메모리 key store·락은 sales-rader 가 단일 인스턴스일 때만 유효.
   추후 다중 인스턴스로 확장 시 공유 저장소(Redis 등)로 교체 필요. (요구사항으로 명시)
3. **419 상태코드 채택** — 비표준(Twitter 유래)이지만 "토큰 만료" 의미로 관례적 사용. 사내 공통 에러 핸들러/인터셉터가 419 를 401 처럼
   강제 로그아웃 처리하지 않는지 확인 필요. 문제가 있으면 403 으로 대체.
4. **issue-key 자체 남용** — issue-key 는 Bizzle 을 건드리지 않아 비용이 낮지만, 무한 발급 시 메모리 증가 여지.
   TTL 60s 만료 청소로 상한이 잡히나, 필요 시 issue-key 에도 가벼운 rate-limit 검토.

---

## 8. 다음 단계
1. 백엔드팀과 §4 API 계약 + §7 미결 항목 합의
2. 백엔드 ①②③ 구현
3. 프론트 §6 구현 (백엔드 엔드포인트 준비 후 통합 검증)
4. `pnpm lint` / 타입체크 / 빌드체크
