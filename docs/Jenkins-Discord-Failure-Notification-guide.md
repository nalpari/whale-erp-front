# Jenkins → Discord 빌드 알림 & AI 실패 원인 분석 가이드

배포 파이프라인(`Jenkinsfile`)이 빌드 결과를 Discord로 알리는 방식과, **빌드 실패 시 콘솔 로그를 AI로 분석해 원인을 함께 보내는** 기능을 설명한다.

---

## 1. 개요

- **성공**: 빌드가 성공하면 Discord에 ✅ 성공 알림(초록 임베드)을 보낸다.
- **실패**: 빌드가 실패하면 ❌ 실패 알림 + **AI가 분석한 실패 원인**을 **한 메시지(합본)**로 보낸다.
- 모든 알림은 Jenkins 파이프라인의 `post` 블록에서 `curl`로 Discord Webhook에 직접 POST한다. (별도 봇/서버 없음)

```
빌드 성공 → notifyDiscord('✅ 성공')                → 초록 임베드
빌드 실패 → notifyBuildFailureWithAnalysis()        → 빨강 임베드(실패 정보 + 🔍 원인 분석)
```

---

## 2. 사용 AI 모델

| 항목 | 값 |
|---|---|
| 제공자 | [OpenRouter](https://openrouter.ai) |
| 모델 | **`google/gemma-4-31b-it:free`** |
| 비용 | 무료 (free 티어) |
| 응답 속도 | 약 3~4초 |
| 컨텍스트 | 1M 토큰 (전송 로그는 ~8KB라 여유 충분) |
| reasoning | 비활성 (요약 용도라 불필요, 속도 우선) |

> **모델 선택 경위**: 처음엔 `nvidia/nemotron-3-ultra-550b-a55b:free`(추론 모델)를 검토했으나 무료 티어에서 응답이 2분 이상 걸려(또는 미응답) CI 알림에 부적합했다. 작고 빠른 instruct 모델인 `gemma-4-31b-it:free`로 교체해 3~4초 내 정확한 요약을 받는다. (디스크 풀·헬스체크 실패 등 실제 로그로 검증 완료)
>
> **모델 교체 방법**: `Jenkinsfile`의 `notifyBuildFailureWithAnalysis()` 안 `jq -n ... '{model:"google/gemma-4-31b-it:free", ...}'` 한 줄만 바꾸면 된다.

---

## 3. 실패 알림 처리 흐름

`Jenkinsfile`의 `post.failure { notifyBuildFailureWithAnalysis() }` 가 호출하는 함수가 아래를 수행한다.

```
1) currentBuild.rawBuild.getLog(300)        # 콘솔 로그 마지막 300줄 확보
   └ 실패(스크립트 미승인 등) → 분석 없이 기본 ❌ 실패 알림만 발송 후 종료

2) 로그 정제 (shell)
   - grep -v 로 노이즈 제거([Pipeline] 줄, docker 캐시 줄)
   - tail -n 200 → cut -c -500 (줄당 상한) → head -c 8192 (8KB 상한)

3) 키워드 마스킹 (best-effort)
   - password / secret / token / key / authorization / bearer 뒤 값 → ***
   - (withCredentials 로 바인딩된 값은 Jenkins가 이미 **** 마스킹)

4) jq 로 OpenRouter 요청 JSON 생성 (--rawfile 로 로그 안전 임베드)
   → gemma 호출 (--connect-timeout 5 --max-time 45, 429 시 4초 간격 최대 3회 재시도)
   → keep-alive 패딩 제거 후 .choices[0].message.content 파싱

5) 합본 임베드 1개 발송 (Discord Webhook)
   - 요약 성공 → 실패 정보 + 🔍 원인 분석
   - 요약 실패/타임아웃 → 실패 정보 + "🔍 원인 분석 실패 — 콘솔 로그 확인 필요"
```

**안전장치**: 전 구간이 `try/catch` + `set +e`로 감싸여 있어, 분석 단계의 어떤 실패도 **빌드 상태를 바꾸지 않으며**, 최소한 ❌ 실패 알림은 한 번 발송된다. (`+x`로 API 키 로그 노출도 방지)

---

## 4. Discord 메시지 형태

**실패 (합본, 빨강 `15158332`)**
```
[whaleerp-front-dev] #14 ❌ 실패          ← 제목 클릭 시 빌드 콘솔(/console)로 이동
프로파일: dev | 브랜치: origin/develop | 소요시간: 6.2 sec
🔍 원인 분석
원인: TypeScript 타입 에러로 next build 실패
핵심 에러: Type error: Property 'name' does not exist on type 'Employee' (...page.tsx:42)
제안 조치: 1. 해당 라인 타입 확인 2. Employee 인터페이스에 name 추가
```

**성공 (초록 `3066993`)**
```
[whaleerp-front-dev] #15 ✅ 성공          ← 제목 클릭 시 빌드 페이지로 이동
프로파일: dev | 브랜치: origin/develop | 소요시간: 4 min 12 sec
```

- AI 출력 형식(모델에 지시): `원인:` / `핵심 에러:` / `제안 조치:` 3블록, 6줄·1000자 이내
- 실패 메시지 제목 링크: `${BUILD_URL}console` (콘솔 출력 페이지 바로가기)

---

## 5. 사전 준비 (수동, 1회)

이 기능이 동작하려면 아래가 모두 갖춰져야 한다.

| # | 항목 | 내용 |
|---|---|---|
| 1 | **Discord Webhook** | 채널 → 연동 → 웹후크 생성 → URL 복사 |
| 2 | **Jenkins Credential `discord-webhook`** | Kind: Secret text, 값 = 웹훅 URL |
| 3 | **Jenkins Credential `openrouter-api-key`** | Kind: Secret text, 값 = OpenRouter API 키 |
| 4 | **에이전트에 `jq` 설치** | 빌드가 도는 환경(예: Jenkins 컨테이너 내부)에 설치. `docker exec -u root <jenkins> apt-get install -y jq` (curl은 기본 존재) |
| 5 | **In-process Script Approval** | 첫 실패 빌드 후 Jenkins 관리 → In-process Script Approval 에서 아래 2개 Approve:<br>• `org.jenkinsci.plugins.workflow.support.steps.build.RunWrapper getRawBuild`<br>• `hudson.model.Run getLog int` |

> ⚠️ 5번 `getRawBuild`는 샌드박스 탈출 권한이라 Jenkins가 보안 경고를 띄운다. **팀 전용 Jenkins**에서는 수용 가능한 트레이드오프로 판단해 승인했다. 공유 Jenkins라면 재검토 필요.
> ⚠️ 4번 `jq`는 **빌드가 실행되는 셸 환경**(보통 Jenkins 컨트롤러 컨테이너 `/var/jenkins_home`)에 있어야 한다. 호스트/배포 대상 서버가 아니다. 컨테이너 재생성 시 사라지므로 영구 적용은 Jenkins 이미지 Dockerfile에 추가 권장.

---

## 6. 테스트 방법 (소스 변경 없이)

Jenkins **Replay** 기능으로 커밋 없이 실패를 재현한다.

1. **최신 Jenkinsfile로 실행된 빌드**를 하나 만든다 (일반 빌드 1회). → Replay는 "그 빌드 시점의 Jenkinsfile"을 쓰므로, 옛 빌드를 Replay하면 옛 코드가 돈다.
2. 그 빌드 → **Replay** → 스테이지 안에 실패 한 줄 추가:
   ```groovy
   sh 'echo "의도적 실패: 테스트 메시지" && exit 1'
   ```
   - `error('...')`는 메시지가 파이프라인 **끝**에 찍혀 getLog 시점엔 로그에 없으므로, **`sh 'echo ...; exit 1'`** 로 스테이지 실행 중에 메시지를 남겨야 AI가 그 원인을 잡는다.
3. Run → ❌ 실패 + 🔍 원인 분석이 한 메시지로 오는지 확인.

**디버깅**: 분석이 안 오면 실패 빌드 콘솔의 `(Declarative: Post Actions)` 구간을 본다.
| 콘솔 로그 | 의미 |
|---|---|
| `로그 확보 실패 ... getRawBuild` | Script Approval 미승인 (5번) |
| `jq 미설치 - 분석 없이 발송` | jq 미설치 (4번) |
| `429 업스트림 한도 - 재시도` | OpenRouter 무료 티어 일시 한도 |
| `AI 요약 없음(느림/오류) - 폴백 발송` | 모델 빈 응답/타임아웃 |

---

## 7. 한계 / 참고

- **무료 티어 한도**: `:free` 모델은 일시적 429(업스트림 한도)가 날 수 있다. 짧게 재시도하며, 실패 시 폴백 메시지로 처리. 자주 누락되면 OpenRouter 크레딧 소액 충전 시 한도가 크게 오른다.
- **합본 지연**: 합본 구조라 실패 알림이 AI 응답(보통 3~4초)을 기다린 뒤 발송된다. 모델이 느릴 경우 최대 `--max-time 45`초까지 지연될 수 있으며, 그 후엔 폴백으로 알림이 나간다. (지연이 부담되면 알림 즉시 발송 + 분석 후속 발송하는 "분리" 방식으로 전환 가능)
- **데이터 전송**: 빌드 로그(마스킹본)가 외부 LLM(OpenRouter)으로 전송된다. 내부 정보 민감도가 높으면 무료 티어 대신 데이터 보존 안 하는 제공자/모델로 교체 검토.
- **적용 범위**: 현재 프론트(`whale-erp-front`)에만 적용. 백엔드 등 다른 레포에 적용하려면 해당 `Jenkinsfile`에 동일 함수를 추가해야 한다.

---

## 8. 관련 코드

- `Jenkinsfile`
  - `notifyDiscord(status, color)` — 성공/실패 공용 기본 알림 (제목 → 빌드 페이지)
  - `notifyBuildFailureWithAnalysis()` — 실패 시 로그 분석 + 합본 발송 (제목 → /console)
  - `post { success { notifyDiscord('✅ 성공', ...) } failure { notifyBuildFailureWithAnalysis() } }`
