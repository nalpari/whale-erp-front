import type { OwnerCode } from '@/lib/schemas/authority'

/**
 * 권한 폼 컨텍스트
 * - 'platform': /system/authority/* — 플랫폼 관리자용. 권한 소유 라디오로 PLATFORM/본사/가맹점 모두 선택 가능
 * - 'bp': /settings/authority/* — 본사·가맹점 관리자용. owner_code 자동 결정, 권한 소유 라디오 숨김
 */
export type AuthorityFormContext = 'platform' | 'bp'

const PLATFORM_OWNER_CODE = 'PRGRP_001_001'

/**
 * 권한 종류(authority_kind) row 가시 여부.
 *
 * - BP context: 본사·가맹점 권한도 항상 권한 종류 필요
 * - PLATFORM context: PLATFORM owner 선택 시에만 표시 (본사/가맹점 owner 선택 시 숨김)
 *
 * AuthorityForm 의 렌더 가시 조건과 useAuthorityForm 의 검증/페이로드 가시 조건이
 * 동일하게 평가되도록 단일 정의 사용 — 양쪽이 어긋나면 "입력 UI 없는데 필수 에러" 회귀 발생.
 */
export const isKindRowVisible = (
  context: AuthorityFormContext,
  ownerCode?: OwnerCode | string,
): boolean => context === 'bp' || ownerCode === PLATFORM_OWNER_CODE

/**
 * 기초 권한(is_default) row 가시 여부.
 *
 * BP context + non-PLATFORM owner 일 때만 의미. 페이로드도 동일 조건에서만 전송.
 */
export const isBasicRowVisible = (
  context: AuthorityFormContext,
  ownerCode?: OwnerCode | string,
): boolean => context === 'bp' && ownerCode !== PLATFORM_OWNER_CODE

/**
 * 구독 권한(is_subscription) + 요금제(plan_type_code) row 가시 여부.
 *
 * PLATFORM context + PLATFORM owner 일 때만 표시. BP context 에서는 사용 안 함.
 */
export const isSubscriptionRowVisible = (
  context: AuthorityFormContext,
  ownerCode?: OwnerCode | string,
): boolean => context !== 'bp' && ownerCode === PLATFORM_OWNER_CODE
