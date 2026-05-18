# BP 등록/수정 폼 개발 계획

## 개요

BP Master 등록 및 수정 화면. 등록과 수정은 동일한 폼 컴포넌트(`BpForm`)를 공유하며, `id` 유무로 모드를 구분한다.

- **등록 라우트**: `/app/(sub)/master/bp/create/page.tsx`
- **수정 라우트**: `/app/(sub)/master/bp/[id]/edit/page.tsx`
- **참조 UI**: pub `MasterEdit.tsx` (slidebox-wrap + default-table 패턴)
- **API**:
  - 등록: `POST /api/master/bp` (multipart/form-data)
  - 수정: `PUT /api/master/bp/{id}` (multipart/form-data)

---

## API 분석

### POST /api/master/bp (등록)

**Controller**: `BpController.createBp()` — 201 CREATED
**Content-Type**: `multipart/form-data`
**Request Parts**:
- `bp` (JSON): `BpSaveRequest`
- `lnbLogoExpandFile` (File, optional): LNB 확장 로고
- `lnbLogoContractFile` (File, optional): LNB 축소 로고

**BpSaveRequest 필드**:

| 필드 | 타입 | 필수 | 검증 | 설명 |
|------|------|------|------|------|
| `id` | Long? | X | - | 등록 시 null |
| `bpoprType` | String | O | 공통코드 존재 | 운영여부 (BPOPR_001/002/003) |
| `pfType` | String | O | 공통코드 존재 | 대표 PF (PF_001=본사, PF_002=가맹점) |
| `companyName` | String | O | NotBlank | 업체명 |
| `brandName` | String? | X | - | 브랜드명 |
| `businessRegistrationNumber` | String | O | 10자리 숫자, 중복체크 | 사업자등록번호 |
| `address1` | String | O | NotBlank | 주소 |
| `address2` | String? | X | - | 상세주소 |
| `representativeName` | String | O | NotBlank | 대표자명 |
| `representativeMobilePhone` | String | O | 01X + 7~8자리 | 대표자 휴대폰 |
| `bpType` | String | O | 공통코드 존재 | BP 타입 (BPTYP) |
| `pfSaveRequest` | List? | X | Valid | Partner Function 목록 |

**PfSaveRequest 필드**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | Long? | X | 등록 시 null |
| `organizationId` | Long? | X | 서비스에서 자동 설정 |
| `partnerBusinessPartnerId` | Long? | X | 파트너 BP ID |

**서비스 흐름 (10단계)**:
1. 공통코드 유효성 검증 (bpoprType, pfType, bpType)
2. pfType → organizationType 자동 결정 (PF_001=본사, PF_002=가맹점)
3. pfSaveRequest → parentOrganizationId 결정 (가맹점이면 첫 번째 PF의 partnerBpId)
4. 사업자등록번호 중복 검증
5. organizationType별 검증 (본사: parent 없어야 함 / 가맹점: parent 필수+본사여야 함)
6. Organization Entity 생성 및 저장
7. 조직코드 자동 생성 (PTN + 6자리 ID)
8. LNB 로고 파일 업로드
9. Partner Function 저장 (양방향 관계)
10. BpResponse 반환

**주요 에러 코드**:
- ERR3002: 사업자등록번호 중복
- ERR3004/3005/3006: 잘못된 공통코드
- ERR3009: 가맹점인데 상위 조직(본사) ID 누락
- ERR3010: 본사인데 상위 조직 설정 시도

---

## UI 구조

### 레이아웃

```
┌─────────────────────────────────────────────────────────────────┐
│ Location: Home > 파트너 정보 관리 > Business Partner 등록(수정)     │
├─────────────────────────────────────────────────────────────────┤
│ slidebox-header: "Business Partner 정보"        [저장] [목록] [▲] │
├─────────────────────────────────────────────────────────────────┤
│ slidebox-body                                                    │
│ ┌── default-table ──────────────────────────────────────────────┐│
│ │ 운영여부 *        │ (radio) 상담중 / 운영 / 종료                 ││
│ │ 대표 PF *         │ (select) PF 공통코드                        ││
│ └───────────────────┴───────────────────────────────────────────┘│
│                                                                  │
│ ┌── slide-table-wrap: "Business Partner 정보" ──────────────────┐│
│ │ Master ID *(등록)  │ (input) + [중복 확인] / 수정 시 readOnly     ││
│ │ 업체명 *          │ (Input showClear)                            ││
│ │ 브랜드명          │ (Input showClear)                            ││
│ │ 사업자등록번호 *  │ (Input type=number, 숫자만)                  ││
│ │ 주소 *            │ (AddressSearch) Daum 우편번호                ││
│ │ 대표자명 *        │ (Input showClear)                            ││
│ │ 대표자 휴대폰 *   │ (Input type=cellphone, 자동포맷)             ││
│ │ BP 타입 *         │ (select) BPTYP 공통코드                     ││
│ │ LNB 로고          │ (ImageUpload) 확장 + 축소, 미리보기          ││
│ └───────────────────┴───────────────────────────────────────────┘│
│                                                                  │
│ ┌── slide-table-wrap: "Partner Function" ───────────────────────┐│
│ │ 본사              │ (SearchSelect) 본사 목록 — 가맹점일 때만    ││
│ │ 가맹점            │ (Input readOnly) `-` — 본사일 때만          ││
│ └───────────────────┴───────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 조건부 표시 규칙

- **Master ID**: 등록 시 입력 가능 (필수 + 중복 확인 버튼 + 검증: 영문/숫자 포함 8자 이상), 수정 시 readOnly
- **Master ID 중복 확인**: `GET /api/auth/check-login-id?loginId={masterId}` 사용, 결과를 Input helpText로 표시
- **Partner Function 섹션**: 대표 PF 선택에 따라 조건부 표시
  - 대표 PF 미선택 → 본사/가맹점 행 모두 숨김
  - 대표 PF = 가맹점(PF_002) → 본사 행만 표시 (SearchSelect, 필수)
  - 대표 PF = 본사(PF_001) → 가맹점 행만 표시 (`-`)
- **운영여부 기본값**: 등록 시 `BPOPR_001`(상담중)
- **LNB 로고**: `ImageUpload` 컴포넌트 사용 (이미지 미리보기 지원)

### 필드별 UI 매핑

| 필드 | UI 컴포넌트 | 비고 |
|------|-------------|------|
| 운영여부 | Radio Button Group (`.radio-wrap`) | BPOPR 공통코드, 기본값: 상담중 |
| 대표 PF | Select (`.select-form`) | PF 공통코드 |
| Master ID | Input + [중복 확인] / readOnly | 등록: 필수입력+중복확인, 수정: readOnly |
| 업체명 | Input (showClear) | 필수 |
| 브랜드명 | Input (showClear) | 선택 |
| 사업자등록번호 | Input (type=number) | 숫자만, 10자리 |
| 주소 | AddressSearch | Daum 우편번호 연동 |
| 대표자명 | Input (showClear) | 필수 |
| 대표자 휴대폰 | Input (type=cellphone) | 자동 포맷팅 (010-1234-1234) |
| BP 타입 | Select (`.select-form`) | BPTYP 공통코드 |
| LNB 로고 | ImageUpload (accept=image/*) | 확장/축소 2개, 미리보기 지원 |
| 본사 (PF) | SearchSelect | 가맹점일 때만 표시 (필수) |
| 가맹점 (PF) | Input readOnly | 본사일 때만 표시 (`-`) |

---

## 타입 정의

### BpFormData (프론트엔드 폼 상태)

```typescript
interface BpFormData {
  bpoprType: string             // 운영여부 (BPOPR_001/002/003)
  pfType: string                // 대표 PF (PF_001/PF_002)
  companyName: string           // 업체명
  brandName: string             // 브랜드명
  businessRegistrationNumber: string  // 사업자등록번호
  address1: string              // 주소
  address2: string              // 상세주소
  representativeName: string    // 대표자명
  representativeMobilePhone: string  // 대표자 휴대폰
  bpType: string                // BP 타입 (BPTYP)
  pfSaveRequest: PfSaveRequest[]     // Partner Function 목록
}

interface PfSaveRequest {
  id?: number
  organizationId?: number
  partnerBusinessPartnerId?: number | null
}
```

---

## 파일 구조

```
src/
├── app/(sub)/master/bp/
│   ├── create/
│   │   └── page.tsx                    # [신규] 등록 래퍼
│   └── [id]/
│       └── edit/
│           └── page.tsx                # [신규] 수정 래퍼
├── components/master/bp/
│   └── BpForm.tsx                      # [신규] 등록/수정 공유 폼 컴포넌트
├── hooks/queries/
│   └── use-bp-queries.ts              # [수정] useCreateBp, useUpdateBp 추가
├── types/
│   └── bp.ts                          # [수정] BpFormData, PfSaveRequest 타입 추가
```

---

## 결정 사항

| # | 항목 | 결정 |
|---|------|------|
| 1 | 등록/수정 공유 | 단일 `BpForm` 컴포넌트, `id` prop 유무로 모드 구분 |
| 2 | 폼 상태 관리 | `useState` (React Compiler 환경에서 가장 안전) |
| 3 | 검증 방식 | 필드별 검증 + 제출 시 전체 검증 (기존 BpInvitationManage 패턴) |
| 4 | 파일 업로드 | `ImageUpload` 컴포넌트 (미리보기 지원) |
| 5 | 주소 검색 | Daum 우편번호 서비스 (기존 프로젝트 패턴 확인 필요) |
| 6 | API Content-Type | `multipart/form-data` (bp JSON + 파일 2개) |
| 7 | Partner Function | 대표 PF에 따라 조건부 표시: 가맹점→본사(SearchSelect), 본사→가맹점(`-`), 미선택→숨김 |
| 8 | Master ID 중복 확인 | `GET /api/auth/check-login-id` 사용, 결과를 Input helpText로 표시 |
| 9 | Master ID 검증 | 영문+숫자 포함 8자 이상, 중복 확인 전/저장 전 양쪽에서 검증 |
| 10 | 상세 조회 분류 정보 | `bpType` 필드 사용 (`bpClassification` 아님), BpResponse에서 제거 |

---

## 구현 순서

| # | 작업 | 상태 |
|---|------|------|
| 1 | `bp.ts`에 `BpFormData`, `BpPfSaveRequest` 타입 추가 | ✅ 완료 |
| 2 | `use-bp-queries.ts`에 `useCreateBp`, `useUpdateBp` mutation 훅 추가 | ✅ 완료 |
| 3 | `BpForm.tsx` 폼 컴포넌트 작성 (pub MasterEdit 패턴 참조) | ✅ 완료 |
| 4 | `/master/bp/create/page.tsx` 등록 라우트 생성 | ✅ 완료 |
| 5 | `/master/bp/[id]/edit/page.tsx` 수정 라우트 생성 | ✅ 완료 |
| 6 | 폼 검증 로직 구현 | ✅ 완료 |
| 7 | 파일 업로드 연동 (LNB 로고) | ✅ 완료 |
| 8 | Partner Function 동적 UI 구현 | ✅ 완료 |
| 9 | Master ID 중복 확인 (`/api/auth/check-login-id`) + 검증 (영문/숫자 8자 이상) | ✅ 완료 |
| 10 | LNB 로고 → `ImageUpload` (미리보기 지원) | ✅ 완료 |
| 11 | Partner Function 조건부 표시 (대표 PF 기준) + 본사 `SearchSelect` | ✅ 완료 |
| 12 | 상세 조회 분류 정보 `bpClassification` → `bpType` 수정 + API `BpResponse` 정리 | ✅ 완료 |
| 13 | `pnpm lint` + `pnpm build` + API 테스트 통과 | ✅ 통과 |
