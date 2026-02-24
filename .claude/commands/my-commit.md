---
description: 사용하지 않는 변수/임포트를 정리한 후 커밋을 진행합니다
---

# My Commit - 클린 커밋 워크플로우

staged 또는 unstaged 변경 파일에서 사용하지 않는 코드를 정리한 후 깔끔하게 커밋합니다.

$ARGUMENTS

## 실행 절차

### 1단계: 변경 파일 스캔

`git status`로 커밋 대상 파일을 확인합니다. staged 파일이 있으면 staged만, 없으면 unstaged 변경 파일을 대상으로 합니다.

### 2단계: 미사용 코드 탐지 및 정리

대상 파일 중 TypeScript/JavaScript 파일(`.ts`, `.tsx`, `.js`, `.jsx`)에 대해 다음을 검사합니다:

1. **미사용 import** — import했지만 파일 내에서 참조되지 않는 모듈/변수
2. **미사용 변수** — 선언했지만 사용하지 않는 변수 (함수 파라미터 제외)
3. **미사용 함수** — 선언했지만 호출/참조되지 않는 로컬 함수

각 파일을 Read 도구로 읽고 분석하여, 미사용 항목을 Edit 도구로 제거합니다.

**주의사항:**
- `export`된 항목은 외부에서 사용될 수 있으므로 제거하지 않습니다
- 타입 import (`import type`)도 동일하게 검사합니다
- React 컴포넌트에서 `React`는 JSX 사용 시 유지합니다
- side-effect import (`import './style.css'`, `import 'module'`)는 건드리지 않습니다
- destructuring에서 일부만 미사용인 경우 해당 변수만 제거합니다
- `eslint-disable` 주석이 미사용 변수를 위한 것이라면 주석과 변수 모두 제거합니다

### 3단계: lint 검증

프로젝트에 lint 명령이 있으면 변경 파일에 대해 lint를 실행하여 정리 결과를 검증합니다.
- `whale-erp-front/`: `pnpm lint`
- `whale-erp-api/`: `./gradlew test` (해당 시 생략 가능)
- lint 에러 발생 시 수정을 시도합니다

### 4단계: 커밋 진행

일반적인 커밋 플로우를 따릅니다:
1. `git status`와 `git diff --staged`로 최종 변경 내용 확인
2. 최근 커밋 메시지 스타일 참고 (`git log --oneline -5`)
3. 변경 파일을 staging
4. 커밋 메시지 생성 (프로젝트 컨벤션: `feat:`, `fix:`, `chore:` 등)
5. 정리된 항목이 있으면 커밋 메시지 본문에 "Clean up: 미사용 import/변수 제거" 포함
6. 커밋 실행

**커밋 메시지 형식:**
```
<type>: <subject>

[정리 내역이 있는 경우]
Clean up: 미사용 import/변수 제거
- <파일명>: <제거 항목>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

### 5단계: 결과 보고

정리 및 커밋 결과를 요약합니다:
- 정리된 파일 수 및 항목
- 커밋 해시 및 메시지
- push 여부는 사용자에게 확인 후 진행
