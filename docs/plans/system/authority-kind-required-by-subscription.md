# 권한 종류 필수 조건 변경 — 작업자 인계서

> 경로: `/system/authority/[id]` (수정) 및 `/system/authority/create` (생성)
> 작성일: 2026-05-18

## 문제 정의

`/system/authority/[id]` 수정 화면에서 PLATFORM owner 권한일 때, **구독권한 여부와 무관하게** `권한 종류`가 무조건 필수가 되어 있음. 구독권한이 ON일 때만 필수가 되도록 정책을 변경해야 함.

## 현재 동작 vs 의도된 동작

| 조건 | 현재 | 변경 후 |
|---|---|---|
| PLATFORM owner + 구독 ON | 권한종류 필수 | 권한종류 필수 (동일) |
| PLATFORM owner + 구독 OFF | **권한종류 필수** | 권한종류 선택, `*` 미표시, `undefined`로 송신 |
| BP context (본사/가맹점 owner, 환경설정 경로) | 현재 정책 유지 | 현재 정책 유지 |

## 결정 사항

- **송신 정책**: 구독 OFF인 경우 `authority_kind`는 `undefined`로 송신 (BE에 키 누락)
- **적용 모드**: create / edit 양쪽 모두 동일 적용

## 수정 대상 파일 (3곳 동시 변경 — SSOT 정합 필수)

### 1. 가시 조건 정의
**`src/lib/authority-visibility.ts`** — `isKindRowVisible`
- 현재: `context === 'bp' || ownerCode === PLATFORM_OWNER_CODE`
- 변경: `is_subscription` 인자를 추가하고 PLATFORM owner는 `is_subscription === true`일 때만 노출
- BP context 분기는 그대로 유지 (기존 정책 보존)

### 2. 폼 검증
**`src/hooks/use-authority-form.ts`**
- `validateForm(...)` 호출부에 `formData.is_subscription` 전달
- `handleSave()` 내 `kindRowVisible` 계산도 동일 인자로 평가
- payload 매핑부 (create 약 `300-308`줄, edit 약 `345-351`줄)
  - `kindRowVisible === false`이고 PLATFORM owner이면 `authority_kind: undefined` 송신
  - **본사/가맹점 owner는 기존대로 `PRKND_002` 자동 매핑 유지** (정책 변경 아님)

### 3. UI 렌더 (필수 표시 + 노출)
**`src/components/system/authority/AuthorityForm.tsx`**
- `showKindRow` 계산에 `formData.is_subscription` 전달
- 헤더 `<span class="red">*</span>` (약 `283-284`줄)도 동일 조건으로 표시/비표시
- 구독권한 토글을 OFF로 바꾸는 순간 기존 선택값(`authority_kind`)을 어떻게 할지 결정 필요:
  - 옵션 A: 토글 OFF 시 `authority_kind: undefined`로 리셋 (UX 일관)
  - 옵션 B: 값은 유지하되 검증만 풀어줌 (다시 켜면 이전 선택값 복원)
  - **권장**: A (state 정합성 + 송신값 예측 가능)

## 주의 사항 (회귀 방지)

- `authority-visibility.ts`는 "렌더 가시성"과 "검증 가시성"을 한 곳에서 정의하는 SSOT임. 세 파일이 동일한 인자로 동일한 함수를 호출해야 하며, 한쪽만 바꾸면 **"입력 UI 없는데 필수 에러"** 회귀가 재발함 (기존 주석에 명시되어 있음)
- 수정 모드에서 구독 토글은 `disabled` 상태이므로(`AuthorityForm.tsx:254`), edit 진입 시점의 `is_subscription` 값이 그대로 검증/송신 기준이 됨 — 별도 처리 불필요
- BP context(`/settings/authority/*`)는 이 변경의 영향권 밖. `isKindRowVisible`에서 `context === 'bp'` 분기를 그대로 두면 안전

## 테스트 케이스 (QA 체크리스트)

| # | 시나리오 | 기대 결과 |
|---|---|---|
| 1 | PLATFORM owner, 구독 ON, 권한종류 미선택 → 저장 | 필수 에러 표시 |
| 2 | PLATFORM owner, 구독 ON, 권한종류 선택 → 저장 | 정상 저장, payload에 `authority_kind` 포함 |
| 3 | PLATFORM owner, 구독 OFF → 화면 진입 | 권한종류 row의 `*` 미표시 |
| 4 | PLATFORM owner, 구독 OFF, 권한종류 미선택 → 저장 | 정상 저장, payload에 `authority_kind` 키 누락 |
| 5 | 생성 화면에서 구독 토글 ON↔OFF 전환 | 권한종류 `*`/검증 동기 토글, (옵션 A 선택 시) 선택값 초기화 |
| 6 | 본사 owner 권한 수정 | 기존대로 권한종류 row 숨김, payload는 `PRKND_002` (회귀 없음) |
| 7 | 가맹점 owner 권한 수정 | 기존대로 권한종류 row 숨김, payload는 `PRKND_002` (회귀 없음) |
| 8 | `/settings/authority/*` (BP context) | 권한종류 row 정책 변경 없음 |

## BE 확인 필요 사항

- `AuthorityCreateRequest` / `AuthorityUpdateRequest` 스키마에서 `authority_kind`가 PLATFORM owner + 구독 OFF 케이스에서 `undefined`(키 누락) 수신을 정상으로 처리하는지 확인. (Zod 스키마 상 `optional`이면 FE는 통과, BE DTO에서도 nullable/optional이어야 함)
