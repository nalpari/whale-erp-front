export const OWNER_CODE = {
  PLATFORM: 'PRGRP_001_001',
  HEAD_OFFICE: 'PRGRP_002_001',
  FRANCHISE: 'PRGRP_002_002',
} as const

export type OwnerCode = (typeof OWNER_CODE)[keyof typeof OWNER_CODE]

export const isAutoSelectAccount = (ownerCode: string | null): boolean =>
  ownerCode === OWNER_CODE.HEAD_OFFICE || ownerCode === OWNER_CODE.FRANCHISE
