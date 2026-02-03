'use client'
import Location from '@/components/ui/Location'
import EmployeeInfoSettings from '@/components/employee/settings/EmployeeInfoSettings'

export default function EmployeeSettingsPage() {
  return (
    <>
      <Location title="직원 정보 공통코드" list={['홈', '직원 관리', '직원 정보 공통코드']} />
      <EmployeeInfoSettings />
    </>
  )
}
