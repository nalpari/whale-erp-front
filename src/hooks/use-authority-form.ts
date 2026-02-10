import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

import { getErrorMessage } from '@/lib/api'
import { authorityCreateSchema, authorityUpdateSchema } from '@/lib/schemas/authority'
import { formatZodError } from '@/lib/zod-utils'
import {
  useCreateAuthority,
  useUpdateAuthority,
} from '@/hooks/queries/use-authority-queries'
import { useProgramList } from '@/hooks/queries/use-program-queries'
import { useAuthStore } from '@/stores/auth-store'
import type {
  AuthorityCreateRequest,
  AuthorityUpdateRequest,
  AuthorityDetailNode,
  AuthorityResponse,
} from '@/lib/schemas/authority'

interface UseAuthorityFormOptions {
  mode: 'create' | 'edit'
  authorityId?: number
  initialAuthority?: AuthorityResponse
}

/**
 * 권한 생성/수정 폼 공통 로직 훅
 */
export function useAuthorityForm({ mode, authorityId, initialAuthority }: UseAuthorityFormOptions) {
  const router = useRouter()

  // 폼 데이터 상태
  const [formData, setFormData] = useState<Partial<AuthorityCreateRequest>>(() => {
    if (mode === 'edit' && initialAuthority) {
      return {
        owner_code: initialAuthority.owner_code as 'PRGRP_001_001' | 'PRGRP_002_001' | 'PRGRP_002_002',
        head_office_code: initialAuthority.head_office_code || undefined,
        franchisee_code: initialAuthority.franchisee_code || undefined,
        name: initialAuthority.name,
        is_used: initialAuthority.is_used,
        description: initialAuthority.description || undefined,
      }
    }
    return {
      owner_code: 'PRGRP_001_001',
      is_used: true,
    }
  })

  // 에러 상태
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 프로그램 트리 상태
  const [programTree, setProgramTree] = useState<AuthorityDetailNode[]>(() => {
    if (mode === 'edit' && initialAuthority?.details) {
      return initialAuthority.details
    }
    return []
  })

  // 로그인 유저의 권한 정보
  const currentAuthority = useAuthStore((state) => state.authority) as AuthorityResponse | null

  // 프로그램 목록 조회 (생성 모드에서만)
  const { data: programList } = useProgramList('MNKND_001')

  // Mutations
  const { mutateAsync: createAuthority } = useCreateAuthority()
  const { mutateAsync: updateAuthority } = useUpdateAuthority()

  // 생성 모드: 프로그램 목록을 트리 구조로 변환
  useEffect(() => {
    if (mode === 'create' && programList && programTree.length === 0) {
      interface ProgramNode {
        id: number | null
        name: string
        children?: ProgramNode[]
      }

      // 본인의 프로그램별 권한 찾기
      const findMyPermission = (programId: number): AuthorityDetailNode | undefined => {
        if (!currentAuthority?.details) return undefined

        const findInTree = (nodes: AuthorityDetailNode[]): AuthorityDetailNode | undefined => {
          for (const node of nodes) {
            if (node.program_id === programId) return node
            if (node.children) {
              const found = findInTree(node.children)
              if (found) return found
            }
          }
          return undefined
        }

        return findInTree(currentAuthority.details)
      }

      const convertToTree = (programs: ProgramNode[]): AuthorityDetailNode[] => {
        // 슈퍼 관리자 체크 (details가 비어있으면 슈퍼 관리자)
        const isAdmin = !currentAuthority?.details || currentAuthority.details.length === 0

        return programs
          .filter((program): program is ProgramNode & { id: number } => program.id !== null)
          .map((program) => {
            const myPermission = findMyPermission(program.id)

            return {
              program_id: program.id,
              program_name: program.name,
              can_read: false,
              can_create_delete: false,
              can_update: false,
              // 본인이 가진 최대 권한 (슈퍼 관리자는 모든 권한 가능)
              max_can_read: isAdmin ? true : (myPermission?.can_read ?? false),
              max_can_create_delete: isAdmin ? true : (myPermission?.can_create_delete ?? false),
              max_can_update: isAdmin ? true : (myPermission?.can_update ?? false),
              children: program.children ? convertToTree(program.children) : undefined,
            }
          })
      }

      setProgramTree(convertToTree(programList))
    }
  }, [mode, programList, programTree.length, currentAuthority])

  // 수정 모드: authority 변경 시 상태 업데이트
  useEffect(() => {
    if (mode === 'edit' && initialAuthority) {
      setFormData({
        owner_code: initialAuthority.owner_code as 'PRGRP_001_001' | 'PRGRP_002_001' | 'PRGRP_002_002',
        head_office_code: initialAuthority.head_office_code || undefined,
        franchisee_code: initialAuthority.franchisee_code || undefined,
        name: initialAuthority.name,
        is_used: initialAuthority.is_used,
        description: initialAuthority.description || undefined,
      })

      // 본인의 프로그램별 권한 찾기
      const findMyPermission = (programId: number): AuthorityDetailNode | undefined => {
        if (!currentAuthority?.details) return undefined

        const findInTree = (nodes: AuthorityDetailNode[]): AuthorityDetailNode | undefined => {
          for (const node of nodes) {
            if (node.program_id === programId) return node
            if (node.children) {
              const found = findInTree(node.children)
              if (found) return found
            }
          }
          return undefined
        }

        return findInTree(currentAuthority.details)
      }

      // max_can_* 필드 추가
      const addMaxPermissions = (nodes: AuthorityDetailNode[]): AuthorityDetailNode[] => {
        // 슈퍼 관리자 체크 (details가 비어있으면 슈퍼 관리자)
        const isAdmin = !currentAuthority?.details || currentAuthority.details.length === 0

        return nodes.map((node) => {
          const myPermission = findMyPermission(node.program_id)

          return {
            ...node,
            max_can_read: isAdmin ? true : (myPermission?.can_read ?? false),
            max_can_create_delete: isAdmin ? true : (myPermission?.can_create_delete ?? false),
            max_can_update: isAdmin ? true : (myPermission?.can_update ?? false),
            children: node.children ? addMaxPermissions(node.children) : undefined,
          }
        })
      }

      setProgramTree(addMaxPermissions(initialAuthority.details || []))
    }
  }, [mode, initialAuthority, currentAuthority])

  // 폼 데이터 변경 핸들러
  const handleFormChange = (data: Partial<AuthorityCreateRequest | AuthorityUpdateRequest>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  // 프로그램 트리 변경 핸들러
  const handleProgramTreeChange = (tree: AuthorityDetailNode[]) => {
    setProgramTree(tree)
  }

  // 폼 검증
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 생성 모드에서만 owner_code 검증
    if (mode === 'create' && !formData.owner_code) {
      newErrors.owner_code = '권한 소유를 선택해주세요'
    }

    // 권한명 검증
    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = '권한명을 입력해주세요'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '권한명은 2자 이상이어야 합니다'
    }

    // 운영여부 검증
    if (formData.is_used === undefined || formData.is_used === null) {
      newErrors.is_used = '운영여부를 선택해주세요'
    }

    // 본사 권한인 경우 본사 코드 필수
    if (formData.owner_code === 'PRGRP_002_001' && !formData.head_office_code) {
      newErrors.head_office_code = '본사를 선택해주세요'
    }

    // 가맹점 권한인 경우 본사/가맹점 코드 필수
    if (formData.owner_code === 'PRGRP_002_002') {
      if (!formData.head_office_code) {
        newErrors.head_office_code = '본사를 선택해주세요'
      }
      if (!formData.franchisee_code) {
        newErrors.franchisee_code = '가맹점을 선택해주세요'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 프로그램 트리 평탄화
  const flattenTree = (
    nodes: AuthorityDetailNode[]
  ): Array<{
    program_id: number
    can_read: boolean
    can_create_delete: boolean
    can_update: boolean
  }> => {
    const result: Array<{
      program_id: number
      can_read: boolean
      can_create_delete: boolean
      can_update: boolean
    }> = []

    const traverse = (node: AuthorityDetailNode) => {
      result.push({
        program_id: node.program_id,
        can_read: node.can_read ?? false,
        can_create_delete: node.can_create_delete ?? false,
        can_update: node.can_update ?? false,
      })

      if (node.children) {
        node.children.forEach(traverse)
      }
    }

    nodes.forEach(traverse)
    return result
  }

  // 저장 핸들러
  const handleSave = async () => {
    // 폼 검증
    if (!validateForm()) {
      return
    }

    // 에러 초기화
    setErrors({})

    try {
      if (mode === 'create') {
        // 생성 모드
        const createRequest: AuthorityCreateRequest = {
          owner_code: formData.owner_code!,
          head_office_code: formData.head_office_code,
          franchisee_code: formData.franchisee_code,
          name: formData.name!,
          is_used: formData.is_used!,
          description: formData.description,
          details: flattenTree(programTree),
        }

        // Zod 스키마 검증
        const validated = authorityCreateSchema.parse(createRequest)

        // API 호출
        await createAuthority(validated)

        // 성공 시 목록으로 이동
        alert('권한이 등록되었습니다.')
        router.push('/system/authority')
      } else {
        // 수정 모드
        if (!authorityId) {
          throw new Error('권한 ID가 없습니다.')
        }

        // 마스터 정보 수정
        const updateRequest: AuthorityUpdateRequest = {
          name: formData.name!,
          is_used: formData.is_used!,
          description: formData.description,
        }

        // Zod 스키마 검증
        const validated = authorityUpdateSchema.parse(updateRequest)

        // 마스터 정보 수정 API 호출
        await updateAuthority({ id: authorityId, data: validated })

        // 프로그램별 권한은 체크박스 클릭 시 실시간으로 업데이트됨 (낙관적 업데이트)

        // 성공 시 목록으로 이동
        alert('권한이 수정되었습니다.')
        router.push('/system/authority')
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        alert(`입력값 검증 실패:\n${formatZodError(error)}`)
      } else {
        alert(`권한 ${mode === 'create' ? '등록' : '수정'} 실패: ${getErrorMessage(error)}`)
      }
      console.error(`권한 ${mode === 'create' ? '등록' : '수정'} 실패:`, error)
    }
  }

  // 목록으로 이동
  const handleList = () => {
    router.push('/system/authority')
  }

  return {
    formData,
    errors,
    programTree,
    handleFormChange,
    handleProgramTreeChange,
    handleSave,
    handleList,
  }
}
