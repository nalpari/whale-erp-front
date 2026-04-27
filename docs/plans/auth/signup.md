# 회원가입 (Signup) 기능

## 개요

BP 사용자가 직접 회원가입할 수 있는 공개 페이지를 구현한다.
`whale-erp-pub`의 signup UI를 차용하여 6단계 스텝 플로우로 진행한다.

- **경로**: `(public)/signup` → URL: `/signup`
- **레이아웃**: 기존 `(public)/layout.tsx` (BeforeHeader + BeforeFooter)
- **미들웨어**: `/signup`이 이미 `PUBLIC_PATHS`에 등록되어 있어 수정 불필요

---

## 결정 사항

| # | 항목 | 결정 |
|---|------|------|
| 1 | 사업자등록번호 인증 | 국세청 공공데이터 API (`api.odcloud.kr`) — BpInvitationManage와 동일 |
| 2 | 인증 로직 공통화 | 사업자 인증 로직을 공통 훅(`useBusinessVerification`)으로 추출, signup + BpInvitationManage 양쪽 적용 |
| 3 | 초대 코드 검증 | SignupController에 BP 코드 검증 API 추가 (이번 범위 포함) |
| 4 | 초대 가입 시 Step 처리 | 스킵하지 않고 **pre-fill** 처리 (사업자 유형=FRANCHISE 고정, 본사 정보 자동 채움 등) |
| 5 | 초대 코드 전달 경로 | 미정 (이메일/카톡 발송 미구현). DB에서 직접 확인하여 검증 |
| 6 | 본인 인증 | 외부 API 계약 전 → 화면만 작성하고 **bypass 처리** |
| 7 | 주소 검색 | `AddressSearch` 공통 컴포넌트 사용 (Daum 우편번호 서비스) |
| 8 | 결제 연동 | PG사 미선정 → **bypass 처리** |
| 9 | 가입 완료 후 | `/login` 페이지로 이동 |
| 10 | 기존 auth SignupController | 테스트용이므로 삭제, 새 `auth/SignupController`가 대체 (auth 도메인 유지) |
| 11 | organizationCode 생성 | `BpService.generateAndSetOrganizationCode`와 동일 패턴 (`PTN` + 6자리 ID + 중복 검증) |
| 12 | passwordChangeRequired | 사용자가 직접 비밀번호 설정하므로 `false` |
| 13 | SecurityConfig | `/api/signup`, `/api/signup/**`를 PUBLIC_PATHS에 등록 |
| 14 | 영업분류 공통코드 조회 | SignupController에 `GET /api/signup/bptyp-codes` 추가 (비인증, PUBLIC_PATHS 내) |
| 15 | 초대 검증 방식 | `invitation.joinedBp` 의존 제거 → `bpCode`(organizationCode)로 Organization 직접 조회 |
| 16 | openDate | 프론트 국세청 인증용으로만 사용, API 요청/DB 저장 불필요 → SignupRequest에서 제거 |
| 17 | 초대 가입 Step4 | 본사명(readOnly) + 브랜드명(본사 브랜드명 pre-fill, readOnly) |

---

## 가입 경로별 플로우 비교

### 일반 가입 (탭 1: 사업자등록번호)

```
Step1 (사업자 인증)
  → 대표자명 + 개업일자 + 사업자등록번호 → 국세청 API 인증
Step2 (대표자 실명 확인)
  → 인증된 정보 표시 → 본인 인증 (bypass)
Step3 (사업자 유형 선택)
  → 본사/가맹점/일반 중 선택
Step4 (운영 정보 등록)
  → 브랜드명, 주소, 이메일 등 전부 입력
Step5 (마스터 계정 설정)
  → Master ID + 비밀번호 설정 → 가입 완료 → /login 이동
Step6 (구독 결제)
  → bypass
```

### 초대 가입 (탭 2: 초대 코드)

```
Step1 (사업자 인증)
  → BP 코드 입력 → 초대 검증 API 호출
Step2 (대표자 실명 확인)
  → 초대 정보에서 pre-fill (회사명, 사업자번호, 대표자명) → 본인 인증 (bypass)
Step3 (사업자 유형 선택)
  → pre-fill: FRANCHISE 선택됨 (변경 불가, readOnly)
Step4 (운영 정보 등록)
  → pre-fill: 본사명(readOnly) + 기존 Organization 데이터
  → 나머지 필드 입력
Step5 (마스터 계정 설정)
  → Master ID + 비밀번호 설정 → 가입 완료 → /login 이동
Step6 (구독 결제)
  → bypass
```

### 초대 가입 시 pre-fill 데이터

초대 시점에 Organization(FRANCHISE)이 이미 생성되어 있으므로, 검증 API 응답에서 아래 데이터를 받아온다:

| 필드 | pre-fill 소스 | 수정 가능 |
|------|--------------|-----------|
| 회사명 | BpInvitation → joinedBp (Organization) | N (readOnly) |
| 사업자등록번호 | Organization.businessRegistrationNumber | N (readOnly) |
| 대표자명 | Organization.representativeName | N (readOnly) |
| 사업자 유형 | FRANCHISE (확정) | N (readOnly) |
| 본사명 | Organization.parentOrganization.companyName | N (readOnly) |
| 대표자 이메일 | Organization.representativeEmail | Y (수정 가능) |
| 대표자 휴대폰 | Organization.representativeMobilePhone | Y (수정 가능) |

---

## Pub UI 분석 결과

### 전체 플로우 (6단계)

| Step | 화면 | 주요 기능 |
|------|------|-----------|
| 1 | 사업자 인증 | 탭1: 사업자등록번호 인증 / 탭2: 초대 코드 인증 |
| 2 | 대표자 실명 확인 | 인증된 사업자 정보 표시 + 본인 인증 |
| 3 | 사업자 유형 선택 | 프랜차이즈 본사 / 가맹점 / 일반 사업장 |
| 4 | 운영 정보 등록 | 브랜드명, 주소, 이메일, 영업 분류, 로고 |
| 5 | 마스터 계정 설정 | Master ID + 비밀번호 설정 |
| 6 | 구독 결제 | 월별/6개월/연간 플랜 선택 + 결제 |

### Pub 파일 구조

```
whale-erp-pub/src/components/singup/  (디렉토리명 오타 주의)
├── SignupLayout.tsx     # 스텝 오케스트레이터 (useState로 step 관리)
├── SignupStep01.tsx     # 사업자 인증 (탭 2개)
├── SignupStep02.tsx     # 대표자 실명 확인
├── SingupStep03.tsx     # 사업자 유형 선택 (파일명 오타)
├── SignupStep04.tsx     # 운영 정보 등록
├── SignupStep05.tsx     # 마스터 계정 설정
└── SignupStep06.tsx     # 구독 결제
```

### Pub CSS 클래스 (주요)

| 클래스 | 용도 |
|--------|------|
| `sub-wrap`, `sub-wrap-inner` | 전체 래퍼 |
| `sub-wrap-header`, `sub-header-icon` | 상단 고래 아이콘 + 타이틀 |
| `signup-step01-tab-wrap/btn/item` | Step1 탭 UI |
| `signup-form-wrap/header/content` | Step2~5 폼 공통 |
| `signup-bussiness-type-wrap/list/item` | Step3 유형 선택 (3컬럼 grid) |
| `introduction-btn`, `introduction-btn gray` | 네비게이션 버튼 |
| `filed-file`, `file-bx`, `file-list` | 파일 업로드 |
| `subscrip-price-wrap/table` | Step6 구독 테이블 |

---

## 공통화 작업: 사업자 인증

### 현재 상태 (BpInvitationManage)

`BpInvitationManage.tsx`에서 국세청 API를 `axios`로 직접 호출:

```typescript
const BUSINESS_VALIDATE_URL = 'https://api.odcloud.kr/api/nts-businessman/v1/validate'
const BUSINESS_VALIDATE_KEY = '...'

// axios.post로 직접 호출
const response = await axios.post(
  `${BUSINESS_VALIDATE_URL}?serviceKey=${BUSINESS_VALIDATE_KEY}`,
  {
    businesses: [{
      b_no: form.businessRegistrationNumber,  // 사업자등록번호
      start_dt: form.startDate,                // 개업일자 (YYYYMMDD)
      p_nm: form.representativeName,           // 대표자명
    }],
  }
)
const result = response.data?.data?.[0]
// result.valid === '01' → 유효
```

### 공통 훅 추출

```
src/hooks/queries/use-business-verification.ts  (신규)
```

```typescript
interface BusinessVerificationInput {
  businessRegistrationNumber: string  // 10자리 숫자
  startDate: string                   // YYYYMMDD
  representativeName: string
}

interface BusinessVerificationResult {
  isValid: boolean
  rawResult: unknown
}

export const useBusinessVerification = () => {
  // mutation으로 구현
  // 검증 로직 (10자리 숫자, 개업일자, 대표자명 빈값 체크) 포함
  // 반환: { mutateAsync, isPending, ... }
}
```

### 적용 범위

1. **BpInvitationManage.tsx** — 기존 인라인 로직을 공통 훅으로 교체
2. **SignupStep01.tsx** — 공통 훅 사용

---

## API 설계

### 초대 코드 검증 API (신규 — SignupController)

```
GET /api/signup/verify-invitation?bpCode={bpCode}
```

**요청**: bpCode (organizationCode, 예: `PTN000023`)

**응답 200 OK**:
```json
{
  "code": "SUCCESS",
  "data": {
    "bpCode": "PTN000023",
    "invitationStatus": "PENDING",
    "companyName": "가맹점A",
    "businessRegistrationNumber": "1234567890",
    "representativeName": "홍길동",
    "representativeEmail": "hong@example.com",
    "representativeMobilePhone": "01012345678",
    "headOfficeName": "본사A",
    "headOfficeId": 1,
    "organizationId": 23
  }
}
```

**에러 케이스**:
- bpCode가 존재하지 않음 → 400
- invitationStatus가 PENDING이 아님 (이미 수락/만료/거절) → 400
- 해당 Organization이 이미 Member가 연결된 경우 → 400

**서버 로직**:
1. bpCode로 BpInvitation 조회
2. invitationStatus === PENDING 확인
3. BpInvitation → joinedBp(Organization) 정보 반환
4. Organization.parentOrganization (본사) 정보 포함

### 회원가입 완료 API (신규 — SignupController)

```
POST /api/signup
```

**요청**:
```json
{
  "verificationMethod": "business-number",
  "businessRegistrationNumber": "1234567890",
  "representativeName": "홍길동",
  "openDate": "20200101",
  "businessType": "HEAD_OFFICE",
  "mainMenu": "커피",
  "brandName": "브랜드A",
  "address1": "서울시 강남구 테헤란로 123",
  "address2": "5층",
  "email": "brand@example.com",
  "businessCategory": "FOOD_001",
  "masterId": "masterid001",
  "password": "NewPass1234!",
  "bpCode": null,
  "logoFile": null
}
```

**초대 가입 시 추가 필드**:
```json
{
  "verificationMethod": "invitation-code",
  "bpCode": "PTN000023",
  ...
}
```

**서버 로직 — 일반 가입**:
1. masterId 중복 체크
2. 사업자등록번호 중복 체크
3. Organization 생성
4. Member 생성 (loginId=masterId, passwordHash=encode(password))
5. MemberDetail 생성 (organization 연결)

**서버 로직 — 초대 가입**:
1. bpCode로 BpInvitation 조회 + PENDING 확인
2. masterId 중복 체크
3. 기존 Organization 업데이트 (추가 정보 반영)
4. Member 생성
5. MemberDetail 생성 (기존 Organization 연결)
6. BpInvitation.invitationStatus → ACCEPTED
7. BpInvitation.acceptedAt → 현재 시각

### 전체 API 목록

| # | 엔드포인트 | 메서드 | 용도 | Step | 상태 |
|---|-----------|--------|------|------|------|
| 1 | `api.odcloud.kr/.../validate` | POST | 사업자등록번호 인증 (국세청) | 1 | 기존 API |
| 2 | `/api/signup/verify-invitation` | GET | 초대 코드 검증 + 정보 반환 | 1 | **신규 (API)** |
| 3 | 본인 인증 외부 API | - | 대표자 본인 인증 | 2 | **bypass** |
| 4 | `/api/auth/check-login-id` | GET | Master ID 중복 확인 | 5 | 기존 API |
| 5 | `/api/signup` | POST | 회원가입 완료 (일반/초대 공통) | 5 | **신규 (API)** |
| 6 | `/api/subscription/plans` | GET | 구독 플랜 목록 조회 | 6 | 백엔드 확인 필요 |
| 7 | 결제 PG API | - | 구독 결제 | 6 | **bypass** |

---

## 구현 계획

### Step별 상세 필드

#### Step 1: 사업자 인증

**탭 1 — 사업자등록번호로 가입**
| 필드 | 타입 | 필수 | 검증 |
|------|------|------|------|
| 대표자 성명 | text | Y | 빈값 체크 |
| 개업일자 | text | Y | 날짜 형식 |
| 사업자등록번호 | text | Y | 숫자 10자리 + 국세청 API 인증 |
| 사업자등록증 | file | N | FileUpload 공통 컴포넌트 (Drag & Drop) + Claude Vision OCR 자동 채움 |

**탭 2 — 초대 코드로 가입**
| 필드 | 타입 | 필수 | 검증 |
|------|------|------|------|
| BP 코드 | text | Y | `GET /api/signup/verify-invitation` 호출 |

→ 탭1: "인증하기" 버튼 → `useBusinessVerification` 훅 호출 → Step 2 이동
→ 탭2: "인증하기" 버튼 → 초대 검증 API 호출 → 응답 데이터로 폼 pre-fill → Step 2 이동

#### Step 2: 대표자 실명 확인

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| 회사명 | text | - | readOnly (일반: Step1 입력값 / 초대: API 응답값) |
| 사업자등록번호 | text | - | readOnly |
| 대표자 | text | - | readOnly |

→ "본인 인증" 버튼 → **bypass 처리** → Step 3 이동

#### Step 3: 사업자 유형 선택

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| 사업자 유형 | radio | Y | 프랜차이즈 본사 / 가맹점 / 일반 사업장 |
| 대표 메뉴 | text | N | ex) 커피 |

- **일반 가입**: 자유롭게 선택
- **초대 가입**: FRANCHISE pre-fill + readOnly (변경 불가)

→ "다음으로 이동" / "가입 취소" (→ /main)

#### Step 4: 운영 정보 등록

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| 본사 | text | N | readOnly (초대 가입 시 자동 채움) |
| 브랜드명 | text | Y | |
| 주소 | AddressSearch | Y | `AddressSearch` 공통 컴포넌트 사용 (Daum 우편번호) |
| 이메일 | text | Y | 이메일 형식 검증 (초대 시 pre-fill, 수정 가능) |
| 영업 분류 | select | Y | 공통코드 API 조회 |
| 로고 | file | N | 파일 업로드 |

→ "다음으로 이동" / "이전으로 이동"

#### Step 5: 마스터 계정 설정

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| Master ID | text | Y | 영문+숫자 8자 이상, 중복 체크 (GET `/api/auth/check-login-id`) |
| 비밀번호 | password | Y | 영문+숫자+특수문자 8자 이상 |
| 비밀번호 확인 | password | Y | 비밀번호 일치 확인 |

→ "가입 완료" → `POST /api/signup` 호출 → **`/login` 페이지로 이동**
→ "이전으로 이동"

#### Step 6: 구독 결제

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| 구독 플랜 | radio | Y | 월별 / 6개월 / 연간 |

→ "구독 결제하기" → **bypass 처리** (PG사 미선정)

---

## 파일 구조

### API (`whale-erp-api`) — 기존 auth 도메인에 추가

```
src/main/kotlin/.../domain/auth/
├── controller/
│   ├── AuthController.kt                 # 기존 인증 API
│   └── SignupController.kt               # GET /api/signup/verify-invitation, POST /api/signup
├── service/
│   ├── AuthService.kt                    # 기존 인증 서비스
│   └── SignupService.kt                  # 초대 검증, 회원가입 처리 로직
└── dto/
    ├── SignupRequest.kt                   # 회원가입 요청 DTO
    ├── SignupResponse.kt                  # 회원가입 완료 응답 DTO
    └── InvitationVerifyResponse.kt        # 초대 검증 응답 DTO
```

### Front (`whale-erp-front`)

```
src/
├── app/(public)/signup/
│   └── page.tsx                                    # 진입점 (SignupLayout 렌더링)
├── components/signup/
│   ├── SignupLayout.tsx                             # 스텝 오케스트레이터
│   ├── SignupStep01.tsx                             # 사업자 인증 (탭1: 국세청 / 탭2: 초대코드)
│   ├── SignupStep02.tsx                             # 대표자 실명 확인 (bypass)
│   ├── SignupStep03.tsx                             # 사업자 유형 선택 (초대 시 pre-fill)
│   ├── SignupStep04.tsx                             # 운영 정보 등록 (AddressSearch, 초대 시 pre-fill)
│   ├── SignupStep05.tsx                             # 마스터 계정 설정 + 가입 완료
│   └── SignupStep06.tsx                             # 구독 결제 (bypass)
├── types/
│   └── signup.ts                                    # 회원가입 타입 정의
├── lib/schemas/
│   └── signup.ts                                    # Zod 스키마 (각 Step별 폼 검증)
└── hooks/queries/
    ├── use-business-verification.ts                 # 사업자 인증 공통 훅 (신규)
    └── use-signup-queries.ts                        # 회원가입 API 훅 (신규)
```

### 수정 대상

```
src/components/master/bp/BpInvitationManage.tsx      # 인라인 인증 로직 → 공통 훅 교체
```

---

## 상태 관리 전략

### 스텝 간 데이터 전달

스텝 전환 시 이전 스텝의 데이터를 유지해야 하므로, `SignupLayout`에서 전체 폼 데이터를 관리한다.

```typescript
interface SignupFormData {
  // Step 1
  verificationMethod: 'business-number' | 'invitation-code'
  representativeName: string
  openDate: string
  businessRegistrationNumber: string
  businessRegistrationFile?: File
  invitationCode: string  // BP 코드 (탭2)

  // Step 1 탭2 → API 응답으로 채워지는 초대 정보
  invitationData?: InvitationVerifyResponse  // 초대 검증 API 응답 전체

  // Step 2 (표시용)
  companyName: string

  // Step 3
  businessType: 'HEAD_OFFICE' | 'FRANCHISE' | 'GENERAL'
  mainMenu: string

  // Step 4
  brandName: string
  address: AddressData   // AddressSearch 공통 컴포넌트 타입
  email: string
  businessCategory: string
  logoFile?: File

  // Step 5
  masterId: string
  password: string
}
```

- **서버 상태 (TanStack Query)**: 사업자 인증 (`useBusinessVerification`), 초대 검증, 공통코드, 구독 플랜 등
- **클라이언트 상태 (useState)**: 폼 데이터, 현재 스텝, 검증 에러

---

## 스타일 전략

- Pub 프로젝트의 CSS 클래스명 (`sub-wrap`, `signup-*`, `introduction-btn` 등)을 그대로 사용
- 기존 `src/styles/` 안의 Sass에 이미 정의된 클래스가 있는지 확인 후:
  - **있으면**: 기존 클래스 활용
  - **없으면**: Tailwind 클래스 또는 컴포넌트 내 인라인 스타일로 처리
- CLAUDE.md 규칙: "기존 CSS/Sass 파일 수정 금지"

---

## Pub → Front 마이그레이션 시 주의사항

| 항목 | Pub 상태 | Front 구현 시 변경 |
|------|----------|-------------------|
| 디렉토리명 | `singup` (오타) | `signup` (정상) |
| 파일명 | `SingupStep03.tsx` (오타) | `SignupStep03.tsx` |
| 비밀번호 input | `type="text"` | `type="password"` |
| 라디오 id | 중복 (`radio-box`) | 고유 id 부여 |
| 라디오 active | `act` 클래스 하드코딩 | state 연동 |
| select 옵션 | 빈 option만 | 공통코드 API 연동 |
| `'use client'` | 일부 누락 | 모든 스텝에 추가 |
| 주소 검색 | 직접 구현 (input + 버튼) | `AddressSearch` 공통 컴포넌트 사용 |

---

## 구현 순서

### Phase 1: 공통화 + 기반 작업

| # | 작업 | 범위 | 상태 |
|---|------|------|------|
| 1 | 사업자 인증 공통 훅 추출 (`use-business-verification.ts`) | Front | ✅ 완료 |
| 2 | BpInvitationManage 인라인 로직 → 공통 훅 교체 | Front | ✅ 완료 |
| 3 | 타입 정의 (`types/signup.ts`) | Front | ✅ 완료 |
| 4 | Zod 스키마 (`lib/schemas/signup.ts`) | Front | ✅ 완료 |

### Phase 2: API (백엔드)

| # | 작업 | 범위 | 상태 |
|---|------|------|------|
| 5 | SignupController + SignupService 신규 생성 (auth 도메인) | API | ✅ 완료 |
| 6 | `GET /api/signup/verify-invitation` — 초대 코드 검증 | API | ✅ 완료 |
| 7 | `POST /api/signup` — 회원가입 완료 (일반/초대 공통) | API | ✅ 완료 |
| 8 | 초대 가입 시 BpInvitation 상태 업데이트 (PENDING → ACCEPTED) | API | ✅ 완료 |

### Phase 3: Front 화면

| # | 작업 | 범위 | 상태 |
|---|------|------|------|
| 9 | 회원가입 API 훅 (`hooks/queries/use-signup-queries.ts`) | Front | ✅ 완료 |
| 10 | 라우트 페이지 (`app/(public)/signup/page.tsx`) | Front | ✅ 완료 |
| 11 | SignupLayout 컴포넌트 (스텝 관리 + 폼 데이터 관리) | Front | ✅ 완료 |
| 12 | SignupStep01 — 사업자 인증 (탭1: 공통 훅 / 탭2: 초대 검증 API) | Front | ✅ 완료 |
| 13 | SignupStep02 — 대표자 실명 확인 (bypass) | Front | ✅ 완료 |
| 14 | SignupStep03 — 사업자 유형 선택 (초대 시 FRANCHISE pre-fill + readOnly) | Front | ✅ 완료 |
| 15 | SignupStep04 — 운영 정보 등록 (AddressSearch, 초대 시 pre-fill) | Front | ✅ 완료 |
| 16 | SignupStep05 — 마스터 계정 설정 + 가입 완료 → /login 이동 | Front | ✅ 완료 |
| 17 | SignupStep06 — 구독 결제 (bypass) | Front | ✅ 완료 |

### Phase 4: 검증

| # | 작업 | 범위 | 상태 |
|---|------|------|------|
| 18 | 스타일 확인 및 적용 | Front | ✅ 완료 |
| 19 | `pnpm lint` + `pnpm build` 체크 | Front | ✅ 완료 |

### Phase 5: 사업자등록증 OCR + Drag & Drop

| # | 작업 | 범위 | 상태 |
|---|------|------|------|
| 20 | SignupStep01 "손쉽게 가입하기" — FileUpload 공통 컴포넌트 적용 (Drag & Drop) | Front | ✅ 완료 |
| 21 | useBusinessLicenseOcr 연동 — OCR 결과를 폼 필드에 자동 채움 | Front | ✅ 완료 |
| 22 | `pnpm lint` + `pnpm build` 체크 | Front | ✅ 완료 |

### Phase 6: 영업분류 Public API

| # | 작업 | 범위 | 상태 |
|---|------|------|------|
| 23 | SignupController에 `GET /api/signup/bptyp-codes` 추가 — BPTYP 하위 코드 반환 | API | ✅ 완료 |
| 24 | `usePublicCommonCodeHierarchy` → 백엔드 public API 직접 호출로 변경 | Front | ✅ 완료 |
| 25 | Next.js API route 프록시 (`/api/common-codes/hierarchy/[code]/route.ts`) 삭제 | Front | ✅ 완료 |
| 26 | `pnpm lint` + `pnpm build` 체크 | Front | ✅ 완료 |

### Phase 7: 버그 수정 및 개선

| # | 작업 | 범위 | 상태 |
|---|------|------|------|
| 27 | SignupStep04 로고 등록 — FileUpload 공통 컴포넌트 적용 (Drag & Drop + formData.logoFile 연동) | Front | ✅ 완료 |
| 28 | SignupStep05 Master ID 중복체크 응답 파싱 버그 수정 (`response.data.data` → `response.data.data.available`) | Front | ✅ 완료 |
| 29 | SignupStep05 가입 완료 시 중복체크 미수행 검증 추가 (Zod 에러와 동시 표시) | Front | ✅ 완료 |
| 30 | SignupStep05 API 에러 표시 — `window.alert` → `useAlert` 공통 컴포넌트 사용 | Front | ✅ 완료 |
| 31 | `(public)/layout.tsx`에 `AlertProvider` 추가 | Front | ✅ 완료 |
| 32 | BpService.saveInvitation — `joinedBp = franchise` 누락 수정 | API | ✅ 완료 |
| 33 | SignupService.verifyInvitation — `invitation.joinedBp` 의존 제거, `bpCode`로 Organization 직접 조회 | API | ✅ 완료 |
| 34 | 초대 가입 Step4 — 본사명 readOnly + 브랜드명 본사 브랜드명 pre-fill (readOnly) | Front | ✅ 완료 |
| 35 | InvitationVerifyResponse에 `headOfficeBrandName` 필드 추가 | API+Front | ✅ 완료 |
| 36 | 초대 가입 Step4 validation — `invitationData` 값으로 검증하도록 수정 | Front | ✅ 완료 |
| 37 | 초대 가입 Step5 submit — `brandName`, `companyName`을 `invitationData`에서 전송 | Front | ✅ 완료 |
| 38 | SignupRequest에서 `openDate` 필드 제거 (미사용, DB 미저장) | API+Front | ✅ 완료 |
| 39 | SignupStep02 회사명 helptext 수정 ("사업자명" → "회사명") | Front | ✅ 완료 |
| 40 | "이미 사용 중인 ID입니다" → "사용할 수 없는 ID입니다" 문구 변경 | Front | ✅ 완료 |

### Phase 8: 비운영 환경 사업자번호 인증 bypass

운영 환경이 아닌 곳(개발/QA/로컬)에서 국세청 API 의존을 제거하기 위해 환경변수 기반 bypass 도입.
초대 코드 검증(`/api/signup/verify-invitation`)은 bypass 대상이 아님 — 사업자번호 인증만 적용.

| # | 작업 | 범위 | 상태 |
|---|------|------|------|
| 41 | `/api/business-verification` route에 `SKIP_BUSINESS_API=true` 분기 추가 — 입력값 형식 검증 통과 시 `isValid: true` 반환 | Front | ✅ 완료 |
| 42 | `.env.development`에 `SKIP_BUSINESS_API=true` 추가 (개발 환경 bypass 활성화) | Front | ✅ 완료 |
| 43 | `.env.example`에 `SKIP_BUSINESS_API` 가이드 코멘트 추가 (운영에서는 미설정/false) | Front | ✅ 완료 |
| 44 | `pnpm lint` + `pnpm build` 검증 | Front | ✅ 완료 |

**판별 기준**: `process.env.SKIP_BUSINESS_API === 'true'` (서버 사이드 env, `NEXT_PUBLIC_` 접두사 미사용 — 클라이언트 노출 차단)
**적용 위치**: API route 1곳 (`src/app/api/business-verification/route.ts`). 클라이언트 훅(`useBusinessVerification`)은 무수정.
**bypass 동작**: `BUSINESS_VALIDATE_KEY` 부재 503 분기보다 먼저 평가 → 입력값 형식만 검증 → `{ success: true, data: { isValid: true, rawResult: { bypassed: true } } }` 반환.
