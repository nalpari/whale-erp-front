'use client'

import { useIsMutating } from '@tanstack/react-query'
import CubeLoader from './CubeLoader'

export default function GlobalMutationSpinner() {
  const isMutating = useIsMutating()

  if (!isMutating) return null

  return (
    <div className="cube-loader-overlay">
      <CubeLoader />
    </div>
  )
}
