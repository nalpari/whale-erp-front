// whale-erp-front 배포 파이프라인 (dev / prod 프로파일)
// 플로우: pull → env 검증 → 로컬 docker build(프로파일별 SHA+latest) → 기존 컨테이너 stop·rm·run → smoke check
// 빌드/실행을 같은 서버에서 수행하므로 레지스트리(ECR) push/pull은 하지 않는다.
// 지금은 docker run 기반. 컨테이너가 더 늘어나면 추후 docker compose 도입 예정.
//
// ── 프로파일별 토폴로지 ────────────────────────────────────────────────────
//   dev  : 컨테이너 1개  whale-erp-front-dev            → 외부 4000 (내부 3000)
//   prod : 컨테이너 2개  whale-erp-front-prod-5000      → 외부 5000 (내부 3000)
//                        whale-erp-front-prod-5001      → 외부 5001 (내부 3000)
//   ※ prod 2개 앞단 로드밸런서(nginx)는 후속 작업. 지금은 컨테이너만 띄운다.
//
// ── 사전 준비 (Jenkins Credentials, 모두 "Secret file" 타입) ────────────────
//   whaleerp-front-dev-env   →  .env.development  (dev 빌드 시 사용)
//   whaleerp-front-prod-env  →  .env.production   (prod 빌드 시 사용)
//     - 빌드타임 변수(NEXT_PUBLIC_*)는 파일에서 추출해 --build-arg 로 주입(번들에 박힘)
//     - 런타임 변수(ANTHROPIC_API_KEY, BUSINESS_VALIDATE_KEY 등)는 docker run --env-file 로 주입
//     - dev/prod 이미지는 NEXT_PUBLIC_API_URL 등이 달라 반드시 분리 태깅됨
//
//   ⚠️ env 파일 작성 규칙 (docker --env-file 파싱 함정 주의):
//     - KEY=value 형식, 값에 따옴표(" ') 감싸지 말 것 → 따옴표가 값에 그대로 포함됨
//     - 주석은 줄 맨 앞 #만 허용, 인라인 주석(KEY=val # ...) 금지 → '# ...'가 값에 포함됨
//
// ── 서버 사전 확인 ─────────────────────────────────────────────────────────
//   - jenkins 유저가 docker 그룹 소속인지: `groups jenkins`
//   - 방화벽/보안그룹에서 dev 4000 / prod 5000·5001 포트 개방
//   - repo가 private면 Jenkins에 Git credential 등록

pipeline {
    agent any

    options {
        disableConcurrentBuilds()   // 동시 배포로 인한 컨테이너 교체 충돌 방지
        timestamps()
    }

    parameters {
        choice(
            name: 'PROFILE',
            choices: ['dev', 'prod'],
            description: '배포 프로파일. dev=4000(1개), prod=5000·5001(2개)'
        )
    }

    environment {
        IMAGE_NAME  = 'whale-erp-front'
        PROFILE     = "${params.PROFILE}"
        // 프로파일에 따라 사용할 env Secret file credential 선택
        ENV_CRED_ID = "${params.PROFILE == 'dev' ? 'whaleerp-front-dev-env' : 'whaleerp-front-prod-env'}"
        // 컨테이너 내부 앱 포트 (Next standalone server.js) — 프로파일 무관 고정
        CONTAINER_PORT = '3000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                // 백엔드 컨벤션과 동일하게 전체 SHA를 이미지 태그로 사용
                script {
                    env.GIT_SHA = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                }
                echo "Profile=${params.PROFILE}, commit=${env.GIT_SHA}"
            }
        }

        // 디스크가 빠듯(28G/87%)해서 빌드 "전"에 옛 이미지를 먼저 정리한다.
        // 디스크 누수 주범: 매 빌드가 ${PROFILE}-${SHA} 태그를 남기는데, 이 태그 이미지들은
        //   dangling이 아니라서 `docker image prune`(post.success에 있던 것)으로는 안 지워진다.
        // 정책: 프로파일당 최신 2개(현재 실행 + 롤백 1세대)만 남기고 나머지 SHA 태그 삭제.
        //   - dev/prod 둘 다 정리(각자 2개 유지) → 어느 프로파일로 빌드하든 양쪽 다 정돈
        //   - 실행 중/롤백 이미지는 docker rmi가 거부하므로 안전. 전 구간 best-effort(|| true).
        //   - 이미지 정리 후에도 여유 < 4G면 빌드 캐시까지 정리(안전밸브). 평상시엔 캐시 보존.
        stage('Cleanup old images') {
            steps {
                sh '''
                    set -u   # -e 미사용: 정리 실패가 배포를 막지 않도록 best-effort

                    for prof in dev prod; do
                      # docker images는 기본 최신순 출력 → -latest 제외 후 3번째부터(=오래된 것) 삭제
                      docker images --filter "reference=${IMAGE_NAME}:${prof}-*" --format '{{.Tag}}' \
                        | grep -v 'latest$' \
                        | tail -n +3 \
                        | while read -r tag; do
                            echo "🧹 오래된 이미지 삭제: ${IMAGE_NAME}:${tag}"
                            docker rmi "${IMAGE_NAME}:${tag}" 2>/dev/null || true
                          done
                    done

                    # dangling(태그 없는) 이미지 정리 — 캐시 소스 보호 위해 72h 경과분만 (기존 post.success 로직 흡수)
                    docker image prune -f --filter "until=72h" || true

                    # 안전밸브: 이미지 정리 후에도 여유가 부족하면 빌드 캐시까지 희생
                    AVAIL_KB=$(df -P /var/lib/docker 2>/dev/null | awk 'NR==2{print $4}')
                    [ -n "${AVAIL_KB:-}" ] || AVAIL_KB=$(df -P / | awk 'NR==2{print $4}')
                    if [ "${AVAIL_KB:-0}" -lt 4194304 ]; then   # 4GB = 4*1024*1024 KB
                      echo "⚠️  디스크 여유 4GB 미만 → 빌드 캐시까지 정리(안전밸브 발동)"
                      docker builder prune -f || true
                    fi

                    echo "✅ 이미지 정리 완료"
                    docker system df || true
                '''
            }
        }

        // 빌드/배포 전에 선택한 프로파일의 env 파일에 필수 변수가 있는지 먼저 검증한다.
        // "빌드는 됐는데 OCR·사업자검증만 런타임에 깨지는" 사고를 빌드 전에 차단.
        stage('Validate environment') {
            steps {
                withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
                    sh '''
                        set -eu
                        set -a; . "$ENV_FILE"; set +a

                        # 빌드타임 필수 (번들에 박혀야 프론트가 백엔드 API를 찾음)
                        : "${NEXT_PUBLIC_API_URL:?$ENV_CRED_ID 에 NEXT_PUBLIC_API_URL 누락 - 프론트가 백엔드 API를 못 찾음}"
                        # 빌드타임 필수 (브라우저가 sales-rader로 직접 호출 - 누락 시 매출 연동(import) 런타임 실패)
                        : "${NEXT_PUBLIC_SALES_RADER_URL:?$ENV_CRED_ID 에 NEXT_PUBLIC_SALES_RADER_URL 누락 - 매출 데이터 연동 실패}"

                        # 런타임 필수 시크릿 (없으면 해당 기능만 런타임에 실패)
                        : "${ANTHROPIC_API_KEY:?$ENV_CRED_ID 에 ANTHROPIC_API_KEY 누락 - OCR(사업자등록증 인식) 런타임 실패}"
                        : "${BUSINESS_VALIDATE_KEY:?$ENV_CRED_ID 에 BUSINESS_VALIDATE_KEY 누락 - 사업자 검증 런타임 실패}"

                        # NEXT_PUBLIC_S3_HOSTNAME은 next.config.ts에 기본값이 있어 필수는 아님
                        if [ -z "${NEXT_PUBLIC_S3_HOSTNAME:-}" ]; then
                          echo "⚠️  NEXT_PUBLIC_S3_HOSTNAME 미정의 - next.config.ts 기본 버킷으로 빌드됨"
                        fi

                        echo "✅ [$PROFILE] 필수 환경변수 확인 완료"
                    '''
                }
            }
        }

        // 빌드가 성공한 뒤에야 Deploy 단계로 넘어가므로,
        // 빌드 실패 시 기존 컨테이너는 그대로 살아있다(다운타임 없음).
        stage('Build image') {
            steps {
                // env 파일에서 빌드타임 변수만 추출해 --build-arg로 주입.
                // grep 앵커(^KEY=)로 주석 줄은 제외, cut -f2-로 값 안의 '='도 보존.
                // dev/prod 이미지는 ${PROFILE}- 프리픽스로 분리 태깅(빌드타임 값이 다르므로).
                withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
                    sh '''
                        set -eu
                        # 필수 변수 존재는 Validate environment 스테이지에서 이미 검증됨
                        NEXT_PUBLIC_API_URL=$(grep -E '^NEXT_PUBLIC_API_URL=' "$ENV_FILE" | tail -n1 | cut -d= -f2-)
                        NEXT_PUBLIC_SALES_RADER_URL=$(grep -E '^NEXT_PUBLIC_SALES_RADER_URL=' "$ENV_FILE" | tail -n1 | cut -d= -f2-)
                        NEXT_PUBLIC_S3_HOSTNAME=$(grep -E '^NEXT_PUBLIC_S3_HOSTNAME=' "$ENV_FILE" | tail -n1 | cut -d= -f2-)

                        docker build \
                          --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
                          --build-arg NEXT_PUBLIC_SALES_RADER_URL="$NEXT_PUBLIC_SALES_RADER_URL" \
                          --build-arg NEXT_PUBLIC_S3_HOSTNAME="$NEXT_PUBLIC_S3_HOSTNAME" \
                          -t "$IMAGE_NAME:${PROFILE}-${GIT_SHA}" \
                          -t "$IMAGE_NAME:${PROFILE}-latest" \
                          .
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                // 기존 컨테이너 내리고 새로 올리기 (프로파일별 고정 이름)
                // 런타임 변수는 선택한 env 파일을 --env-file로 통째 주입.
                // prod는 동일 이미지(prod-latest)를 5000·5001 두 컨테이너로 띄운다.
                withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
                    sh '''
                        set -eu

                        deploy_one() {
                          name="$1"; host_port="$2"
                          docker stop "$name" 2>/dev/null || true
                          docker rm   "$name" 2>/dev/null || true
                          docker run -d \
                            --name "$name" \
                            --restart unless-stopped \
                            -p "${host_port}:${CONTAINER_PORT}" \
                            --env-file "$ENV_FILE" \
                            "$IMAGE_NAME:${PROFILE}-latest"
                        }

                        if [ "$PROFILE" = "dev" ]; then
                          deploy_one whale-erp-front-dev 4000
                        else
                          deploy_one whale-erp-front-prod-5000 5000
                          deploy_one whale-erp-front-prod-5001 5001
                        fi
                    '''
                }
            }
        }

        // stop·rm·run 방식은 새 컨테이너가 기동 직후 죽어도 되돌릴 이전 컨테이너가 없으므로,
        // 크래시 여부를 최소한으로 검증한다.
        stage('Smoke check') {
            steps {
                sh '''
                    set -eu
                    if [ "$PROFILE" = "dev" ]; then
                      NAMES="whale-erp-front-dev"
                    else
                      NAMES="whale-erp-front-prod-5000 whale-erp-front-prod-5001"
                    fi

                    sleep 5
                    for name in $NAMES; do
                      if [ "$(docker inspect -f '{{.State.Running}}' "$name")" != "true" ]; then
                        echo "❌ $name 기동 직후 종료됨. 최근 로그:"
                        docker logs --tail 80 "$name" || true
                        exit 1
                      fi
                      echo "✅ $name 정상 기동"
                    done
                '''
            }
        }
    }

    post {
        success {
            // 이미지/캐시 정리는 빌드 전 'Cleanup old images' 스테이지로 이동(디스크 꽉 차서 빌드 실패하는 상황 예방).
            notifyDiscord('✅ 성공', '3066993')   // green
        }
        failure {
            echo "배포 실패. 직전 이미지로 롤백하려면: docker run ... \"$IMAGE_NAME:${PROFILE}-<직전 SHA>\""
            notifyBuildFailureWithAnalysis()   // 실패 알림 + AI 원인 분석 합본
        }
        always {
            sh 'docker ps --filter "name=whale-erp-front" || true'
        }
    }
}

// pipeline 블록 바깥 — 성공/실패 공용 Discord 알림 함수
// 웹훅 URL은 Jenkins Credentials(Secret text, ID: discord-webhook)에서만 읽는다(하드코딩 금지).
def notifyDiscord(String status, String color) {
    withCredentials([string(credentialsId: 'discord-webhook', variable: 'WEBHOOK')]) {
        def duration = currentBuild.durationString.replace(' and counting', '')
        def payload = """
{
  "embeds": [{
    "title": "[${env.JOB_NAME}] #${env.BUILD_NUMBER} ${status}",
    "url": "${env.BUILD_URL}",
    "color": ${color},
    "fields": [
      {"name": "프로파일", "value": "${env.PROFILE ?: 'N/A'}",    "inline": true},
      {"name": "브랜치",   "value": "${env.GIT_BRANCH ?: 'N/A'}", "inline": true},
      {"name": "소요시간", "value": "${duration}",                "inline": true}
    ]
  }]
}
"""
        // JSON을 파일로 써서 보냄 — 인라인 -d 는 따옴표/특수문자에서 깨지기 쉬움
        writeFile file: 'discord_payload.json', text: payload
        sh 'curl -sS -H "Content-Type: application/json" -X POST -d @discord_payload.json "$WEBHOOK"'
    }
}

// pipeline 블록 바깥 — 빌드 실패 시: 콘솔 로그를 AI로 요약해 실패 알림 + 원인 분석을
// 한 메시지(합본)로 발송. AI가 실패/느려도 같은 임베드에 "분석 실패" 안내를 담아
// 실패 알림은 반드시 한 번 나가게 한다. 전 구간 try/catch로 빌드 상태에 영향 없음.
def notifyBuildFailureWithAnalysis() {
    def duration = currentBuild.durationString.replace(' and counting', '')

    // 콘솔 로그 확보 — rawBuild.getLog 는 In-process Script Approval 1회 승인 필요.
    //   못 읽으면 분석 없이 기본 실패 알림만.
    def gotLog = false
    try {
        def lines = currentBuild.rawBuild.getLog(300)
        writeFile file: 'build_raw.log', text: lines.join('\n')
        gotLog = true
    } catch (err) {
        echo "로그 확보 실패(스크립트 승인 필요 가능) - 분석 없이 기본 알림: ${err.message}"
    }
    if (!gotLog) {
        notifyDiscord('❌ 실패', '15158332')
        return
    }

    try {
        withEnv(["BUILD_DURATION=${duration}"]) {
            withCredentials([
                string(credentialsId: 'openrouter-api-key', variable: 'OPENROUTER_API_KEY'),
                string(credentialsId: 'discord-webhook',    variable: 'WEBHOOK')
            ]) {
                sh '''
set +ex   # 기본 -xe 해제: 키 노출 방지(+x) + best-effort 미중단(+e)

# 합본 임베드 발송: 첫 인자=분석 본문(description). 실패/폴백/성공 모두 이 함수로 한 메시지 발송.
send_combined() {
  jq -n --arg title "[$JOB_NAME] #$BUILD_NUMBER ❌ 실패" --arg url "${BUILD_URL}console" --arg desc "$1" --arg profile "${PROFILE:-N/A}" --arg branch "${GIT_BRANCH:-N/A}" --arg duration "${BUILD_DURATION:-N/A}" '{embeds:[{title:$title, url:$url, description:$desc, color:15158332, fields:[{name:"프로파일",value:$profile,inline:true},{name:"브랜치",value:$branch,inline:true},{name:"소요시간",value:$duration,inline:true}]}]}' > discord_fail_payload.json 2>/dev/null
  [ -s discord_fail_payload.json ] && curl -sS -H "Content-Type: application/json" -X POST -d @discord_fail_payload.json "$WEBHOOK" >/dev/null 2>&1 || true
}
FALLBACK="🔍 원인 분석 실패(jq/타임아웃/오류) — 콘솔 로그 확인 필요"

# jq 없으면 분석 불가 → 분석 없이 실패 알림만 발송
command -v jq >/dev/null 2>&1 || { echo "jq 미설치 - 분석 없이 발송"; send_combined "$FALLBACK"; exit 0; }

# 로그 정제: 노이즈 제거 → 마지막 200줄 → 줄당 500자 → 8KB 상한
grep -vE '^\\[Pipeline\\]|---> (Using cache|Running in|Removed intermediate container)' build_raw.log 2>/dev/null |
  tail -n 200 |
  cut -c -500 |
  head -c 8192 > build_clean.txt
[ -s build_clean.txt ] || cp build_raw.log build_clean.txt

# 키워드 기반 마스킹 (best-effort)
sed -E 's/([Bb]earer )[A-Za-z0-9._-]+/\\1***/g; s/(([Pp]assword|[Ss]ecret|[Tt]oken|[Aa]uthorization|[Aa]pi[_-]?[Kk]ey)[[:space:]]*[:=][[:space:]]*)[^[:space:],}]+/\\1***/g' build_clean.txt > build_masked.txt 2>/dev/null || cp build_clean.txt build_masked.txt

# OpenRouter 요청 JSON 생성 — jq --rawfile 로 로그 안전 임베드
PROMPT='whale-erp-front Jenkins 빌드가 실패했다. 아래는 콘솔 로그의 마지막 부분이다. 실패 원인을 한국어로 간결히 분석하라. 반드시 아래 형식으로 6줄·1000자 이내로 답하라.

원인: (한 줄 요약)
핵심 에러: (로그에서 근거가 된 실제 메시지 1~2줄)
제안 조치: (다음 행동 1~2개)

--- 로그 ---
'
jq -n --arg prompt "$PROMPT" --rawfile log build_masked.txt '{model:"google/gemma-4-31b-it:free", messages:[{role:"user", content:($prompt + $log)}]}' > or_req.json 2>/dev/null
[ -s or_req.json ] || { echo "요청 생성 실패 - 분석 없이 발송"; send_combined "$FALLBACK"; exit 0; }

# OpenRouter 호출 — 합본이라 알림이 응답을 기다림(보통 수초). 일시적 429(업스트림 한도)만 짧게 재시도.
SUMMARY=""
ATTEMPT=0
while [ "$ATTEMPT" -lt 3 ]; do
  ATTEMPT=$((ATTEMPT + 1))
  HTTP=$(curl --connect-timeout 5 --max-time 45 -sS -w "%{http_code}" -o or_resp.json \
    -H "Authorization: Bearer $OPENROUTER_API_KEY" -H "Content-Type: application/json" \
    -X POST -d @or_req.json https://openrouter.ai/api/v1/chat/completions 2>/dev/null)
  if [ "$HTTP" = "429" ]; then
    echo "429 업스트림 한도 - 재시도 $ATTEMPT/3"
    sleep 4
    continue
  fi
  break   # 200(또는 타임아웃) → 재시도 무의미, 빠져나감
done

# keep-alive 패딩(공백/콜론 라인) 제거 후 content 파싱
grep -vE '^[[:space:]]*$|^:' or_resp.json > or_resp_clean.json 2>/dev/null
[ -s or_resp_clean.json ] || cp or_resp.json or_resp_clean.json
SUMMARY=$(jq -r '.choices[0].message.content // empty' or_resp_clean.json 2>/dev/null)

# 요약 있으면 합본(실패+분석), 없으면 폴백(실패+분석실패) — 어느 쪽이든 실패 알림은 한 번 나감
if [ -n "$SUMMARY" ]; then
  send_combined "$(printf '🔍 원인 분석\\n%s' "$SUMMARY")"
else
  echo "AI 요약 없음(느림/오류) - 폴백 발송"
  send_combined "$FALLBACK"
fi
'''
            }
        }
    } catch (err) {
        echo "분석/발송 중 오류 - 기본 알림: ${err.message}"
        try { notifyDiscord('❌ 실패', '15158332') } catch (ignored) { echo "기본 알림도 실패: ${ignored.message}" }
    }
}
