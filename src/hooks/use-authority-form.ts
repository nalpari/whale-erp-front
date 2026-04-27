import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

import { getErrorMessage } from '@/lib/api'
import { authorityCreateSchema, authorityUpdateSchema } from '@/lib/schemas/authority'
import { formatZodError } from '@/lib/zod-utils'
import {
  useCreateAuthority,
  useUpdateAuthority,
} from '@/hooks/queries/use-authority-queries'
import { useAuthStore } from '@/stores/auth-store'
import { useAlert } from '@/components/common/ui'
import type {
  AuthorityCreateRequest,
  AuthorityUpdateRequest,
  AuthorityDetailNode,
  AuthorityResponse,
  OwnerCode,
} from '@/lib/schemas/authority'
import type { LoginAuthorityProgram } from '@/lib/schemas/auth'
import type { Program } from '@/lib/schemas/program'

/**
 * 권한관리 프로그램 경로 목록
 */
const AUTHORITY_MANAGEMENT_PATHS = ['/system/authority', '/settings/authority']

/**
 * 로그인 유저의 권한 트리에서 권한관리 프로그램(/system/authority, /settings/authority)
 * 매칭 노드들을 모두 모아 R/C/D/U 를 OR 합산한다.
 *
 * 정책 (Boston Code Review H3 — alias 정책 확정):
 * - 두 path 는 동일 권한관리 화면의 alias 로, 메뉴 트리상의 노출 위치만 다름.
 *   (system 메뉴 / 환경설정 메뉴 두 곳에서 진입 가능한 같은 페이지)
 * - 백엔드 권한관리 화면이 path-independent RBAC 으로 동작하므로
 *   "어느 한쪽이라도 R 권한 있으면 권한관리 페이지 R 가능" 의미가 옳다.
 * - 사용자별로 한쪽 path 만 권한 부여될 수도 있으므로 두 path 모두 매칭하여 합산.
 * - 권한 매핑이 없는 노드는 R/C/D/U 가 null 로 응답되므로, true 인 것만 합산.
 *
 * 주의: 두 path 가 미래에 서로 다른 화면으로 분리되면 이 OR 합산은 권한 상승 위험을 만듦.
 *       그 시점에는 path 별 R 가드로 C/U 합산 범위를 제한하는 정책으로 전환할 것.
 */
function findAuthorityManagementPermissions(
  programs: LoginAuthorityProgram[]
): { canManageRead: boolean; canManageCreateDelete: boolean; canManageUpdate: boolean } | null {
  const matches: LoginAuthorityProgram[] = []
  const walk = (nodes: LoginAuthorityProgram[]) => {
    for (const node of nodes) {
      if (node.path && AUTHORITY_MANAGEMENT_PATHS.includes(node.path)) {
        matches.push(node)
      }
      if (node.children && node.children.length > 0) {
        walk(node.children)
      }
    }
  }
  walk(programs)

  if (matches.length === 0) return null

  return {
    canManageRead: matches.some((n) => n.canRead === true),
    canManageCreateDelete: matches.some((n) => n.canCreateDelete === true),
    canManageUpdate: matches.some((n) => n.canUpdate === true),
  }
}

/**
 * 프로그램 목록을 권한 트리 구조로 변환
 */
function convertToTree(programs: Program[]): AuthorityDetailNode[] {
  return programs
    .filter((program): program is Program & { id: number } => program.id !== null)
    .map((program) => ({
      program_id: program.id,
      program_name: program.name,
      can_read: false,
      can_create_delete: false,
      can_update: false,
      children: program.children ? convertToTree(program.children) : undefined,
    }))
}

interface UseAuthorityFormOptions {
  mode: 'create' | 'edit'
  authorityId?: number
  initialAuthority?: AuthorityResponse
  programList?: Program[]
  listPath?: string
  defaultOwnerCode?: OwnerCode
}

/**
 * 권한 생성/수정 폼 공통 로직 훅
 */
export function useAuthorityForm({ mode, authorityId, initialAuthority, programList, listPath = '/system/authority', defaultOwnerCode = 'PRGRP_001_001' }: UseAuthorityFormOptions) {
  const router = useRouter()
  const { alert } = useAlert()

  // 폼 데이터 상태
  const [formData, setFormData] = useState<Partial<AuthorityCreateRequest>>(() => {
    if (mode === 'edit' && initialAuthority) {
      return {
        owner_code: initialAuthority.owner_code as OwnerCode,
        head_office_id: initialAuthority.head_office_id ?? undefined,
        franchisee_id: initialAuthority.franchisee_id ?? undefined,
        name: initialAuthority.name,
        is_bp_master: initialAuthority.is_bp_master ?? false,
        plan_type_code: initialAuthority.plan_type_code ?? undefined,
        is_used: initialAuthority.is_used,
        description: initialAuthority.description || undefined,
      }
    }
    return {
      owner_code: defaultOwnerCode,
      is_bp_master: false,
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
    if (mode === 'create' && programList) {
      return convertToTree(programList)
    }
    return []
  })

  // 로그인 유저의 권한 정보
  const loginAuthority = useAuthStore((state) => state.authority)

  // Mutations
  const { mutateAsync: createAuthority } = useCreateAuthority()
  const { mutateAsync: updateAuthority } = useUpdateAuthority()

  // 슈퍼 관리자 체크 (권한 데이터가 비어있으면 슈퍼 관리자)
  const isAdmin = !loginAuthority || loginAuthority.length === 0

  // 권한관리 메뉴에 대한 R/C/D/U로 조작 범위 결정
  const defaultPermissions = { canManageRead: false, canManageCreateDelete: false, canManageUpdate: false }
  const authorityMgmtPermissions = loginAuthority
    ? (findAuthorityManagementPermissions(loginAuthority) ?? defaultPermissions)
    : defaultPermissions

  const canManageRead = isAdmin || authorityMgmtPermissions.canManageRead
  const canManageCreateDelete = isAdmin || authorityMgmtPermissions.canManageCreateDelete
  const canManageUpdate = isAdmin || authorityMgmtPermissions.canManageUpdate

  // 폼 데이터 변경 핸들러
  const handleFormChange = (data: Partial<AuthorityCreateRequest & AuthorityUpdateRequest>) => {
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

    // BP Master 권한이 ON인 경우 요금제 필수 (생성 모드에서만 검증, 수정 시 BP Master 필드는 불변)
    if (mode === 'create' && formData.is_bp_master && !formData.plan_type_code) {
      newErrors.plan_type_code = '요금제를 선택해주세요'
    }

    // 운영여부 검증
    if (formData.is_used === undefined) {
      newErrors.is_used = '운영여부를 선택해주세요'
    }

    // 본사 권한인 경우 본사 ID 필수
    if (formData.owner_code === 'PRGRP_002_001' && !formData.head_office_id) {
      newErrors.head_office_id = '본사를 선택해주세요'
    }

    // 가맹점 권한인 경우 본사/가맹점 ID 필수
    if (formData.owner_code === 'PRGRP_002_002') {
      if (!formData.head_office_id) {
        newErrors.head_office_id = '본사를 선택해주세요'
      }
      if (!formData.franchisee_id) {
        newErrors.franchisee_id = '가맹점을 선택해주세요'
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

    try {
      if (mode === 'create') {
        // 생성 모드 - validateForm() 통과 후이므로 필수 필드 존재 보장
        if (!formData.owner_code || !formData.name || formData.is_used === undefined) {
          throw new Error('필수 필드가 누락되었습니다')
        }

        const createRequest: AuthorityCreateRequest = {
          owner_code: formData.owner_code,
          head_office_id: formData.head_office_id,
          franchisee_id: formData.franchisee_id,
          name: formData.name,
          is_bp_master: formData.is_bp_master ?? false,
          plan_type_code: formData.is_bp_master && formData.plan_type_code ? formData.plan_type_code : undefined,
          is_used: formData.is_used,
          description: formData.description,
          details: flattenTree(programTree),
        }

        // Zod 스키마 검증
        const validated = authorityCreateSchema.parse(createRequest)

        // API 호출
        await createAuthority(validated)

        // 성공 시 목록으로 이동
        await alert('권한이 등록되었습니다.')
        router.push(listPath)
      } else {
        // 수정 모드
        if (!authorityId) {
          throw new Error('권한 ID가 없습니다.')
        }

        // 마스터 정보 수정 - validateForm() 통과 후이므로 필수 필드 존재 보장
        if (!formData.name || formData.is_used === undefined) {
          throw new Error('필수 필드가 누락되었습니다')
        }

        // BP Master 권한 여부, 요금제는 등록 시 결정되며 수정 불가
        const updateRequest: AuthorityUpdateRequest = {
          name: formData.name,
          is_used: formData.is_used,
          description: formData.description,
        }

        // Zod 스키마 검증
        const validated = authorityUpdateSchema.parse(updateRequest)

        // 마스터 정보 수정 API 호출
        await updateAuthority({ id: authorityId, data: validated })

        // 프로그램별 권한은 체크박스 클릭 시 실시간으로 업데이트됨 (낙관적 업데이트)

        // 성공 시 목록으로 이동
        await alert('권한이 수정되었습니다.')
        router.push(listPath)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        await alert(`입력값 검증 실패:\n${formatZodError(error)}`)
      } else {
        await alert(getErrorMessage(error))
      }
      console.error(`권한 ${mode === 'create' ? '등록' : '수정'} 실패:`, error)
    }
  }

  // 목록으로 이동
  const handleList = () => {
    router.push(listPath)
  }

  return {
    formData,
    errors,
    programTree,
    canManageRead,
    canManageCreateDelete,
    canManageUpdate,
    handleFormChange,
    handleProgramTreeChange,
    handleSave,
    handleList,
  }
}
