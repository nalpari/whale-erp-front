'use client'

import { useMemo } from 'react'
import { useBp } from '@/hooks/useBp'
import { useStoreOptions } from '@/hooks/store/useStore'
import { useAuthStore } from '@/stores/auth-store'
import type { BpHeadOfficeNode } from '@/types/bp'

export interface SelectOption {
  value: number
  label: string
}

export type OfficeFranchiseStoreValue = {
  head_office: number | null
  franchise: number | null
  store: number | null
}

type HeadOfficeFranchiseStoreSelectProps = {
  officeId: number | null
  franchiseId: number | null
  storeId: number | null
  onChange: (value: OfficeFranchiseStoreValue) => void
}

const buildOfficeOptions = (bpTree: BpHeadOfficeNode[]) =>
  bpTree.map((office) => ({ value: office.id, label: office.name }))

const buildFranchiseOptions = (bpTree: BpHeadOfficeNode[], officeId: number | null) =>
  officeId
    ? bpTree
        .find((office) => office.id === officeId)
        ?.franchises.map((franchise) => ({ value: franchise.id, label: franchise.name })) ?? []
    : bpTree.flatMap((office) =>
        office.franchises.map((franchise) => ({ value: franchise.id, label: franchise.name }))
      )

export default function HeadOfficeFranchiseStoreSelect({
  officeId,
  franchiseId,
  storeId,
  onChange,
}: HeadOfficeFranchiseStoreSelectProps) {
  const { accessToken, affiliationId } = useAuthStore()
  const isReady = Boolean(accessToken && affiliationId)
  const { data: bpTree, loading: bpLoading } = useBp(isReady)
  const officeOptions = useMemo(() => buildOfficeOptions(bpTree), [bpTree])
  const franchiseOptions = useMemo(() => buildFranchiseOptions(bpTree, officeId), [bpTree, officeId])
  const { options: storeOptionList, loading: storeLoading } = useStoreOptions(
    officeId ?? undefined,
    franchiseId ?? undefined,
    isReady
  )
  const storeOptions = useMemo(
    () => storeOptionList.map((option) => ({ value: option.id, label: option.storeName })),
    [storeOptionList]
  )

  return (
    <>
      <th>본사</th>
      <td>
        <div className="data-filed">
          <select
            className="select-form"
            value={officeId ?? ''}
            onChange={(event) => {
              const nextOfficeId = event.target.value ? Number(event.target.value) : null
              const nextFranchiseOptions = nextOfficeId
                ? bpTree.find((office) => office.id === nextOfficeId)?.franchises ?? []
                : bpTree.flatMap((office) => office.franchises)
              const shouldClearFranchise =
                franchiseId !== null &&
                franchiseId !== undefined &&
                !nextFranchiseOptions.some((franchise) => franchise.id === franchiseId)

              onChange({
                head_office: nextOfficeId,
                franchise: shouldClearFranchise ? null : franchiseId ?? null,
                store: null,
              })
            }}
            disabled={bpLoading}
          >
            <option value="">전체</option>
            {officeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </td>
      <th>가맹점</th>
      <td>
        <div className="data-filed">
          <select
            className="select-form"
            value={franchiseId ?? ''}
            onChange={(event) =>
              onChange({
                head_office: officeId,
                franchise: event.target.value ? Number(event.target.value) : null,
                store: null,
              })
            }
            disabled={bpLoading}
          >
            <option value="">전체</option>
            {franchiseOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </td>
      <th>점포</th>
      <td>
        <div className="data-filed">
          <select
            className="select-form"
            value={storeId ?? ''}
            onChange={(event) =>
              onChange({
                head_office: officeId,
                franchise: franchiseId,
                store: event.target.value ? Number(event.target.value) : null,
              })
            }
            disabled={storeLoading}
          >
            <option value="">전체</option>
            {storeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>           
      </td>
    </>
  )
}
