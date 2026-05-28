import { useAuthStore } from '@/stores/auth-store'
import type { AccountType } from '@/lib/schemas/auth'

export interface AccountPolicy {
  accountType: AccountType | null
  affiliationId: string | null
  defaultHeadOfficeId: number | null
  isPlatformAdmin: boolean
  isHeadOfficeAdmin: boolean
  isFranchiseAdmin: boolean
  franchiseAffiliationId: number | null
  shouldAutoSelectOffice: boolean
  isOfficeFixed: boolean
  isFranchiseFixed: boolean
}

export function useAccountPolicy(): AccountPolicy {
  const accountType = useAuthStore((s) => s.accountType)
  const affiliationId = useAuthStore((s) => s.affiliationId)
  const defaultHeadOfficeId = useAuthStore((s) => s.defaultHeadOfficeId)

  const isPlatformAdmin = accountType === 'PLATFORM'
  const isHeadOfficeAdmin = accountType === 'HEAD_OFFICE'
  const isFranchiseAdmin = accountType === 'FRANCHISE'

  const franchiseAffiliationId =
    isFranchiseAdmin && affiliationId != null ? Number(affiliationId) : null

  const shouldAutoSelectOffice =
    defaultHeadOfficeId != null &&
    (isPlatformAdmin || isHeadOfficeAdmin || isFranchiseAdmin)

  const isOfficeFixed = shouldAutoSelectOffice

  const isFranchiseFixed =
    isFranchiseAdmin &&
    franchiseAffiliationId != null &&
    Number.isFinite(franchiseAffiliationId)

  return {
    accountType,
    affiliationId,
    defaultHeadOfficeId,
    isPlatformAdmin,
    isHeadOfficeAdmin,
    isFranchiseAdmin,
    franchiseAffiliationId,
    shouldAutoSelectOffice,
    isOfficeFixed,
    isFranchiseFixed,
  }
}
