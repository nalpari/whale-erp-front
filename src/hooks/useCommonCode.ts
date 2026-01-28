import { useCommonCodeHierarchy } from '@/hooks/queries'

export const useCommonCode = (code: string, enabled = true) => {
  const { data, isPending, error, refetch } = useCommonCodeHierarchy(code, enabled)

  return {
    children: data ?? [],
    loading: isPending,
    error: error?.message ?? null,
    refetch,
  }
}
