# BP 등록 시 Member 자동 생성 + 최초 비밀번호 변경 강제

## 개요

BP(Organization) 등록 시 로그인용 Member 계정을 자동 생성한다.
초기 비밀번호는 masterId와 동일하게 설정되며, 최초 로그인 시 비밀번호 변경 모달을 강제하여 변경 전까지 시스템 사용을 차단한다.

---

## 결정 사항

| # | 항목 | 결정 |
|---|------|------|
| 1 | masterId 용도 | Member의 loginId로 사용 |
| 2 | 초기 비밀번호 | masterId와 동일 (별도 생성/발송 없음) |
| 3 | 비밀번호 변경 강제 | 로그인 후 모달, 변경하지 않으면 시스템 사용 불가 |
| 4 | 권한 부여 | 이번 범위 외 (추후 별도 작업) |
| 5 | 대표자 이메일 | BpForm에 필수 필드로 추가 (✅ 완료) |

---

## 현재 상태

### 이미 구현된 것
- 프론트 `BpForm.tsx` — masterId 입력 + 중복 확인 UI 구현됨
- 프론트 `BpForm.tsx` — 대표자 이메일 필드 추가됨 (✅ 완료)
- `AdminService.create()` — Member + MemberDetail 생성 참조 패턴

### 미구현
- `BpSaveRequest`에 `masterId`, `representativeEmail` 필드 없음
- `BpService.createBp()`에서 Member 생성 안 함
- Member에 `passwordChangeRequired` 필드 없음
- 비밀번호 변경 API 없음
- 프론트 비밀번호 변경 모달 없음
- 로그인 응답에 `passwordChangeRequired` 없음

---

## API 변경 사항

### 1. DB 마이그레이션 (Flyway)

`members` 테이블에 비밀번호 변경 필요 플래그 추가:

```sql
ALTER TABLE members ADD COLUMN password_change_required BOOLEAN NOT NULL DEFAULT false;
```

### 2. Member 엔티티 수정

```kotlin
// Member.kt
@Comment("비밀번호 변경 필요 여부")
@Column(name = "password_change_required", nullable = false)
var passwordChangeRequired: Boolean = false
```

### 3. BpSaveRequest 수정

```kotlin
// BpSaveRequest.kt — 필드 추가
@field:Schema(description = "마스터 ID (로그인 ID로 사용, 초기 비밀번호로도 사용)")
var masterId: String? = null

@field:Schema(description = "대표자 이메일")
var representativeEmail: String? = null
```

### 4. BpService.createBp() 수정

Organization 저장 후 Member 자동 생성 로직 추가:

```
기존 흐름:
1. 공통코드 검증
2. organizationType 결정
3. 사업자등록번호 중복 검증
4. Organization 생성 + 저장
5. organizationCode 생성
6. LNB 로고 업로드
7. PF 목록 생성

추가 흐름 (7번 이후):
8. masterId가 있으면:
   a. loginId 중복 체크
   b. Member 생성 (loginId=masterId, passwordHash=encode(masterId), passwordChangeRequired=true)
   c. MemberDetail 생성 (organization=새 Organization, mobilePhone=대표자 휴대폰)
   d. Organization.masterId에 값 저장
```

**참조 패턴**: `AdminService.create()` (Member + MemberDetail 생성)

**초기 비밀번호**: masterId와 동일
```kotlin
val initialPassword = request.masterId!!
member.passwordHash = passwordEncoder.encode(initialPassword)
member.passwordChangeRequired = true
```

### 5. 비밀번호 변경 API 신규

```
PUT /api/auth/change-password

Request:
{
  "currentPassword": "현재 비밀번호",
  "newPassword": "새 비밀번호"
}

Response: 200 OK
{
  "code": "SUCCESS",
  "message": "비밀번호가 변경되었습니다."
}
```

**로직**:
1. JWT에서 loginId 추출
2. Member 조회
3. currentPassword 검증 (`passwordEncoder.matches`)
4. newPassword 형식 검증 (영문+숫자+특수문자, 8~20자)
5. `member.passwordHash = encode(newPassword)`
6. `member.passwordChangeRequired = false`
7. 기존 RefreshToken 무효화 (선택)

### 6. LoginResponse 수정

```kotlin
// LoginResponse.kt — 필드 추가
@field:Schema(description = "비밀번호 변경 필요 여부")
val passwordChangeRequired: Boolean = false
```

`AuthService.login()`에서 `member.passwordChangeRequired` 값을 응답에 포함.

---

## Frontend 변경 사항

### 1. 로그인 응답 타입 수정

```typescript
// schemas/auth.ts — LoginResponseData에 추가
passwordChangeRequired: boolean
```

### 2. auth-store 수정

```typescript
// stores/auth-store.ts
passwordChangeRequired: boolean  // 추가
setPasswordChangeRequired: (required: boolean) => void  // 추가
```

### 3. 비밀번호 변경 API 훅 추가

```typescript
// hooks/queries/ — 신규 또는 기존 auth 훅에 추가
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.put('/api/auth/change-password', data)
      return response.data
    },
  })
}
```

### 4. 비밀번호 변경 페이지 신규

```
src/app/(auth)/change-password/page.tsx
```

**UI 구성**:
- 현재 비밀번호 입력
- 새 비밀번호 입력
- 새 비밀번호 확인 입력
- 변경 버튼

**검증 규칙**:
- 새 비밀번호: 영문+숫자+특수문자, 8~20자
- 새 비밀번호 확인 일치 여부
- 현재 비밀번호와 새 비밀번호 다른지 확인

### 5. 로그인 후 비밀번호 변경 페이지로 리다이렉트

- 로그인 성공 시 `passwordChangeRequired === true`이면 `/change-password`로 리다이렉트
- 변경 완료 시 `setPasswordChangeRequired(false)` + 메인 페이지로 이동

---

## 파일 구조

### API (`whale-erp-api`)

```
src/main/
├── resources/db/migration/
│   └── V{버전}__add_password_change_required_to_members.sql   # Flyway
├── kotlin/.../domain/
│   ├── master/entity/Member.kt                                 # passwordChangeRequired 추가
│   ├── master/bp/dto/request/BpSaveRequest.kt                  # masterId, representativeEmail 추가
│   ├── master/bp/service/BpService.kt                          # createBp()에 Member 생성 로직 추가
│   ├── auth/dto/LoginResponse.kt                               # passwordChangeRequired 추가
│   ├── auth/dto/ChangePasswordRequest.kt                       # 신규
│   ├── auth/service/AuthService.kt                             # changePassword() 추가, login() 수정
│   └── auth/controller/AuthController.kt                       # PUT /api/auth/change-password 추가
```

### Front (`whale-erp-front`)

```
src/
├── lib/schemas/auth.ts                                          # 로그인 응답 타입 수정
├── stores/auth-store.ts                                         # passwordChangeRequired 추가
├── hooks/queries/use-auth-queries.ts                            # useChangePassword 추가 (신규 또는 기존)
├── components/common/PasswordChangeModal.tsx                    # 비밀번호 변경 모달 (신규)
└── app/(sub)/layout.tsx                                         # 모달 호출 로직 추가
```

---

## 구현 순서

| # | 작업 | 범위 | 상태 |
|---|------|------|------|
| 1 | 대표자 이메일 필드 BpForm에 추가 | Front | ✅ 완료 |
| 2 | Flyway — `password_change_required` 컬럼 추가 | API | ✅ 완료 |
| 3 | Member 엔티티에 `passwordChangeRequired` 필드 추가 | API | ✅ 완료 |
| 4 | `BpSaveRequest`에 `masterId`, `representativeEmail` 필드 추가 | API | ✅ 완료 |
| 5 | `BpService.createBp()`에 Member 자동 생성 (초기 비밀번호 = masterId) | API | ✅ 완료 |
| 6 | `ChangePasswordRequest` DTO 작성 | API | ✅ 완료 |
| 7 | `AuthService.changePassword()` 구현 | API | ✅ 완료 |
| 8 | `AuthController`에 `PUT /api/auth/change-password` 추가 | API | ✅ 완료 |
| 9 | `LoginResponse`에 `passwordChangeRequired` 추가 | API | ✅ 완료 |
| 10 | `AuthService.login()`에서 `passwordChangeRequired` 응답 포함 | API | ✅ 완료 |
| 11 | TDD — BpService Member 생성 테스트 | API | ✅ 완료 |
| 12 | TDD — AuthService changePassword 테스트 | API | ✅ 완료 |
| 13 | Front 로그인 응답 타입 + auth-store 수정 | Front | ✅ 완료 |
| 14 | `useChangePassword` 훅 추가 | Front | ✅ 완료 |
| 15 | `(auth)/change-password/page.tsx` 페이지 구현 | Front | ✅ 완료 |
| 16 | 로그인 후 `passwordChangeRequired` 시 리다이렉트 | Front | ✅ 완료 |
| 17 | `pnpm lint` + `pnpm build` 체크 | Front | ✅ 완료 |

---

## 주의 사항

- 초기 비밀번호가 masterId와 동일하므로 최초 로그인 시 반드시 비밀번호 변경을 강제해야 함 (보안)
- 권한(Authority) 매핑은 이번 범위 외 — Member는 생성되지만 로그인 시 `NO_AUTHORITY` 에러 발생 가능 (권한 부여 작업 완료 후 정상 동작)
- 수정 모드에서는 masterId가 readOnly — Member 재생성하지 않음
- 비밀번호 변경은 별도 페이지(`/change-password`)로 처리 (모달 방식 아님)
