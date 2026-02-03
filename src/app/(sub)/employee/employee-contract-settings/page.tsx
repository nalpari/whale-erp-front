'use client'
import Location from '@/components/ui/Location'
import LaborContractSettings from '@/components/employee/settings/LaborContractSettings'

export default function LaborContractSettingsPage() {
  return (
    <>
      <Location title="근로계약서 공통" list={['홈', '직원 관리', '근로계약서 공통']} />
      <LaborContractSettings />
    </>
  )
}
