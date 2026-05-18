# 가맹점 초대 페이지 개발 계획

## 개요

BP Master 목록에서 "가맹점 초대" 버튼 클릭 시 이동하는 초대 페이지 개발

- **라우트**: `/app/(sub)/master/bp/invitation/page.tsx`
- **Location**: `title='가맹점 초대'`, `list={['Home', '파트너 정보 관리', '가맹점 초대']}`
- **참조 UI**: pub `InvitationForm.tsx`
- **초대 완료 후**: `/master/bp` (목록 페이지)로 이동

---

## 결정 사항

| # | 항목 | 결정 |
|---|------|------|
| 1 | 라우트 경로 | `/master/bp/invitation` |
| 2 | 이메일 필드 | API `BpInvitationRequest`에 `representativeEmail` 추가, 폼에 포함 |
| 3 | 사업자등록번호 인증 | 공공데이터포털 진위확인 API 사용 (`POST https://api.odcloud.kr/api/nts-businessman/v1/validate`) |
| 4 | 개업일자 | 진위확인 API 호출용으로만 사용, DB 저장하지 않음 |
| 5 | 초대 후 동작 | 성공 시 `/master/bp` 목록 페이지로 이동 |
| 6 | 본사 선택 | 운영중인 본사 전용 API (`GET /api/master/bp/head-offices`) 사용 |

---

## 파일 구조

### Front (`whale-erp-front`)

```
src/
├── app/(sub)/master/bp/invitation/
│   └── page.tsx                              # [신규] 래퍼 → BpInvitationManage 렌더링
├── components/master/bp/
│   └── BpInvitationManage.tsx                # [신규] 초대 폼 페이지 컴포넌트
├── types/
│   └── bp.ts                                 # [수정] BpInvitationFormData 타입 추가
└── hooks/queries/
    └── use-bp-queries.ts                     # [수정] useInviteFranchise, useOperatingHeadOffices 훅 추가
```

### API (`whale-erp-api`)

```
domain/master/bp/
├── dto/request/BpInvitationRequest.kt        # [수정] representativeEmail 필드 추가
└── service/BpService.kt                      # [수정] saveInvitedFranchise에 email 저장
```

---

## API 수정 (사전 작업)

### 1. BpInvitationRequest에 `representativeEmail` 추가

```kotlin
// BpInvitationRequest.kt
@field:Schema(description = "대표자 이메일", example = "abc@abc.co.kr")
@field:NotBlank(message = "대표자 이메일은 필수입니다.")
@field:Email(message = "유효한 이메일 형식이 아닙니다.")
val representativeEmail: String
```

### 2. BpService.saveInvitedFranchise에 email 저장

```kotlin
val invitedFranchise = Organization(
    // ... 기존 필드
    representativeEmail = request.representativeEmail,  // 추가
)
```

---

## 사업자등록번호 진위확인

### API 정보

- **URL**: `POST https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey={KEY}`
- **인증키** (encoded): `AsoOkjYzxLNpwF0ZK5rGPOIX5cp3e4Kp3P9A5VkILMZdy2Cx7Rwt5%2FB2qqLbmD%2FtEt38CvjYKB8ElFeRhFfrfQ%3D%3D`

### 요청 형식

```json
{
  "businesses": [
    {
      "b_no": "1234567890",
      "start_dt": "20200101",
      "p_nm": "홍길동"
    }
  ]
}
```

### 응답 판별

- `valid`: `"01"` → 유효, `"02"` → 무효

### 호출 방식

- 프론트에서 직접 호출 (외부 공공 API이므로 CORS 이슈 시 API 프록시 검토)
- CORS 이슈 발생 시 whale-erp-api에 프록시 엔드포인트 추가

### 필요 입력

| 필드 | 용도 | 폼 필드 |
|------|------|---------|
| `b_no` | 사업자등록번호 | 사업자등록번호 입력값 |
| `start_dt` | 개업일자 | 개업일자 입력값 (YYYYMMDD) |
| `p_nm` | 대표자명 | 대표자 성명 입력값 |

---

## Front 구현

### 1단계: 타입 정의 (`src/types/bp.ts`)

```typescript
export interface BpInvitationFormData {
  headOfficeId: number | null       // 본사 ID (필수)
  businessRegistrationNumber: string // 사업자등록번호 (필수, 10자리)
  startDate: string                  // 개업일자 (진위확인용, YYYYMMDD, 저장 안함)
  representativeName: string         // 대표자명 (필수)
  representativeMobilePhone: string  // 휴대폰번호 (필수, 01X + 7~8자리)
  representativeEmail: string        // 이메일 (필수)
}
```

### 2단계: Query 훅 (`src/hooks/queries/use-bp-queries.ts`)

```typescript
// 운영중인 본사 목록 조회
export const useOperatingHeadOffices = () => {
  return useQuery({
    queryKey: bpKeys.headOffices(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<BpDetailResponse[]>>(
        '/api/master/bp/head-offices'
      )
      return response.data.data ?? []
    },
  })
}

// 가맹점 초대 mutation
export const useInviteFranchise = () => {
  return useMutation({
    mutationFn: async (data: {
      id: number
      businessRegistrationNumber: string
      representativeName: string
      representativeMobilePhone: string
      representativeEmail: string
    }) => {
      const response = await api.post<ApiResponse<void>>(
        '/api/master/bp/invitations',
        data
      )
      return response.data
    },
  })
}
```

### 3단계: 초대 폼 컴포넌트 (`BpInvitationManage.tsx`)

#### UI 레이아웃 (pub InvitationForm 참조)

```
┌─────────────────────────────────────────────────────────────┐
│ invitation-form-header                                       │
│  본사: [SelectBox - 운영중인 본사 목록]                         │
├─────────────────────────────────────────────────────────────┤
│ invitation-cont-guide                                        │
│  "가맹점을 WHALE ERP로 초대하시겠습니까?"                       │
│  - 안내 문구 (본사명 동적 표시)                                 │
├─────────────────────────────────────────────────────────────┤
│ invitation-cont-form                                         │
│ ┌──────────────────┬────────────────────────────────────────┐│
│ │ 사업자등록번호 *  │ [Input] [인증하기 버튼]                  ││
│ │                   │ ※ 경고/성공 메시지                      ││
│ ├──────────────────┼────────────────────────────────────────┤│
│ │ 개업일자 *        │ [DatePicker]                            ││
│ │                   │ ※ 사업자등록증 상의 개업일자              ││
│ ├──────────────────┼────────────────────────────────────────┤│
│ │ 대표자 성명 *     │ [Input]                                 ││
│ │                   │ ※ 사업자등록증 상의 대표자명              ││
│ ├──────────────────┼────────────────────────────────────────┤│
│ │ 대표자 휴대폰 *   │ [Input]                                 ││
│ │                   │ ※ 대표자님의 휴대폰 번호                 ││
│ ├──────────────────┼────────────────────────────────────────┤│
│ │ 대표자 이메일 *   │ [Input]                                 ││
│ │                   │ ※ 대표자님의 이메일 주소                 ││
│ └──────────────────┴────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ invitation-cont-guide                                        │
│  - 초대 안내 문구                                             │
├─────────────────────────────────────────────────────────────┤
│ invitation-form-footer                                       │
│              [취소]  [초대하기]                                │
└─────────────────────────────────────────────────────────────┘
```

#### 폼 검증 규칙

| 필드 | 규칙 | 에러 메시지 |
|------|------|------------|
| 본사 | 필수 선택 | "본사를 선택해주세요" |
| 사업자등록번호 | 필수, 10자리 숫자 | "사업자등록번호는 10자리 숫자입니다" |
| 사업자등록번호 인증 | 진위확인 API 통과 필수 | "유효한 사업자등록번호가 아닙니다" |
| 개업일자 | 필수 (인증 시 사용) | "개업일자를 입력해주세요" |
| 대표자명 | 필수 | "대표자명을 입력해주세요" |
| 휴대폰 | 필수, `01[016789]\d{7,8}` | "유효한 휴대폰 번호를 입력해주세요" |
| 이메일 | 필수, 이메일 형식 | "유효한 이메일 주소를 입력해주세요" |

#### 사업자등록번호 인증 흐름

1. 사업자등록번호 + 개업일자 + 대표자명 입력
2. "인증하기" 버튼 클릭
3. 공공데이터 API 호출 (`b_no`, `start_dt`, `p_nm`)
4. `valid === "01"` → 인증 성공 표시, 사업자등록번호 필드 readOnly 처리
5. `valid === "02"` → "유효한 사업자등록번호가 아닙니다" 에러 표시
6. 인증 성공 후 사업자등록번호 변경 시 인증 상태 초기화

#### 초대하기 흐름

1. 모든 필수 필드 입력 + 사업자등록번호 인증 완료 확인
2. `useInviteFranchise` mutation 호출 (startDate 제외)
3. 성공 → 성공 알림 + `/master/bp`로 이동
4. 실패 → API 에러 메시지 표시 (중복 초대, 본사 권한 등)

### 4단계: 페이지 (`page.tsx`)

```typescript
import BpInvitationManage from '@/components/master/bp/BpInvitationManage'

const BpInvitationPage = () => {
  return <BpInvitationManage />
}

export default BpInvitationPage
```

### 5단계: 네비게이션 수정

`BpMasterManage.tsx`의 `handleInviteFranchise` 경로를 `/master/bp/invitation`으로 변경

---

## 구현 순서

| # | 작업 | 상태 |
|---|------|------|
| 1 | API 수정 — `BpInvitationRequest`에 `representativeEmail` 추가 | ✅ 완료 |
| 2 | API 수정 — `BpService.saveInvitedFranchise`에 email 저장 | ✅ 완료 |
| 3 | 타입 정의 (`types/bp.ts`) — `BpInvitationFormData` 추가 | ✅ 완료 |
| 4 | Query 키 + 훅 추가 (`query-keys.ts`, `use-bp-queries.ts`) | ✅ 완료 |
| 5 | `BpInvitationManage.tsx` 작성 | ✅ 완료 |
| 6 | `page.tsx` 생성 (`/master/bp/invitation`) | ✅ 완료 |
| 7 | `BpMasterManage.tsx` 네비게이션 경로 수정 | ✅ 완료 |
| 8 | `pnpm lint` + `pnpm build` 체크 | ✅ 통과 |

---

## 별도 고려 사항

| 항목 | 설명 |
|------|------|
| CORS | 공공데이터 API 직접 호출 시 CORS 차단 가능 → whale-erp-api에 프록시 엔드포인트 추가 검토 |
| 인증키 관리 | 공공데이터 API 인증키는 환경변수(`NEXT_PUBLIC_*`)로 관리 |
| 카톡 발송 | API에 TODO로 남아있음 (추후 개발) |
