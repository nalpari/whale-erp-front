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
                        NEXT_PUBLIC_S3_HOSTNAME=$(grep -E '^NEXT_PUBLIC_S3_HOSTNAME=' "$ENV_FILE" | tail -n1 | cut -d= -f2-)

                        docker build \
                          --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
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
            // 더 이상 참조되지 않는 dangling 이미지 정리(디스크 보호)
            // NOTE: ${PROFILE}-<SHA> 태그 이미지는 누적되므로, 쌓이면 추후 보관 개수 제한 정리 추가
            sh 'docker image prune -f'
        }
        failure {
            echo "배포 실패. 직전 이미지로 롤백하려면: docker run ... \"$IMAGE_NAME:${PROFILE}-<직전 SHA>\""
        }
        always {
            sh 'docker ps --filter "name=whale-erp-front" || true'
        }
    }
}
