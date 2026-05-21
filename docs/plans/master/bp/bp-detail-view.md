# BP 상세 조회 페이지 개발 계획

## 개요

BP Master 목록에서 행 클릭 시 이동하는 상세 조회 페이지

- **라우트**: `/app/(sub)/master/bp/[id]/page.tsx`
- **Location**: `title='Business Partner 상세'`, `list={['Home', '파트너 정보 관리', 'Business Partner 상세']}`
- **참조 UI**: pub `MasterDetailData.tsx` (slidebox-wrap 패턴)
- **API**: `GET /api/master/bp/{id}` (기존 `useBpDetail` 훅 활용)

---

## 결정 사항

| # | 항목 | 결정 |
|---|------|------|
| 1 | 라우트 경로 | `/master/bp/[id]` |
| 2 | Partner Function 표시 조건 | 조회 중인 BP의 `organizationType === 'HEAD_OFFICE'`인 경우에만 표시 |

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| - | 초기 상세 조회 페이지 구현 |
| - | 등록/수정 정보 섹션 제거, 버튼 순서 변경 (수정-삭제-목록) |
| - | LNB 로고 이미지 표시, 검색 조건 유지 (Zustand), 수정 제한 (상담중+미가입) |
| - | 운영여부에 본사/가맹점 표시, 분류 정보 bpClassification(BPTYP) 사용 |
| 2026-03-10 | 삭제 기능 추가 (확인 다이얼로그 + API 호출 + invitation PENDING→EXPIRED) |
| 2026-05-21 | **재초대 메일/알림톡 재발송 버튼 추가** — 상담중(BPOPR_001) + 미가입(PENDING) 조건일 때만 노출. 5분 idempotency. §"재초대 발송" 섹션 참조 |
| 2026-05-21 | **Boston Code Review front 반영** — `useResendBpInvitation`에 `onSuccess` invalidate 추가 (sentAt stale 방지) + alert 메시지 "초대 메일/알림톡이 재발송되었습니다." (두 채널 안내) |

---

## 재초대 발송 (2026-05-21)

### 노출 조건
- `bp.bpoprType === 'BPOPR_001'` (상담중) **AND** `bp.invitationStatus === 'PENDING'`
- 조건 미충족 시 버튼 자체 미렌더 (disabled 아님)

### 동작
- 버튼 클릭 → confirm 다이얼로그 ("초대 메일을 다시 발송하시겠습니까?")
- 확인 시 `POST /api/master/bp/{id}/resend-invitation` 호출
- 성공: alert "초대 메일이 발송되었습니다." (알림톡은 best-effort 동시 발송 — 사용자에게는 메일 기준으로만 안내)
- 실패: alert(getErrorMessage(error))
  - 5분 이내 재발송 시 429 응답 → "잠시 후 다시 시도해 주세요." (백엔드 ErrorCode 메시지 사용)

### 위치
- 섹션 1 슬라이드박스 헤더 버튼 영역: `[수정] [삭제]` 사이에 `[초대 메일 재발송]` (조건부 노출)

### 백엔드 정합
- 관련 API plan: `whale-erp-api/docs/plans/master-bp-2026-05-21-invitation-mail-alimtalk.md` §16
- 메일/알림톡 발송 헬퍼는 `BpService.inviteFranchise` 와 동일 — 신규 등록 vs 재발송만 분기, 본문/템플릿 동일

---

## UI 구조

### 섹션 1: Business Partner Header (slidebox-wrap)

```
┌─────────────────────────────────────────────────────────────┐
│ slidebox-header: "Business Partner 정보"  [수정] [재발송*] [삭제] [목록] [▲] │
│                                            * BPOPR_001+PENDING 일 때만        │
├─────────────────────────────────────────────────────────────┤
│ slidebox-body > detail-data-wrap                             │
│ ┌──────────────────┬────────────────────────────────────────┐│
│ │ 운영여부          │ 운영                                   ││
│ ├──────────────────┼────────────────────────────────────────┤│
│ │ BP 정보           │ BP명 | BP코드 | 브랜드명 | 사업자등록번호 ││
│ │                   │ 주소 | 상세주소                         ││
│ ├──────────────────┼────────────────────────────────────────┤│
│ │ 대표자 정보       │ 대표자명 | 휴대폰번호 | 이메일           ││
│ ├──────────────────┼────────────────────────────────────────┤│
│ │ 분류 정보         │ PF타입 | BP타입                         ││
│ ├──────────────────┼────────────────────────────────────────┤│
│ │ LNB 로고          │ 확장로고파일명 | 축소로고파일명           ││
│ └──────────────────┴────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 섹션 2: Partner Function (HEAD_OFFICE일 때만 표시)

```
┌─────────────────────────────────────────────────────────────┐
│ slidebox-header: "Partner Function"                    [▲]   │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────┬────────────────────────────────────────┐│
│ │ 본사              │ (운영상태) 본사명 | 본사 BP코드          ││
│ ├──────────────────┼────────────────────────────────────────┤│
│ │ Bill to Party     │ 가맹점 목록 (pfList 기반)               ││
│ └──────────────────┴────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

*(등록/수정 정보 섹션 제거됨)*

---

## 삭제 기능 상세 설계

### 동작 흐름

1. 삭제 버튼 클릭 → `confirm('정말 삭제하시겠습니까?')` 다이얼로그 표시
2. 확인 → `DELETE /api/master/bp/{id}` 호출
3. 성공 → `alert('삭제되었습니다.')` → 목록 페이지(`/master/bp`)로 이동
4. 실패 → `alert(에러메시지)` 표시

### API 분석 (기존 구현)

- **Endpoint**: `DELETE /api/master/bp/{id}` → 204 No Content
- **처리 순서**: ID 검증 → 대상 수집(본사면 가맹점 포함) → 프로모션 검증 → 연관 엔티티 soft delete
- **invitation 처리**: `expireBpInvitation(id)` 이미 구현됨 — `inviterBp.id == bp.id && status == PENDING` → `EXPIRED`로 변경
- **결론**: API 측에는 이미 PENDING→EXPIRED 처리가 포함되어 있음. 프론트엔드만 구현하면 됨.

### 프론트엔드 구현 범위

| # | 작업 | 파일 |
|---|------|------|
| 1 | `useDeleteBp` mutation 훅 추가 | `src/hooks/queries/use-bp-queries.ts` |
| 2 | 삭제 핸들러 구현 (confirm → delete → alert → navigate) | `src/components/master/bp/BpDetailView.tsx` |
| 3 | AlertProvider가 root layout에 연결되어 있는지 확인 | `src/app/(sub)/layout.tsx` 등 |

### 확인 다이얼로그 패턴

기존 `useAlert()` 훅 사용 (MenuDetail.tsx 패턴 참조):
```typescript
const { alert, confirm } = useAlert()

const handleDelete = async () => {
  const confirmed = await confirm('정말 삭제하시겠습니까?')
  if (!confirmed) return
  try {
    await deleteBp(id)
    await alert('삭제되었습니다.')
    router.push('/master/bp')
  } catch (error) {
    await alert(getErrorMessage(error, '삭제에 실패했습니다.'))
  }
}
```

---

## 파일 구조

```
src/
├── app/(sub)/master/bp/[id]/
│   └── page.tsx                              # 래퍼
├── components/master/bp/
│   └── BpDetailView.tsx                      # 상세 조회 컴포넌트
├── hooks/queries/
│   └── use-bp-queries.ts                     # useDeleteBp 추가
├── stores/
│   └── bp-search-store.ts                    # 검색 조건 유지 store
```

---

## 구현 순서

| # | 작업 | 상태 |
|---|------|------|
| 1 | `BpDetailView.tsx` 작성 | ✅ 완료 |
| 2 | `page.tsx` 생성 (`/master/bp/[id]`) | ✅ 완료 |
| 3 | `BpMasterManage.tsx` 행 클릭 경로 수정 | ✅ 완료 |
| 4 | 등록/수정 정보 섹션 제거, 버튼 재배치 | ✅ 완료 |
| 5 | LNB 로고 이미지 표시 | ✅ 완료 |
| 6 | 검색 조건 유지 (Zustand store) | ✅ 완료 |
| 7 | 수정 제한 (상담중+미가입 시 수정 버튼 숨김) | ✅ 완료 |
| 8 | 운영여부에 본사/가맹점 표시 | ✅ 완료 |
| 9 | 분류 정보 bpClassification(BPTYP) 사용 | ✅ 완료 |
| 10 | AlertProvider 연결 확인 | ✅ 이미 연결됨 (`(sub)/layout.tsx`) |
| 11 | `useDeleteBp` mutation 훅 추가 | ✅ 완료 |
| 12 | 삭제 핸들러 구현 (confirm + API + alert + navigate) | ✅ 완료 |
| 13 | `pnpm lint` + `pnpm build` 체크 | ✅ 통과 |
