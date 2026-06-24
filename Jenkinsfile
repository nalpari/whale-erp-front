// whale-erp-front 개발 서버 배포 파이프라인
// 플로우: develop pull → 로컬 docker build(SHA+latest) → 기존 컨테이너 stop·rm → run → prune
// 빌드/실행을 같은 서버에서 수행하므로 레지스트리(ECR) push/pull은 하지 않는다.
//
// ── 사전 준비 (Jenkins Credentials) ────────────────────────────────────────
//   whaleerp-front-dev-env  →  "Secret file" 타입으로 .env.development 업로드
//     - 빌드타임 변수(NEXT_PUBLIC_*)는 이 파일에서 추출해 --build-arg 로 주입(번들에 박힘)
//     - 런타임 변수(ANTHROPIC_API_KEY, BUSINESS_VALIDATE_KEY 등)는 docker run --env-file 로 주입
//
//   ⚠️ .env.development 작성 규칙 (docker --env-file 파싱 함정 주의):
//     - KEY=value 형식, 값에 따옴표(" ') 감싸지 말 것 → 따옴표가 값에 그대로 포함됨
//     - 주석은 줄 맨 앞 #만 허용, 인라인 주석(KEY=val # ...) 금지 → '# ...'가 값에 포함됨
//
// ── 서버 사전 확인 ─────────────────────────────────────────────────────────
//   - jenkins 유저가 docker 그룹 소속인지: `groups jenkins`
//   - 방화벽/보안그룹에서 4000 포트 개방
//   - develop repo가 private면 Jenkins에 Git credential 등록

pipeline {
    agent any

    options {
        disableConcurrentBuilds()   // 동시 배포로 인한 컨테이너 교체 충돌 방지
        timestamps()
    }

    environment {
        IMAGE_NAME     = 'whale-erp-front'
        CONTAINER_NAME = 'whale-erp-front'
        HOST_PORT      = '4000'   // 외부 노출 포트
        CONTAINER_PORT = '3000'   // 컨테이너 내부 앱 포트 (Next standalone server.js)
        ENV_CRED_ID    = 'whaleerp-front-dev-env'   // .env.development (Secret file)
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                // 백엔드 컨벤션과 동일하게 전체 SHA를 이미지 태그로 사용
                script {
                    env.GIT_SHA = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                }
                echo "Deploying commit ${env.GIT_SHA}"
            }
        }

        // 빌드/배포 전에 .env.development에 필수 변수가 있는지 먼저 검증한다.
        // "빌드는 됐는데 OCR·사업자검증만 런타임에 깨지는" 사고를 빌드 전에 차단.
        stage('Validate environment') {
            steps {
                withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
                    sh '''
                        set -eu
                        set -a; . "$ENV_FILE"; set +a

                        # 빌드타임 필수 (번들에 박혀야 프론트가 백엔드 API를 찾음)
                        : "${NEXT_PUBLIC_API_URL:?.env.development에 NEXT_PUBLIC_API_URL 누락 - 프론트가 백엔드 API를 못 찾음}"

                        # 런타임 필수 시크릿 (없으면 해당 기능만 런타임에 실패)
                        : "${ANTHROPIC_API_KEY:?.env.development에 ANTHROPIC_API_KEY 누락 - OCR(사업자등록증 인식) 런타임 실패}"
                        : "${BUSINESS_VALIDATE_KEY:?.env.development에 BUSINESS_VALIDATE_KEY 누락 - 사업자 검증 런타임 실패}"

                        # NEXT_PUBLIC_S3_HOSTNAME은 next.config.ts에 기본값이 있어 필수는 아님
                        if [ -z "${NEXT_PUBLIC_S3_HOSTNAME:-}" ]; then
                          echo "⚠️  NEXT_PUBLIC_S3_HOSTNAME 미정의 - next.config.ts 기본 버킷으로 빌드됨"
                        fi

                        echo "✅ 필수 환경변수 확인 완료"
                    '''
                }
            }
        }

        // 빌드가 성공한 뒤에야 Deploy 단계로 넘어가므로,
        // 빌드 실패 시 기존 컨테이너는 그대로 살아있다(다운타임 없음).
        stage('Build image') {
            steps {
                // .env.development(Secret file)에서 빌드타임 변수만 추출해 --build-arg로 주입.
                // grep 앵커(^KEY=)로 주석 줄은 제외, cut -f2-로 값 안의 '='도 보존.
                withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
                    sh '''
                        # 필수 변수 존재는 Validate environment 스테이지에서 이미 검증됨
                        NEXT_PUBLIC_API_URL=$(grep -E '^NEXT_PUBLIC_API_URL=' "$ENV_FILE" | tail -n1 | cut -d= -f2-)
                        NEXT_PUBLIC_S3_HOSTNAME=$(grep -E '^NEXT_PUBLIC_S3_HOSTNAME=' "$ENV_FILE" | tail -n1 | cut -d= -f2-)

                        docker build \
                          --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
                          --build-arg NEXT_PUBLIC_S3_HOSTNAME="$NEXT_PUBLIC_S3_HOSTNAME" \
                          -t "$IMAGE_NAME:$GIT_SHA" \
                          -t "$IMAGE_NAME:latest" \
                          .
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                // 기존 컨테이너 내리고 새로 올리기 (이름 고정)
                // 런타임 변수는 .env.development를 --env-file로 통째 주입.
                withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
                    sh '''
                        docker stop "$CONTAINER_NAME" || true
                        docker rm   "$CONTAINER_NAME" || true

                        docker run -d \
                          --name "$CONTAINER_NAME" \
                          --restart unless-stopped \
                          -p "$HOST_PORT:$CONTAINER_PORT" \
                          --env-file "$ENV_FILE" \
                          "$IMAGE_NAME:latest"
                    '''
                }
            }
        }

        // stop·rm·run 방식은 새 컨테이너가 기동 직후 죽어도 되돌릴 이전 컨테이너가 없으므로,
        // 크래시 여부를 최소한으로 검증한다.
        stage('Smoke check') {
            steps {
                sh '''
                    sleep 5
                    if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME")" != "true" ]; then
                      echo "❌ 컨테이너가 기동 직후 종료됨. 최근 로그:"
                      docker logs --tail 80 "$CONTAINER_NAME" || true
                      exit 1
                    fi
                    echo "✅ 컨테이너 정상 기동 (http://<서버IP>:$HOST_PORT)"
                '''
            }
        }
    }

    post {
        success {
            // 더 이상 참조되지 않는 dangling 이미지 정리(디스크 보호)
            sh 'docker image prune -f'
        }
        failure {
            echo '배포 실패. 직전 SHA 이미지로 롤백하려면: docker run ... "$IMAGE_NAME:<직전 SHA>"'
        }
        always {
            sh 'docker ps --filter "name=$CONTAINER_NAME" || true'
        }
    }
}
