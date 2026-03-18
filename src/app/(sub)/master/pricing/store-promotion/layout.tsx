'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { OWNER_CODE } from '@/constants/owner-code'
import { useAlert } from '@/components/common/ui/Alert'

export default function StorePromotionLayout({ children }: { children: React.ReactNode }) {
  const ownerCode = useAuthStore((s) => s.ownerCode)
  const router = useRouter()
  const { alert } = useAlert()
  const alertShownRef = useRef(false)
  const isFranchise = ownerCode === OWNER_CODE.FRANCHISE

  useEffect(() => {
    if (isFranchise && !alertShownRef.current) {
      alertShownRef.current = true
      alert('접근 권한이 없습니다.').then(() => {
        router.replace('/')
      })
    }
    return () => {
      alertShownRef.current = false
    }
  }, [isFranchise, alert, router])

  if (!ownerCode || isFranchise) return null

  return <>{children}</>
}
