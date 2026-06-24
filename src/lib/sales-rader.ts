import axios from 'axios'
import { env } from '@/lib/schemas/env'

/**
 * sales-rader(Bizzle 카드매출 스크래퍼, FastAPI) 직접 호출용 axios 인스턴스.
 *
 * 일반 API 호출은 `@/lib/api`(whale-erp-api :8080)를 사용하지만, 변조방지 가드의
 * 1회용 import-key 발급(`POST /api/import-key`)만은 whale-erp-api 중계를 거치지 않고
 * 브라우저에서 sales-rader 로 **직접** 호출한다.
 *
 * - 인증 헤더(Bearer/affiliation)를 붙이지 않는다. import-key 발급은 무인증이며,
 *   sales-rader 는 CORS 로 front origin 만 허용한다(서버 측 allow_origins).
 * - baseURL 은 환경별로 분리: 로컬 `http://localhost:7000`(docker-compose 127.0.0.1:7000:8000),
 *   운영 `https://bizzle.whaleerp.co.kr`. (`NEXT_PUBLIC_SALES_RADER_URL`)
 * - 응답은 whale-erp 공통 envelope(`{ data: ... }`)가 아니라 sales-rader 원본 그대로다.
 */
const salesRader = axios.create({
  baseURL: env.NEXT_PUBLIC_SALES_RADER_URL,
})

export default salesRader
