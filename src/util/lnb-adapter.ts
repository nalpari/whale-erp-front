import type { Program } from '@/lib/schemas/program'
import type { LoginAuthorityProgram } from '@/lib/schemas/auth'
import type { HeaderMenuItem } from '@/lib/schemas/menu'

/**
 * 로그인 사용자의 권한 트리에서 canRead === true 인 program id 집합 추출.
 * 그룹 노드 중 canRead 가 null/false 라도 자식이 통과하면 부모는 자동으로 표시되므로
 * 화이트리스트에는 leaf 노드(실제 권한이 부여된 항목) 만 들어와도 충분하다.
 */
function collectReadableIds(
  authorityPrograms: LoginAuthorityProgram[] | null | undefined,
): Set<number> {
  const acc = new Set<number>()
  if (!authorityPrograms) return acc
  const walk = (nodes: LoginAuthorityProgram[]) => {
    for (const n of nodes) {
      if (n.canRead === true) acc.add(n.id)
      if (n.children) walk(n.children)
    }
  }
  walk(authorityPrograms)
  return acc
}

/**
 * Program 트리(API 응답)를 LNB 가 사용하는 HeaderMenuItem 트리로 변환.
 *
 * 정책 (B-3+ — 권한 화이트리스트 + 그룹 자동 표시):
 * - is_active === false 노드는 트리에서 제외
 * - leaf 노드 (path 가 있는 실제 페이지): authority 의 canRead === true 인 id 만 통과
 * - 그룹 노드 (path === null + children 있음): 자식 중 통과된 게 하나라도 있으면 자동 표시
 * - order_index 오름차순 정렬
 * - icon_url === null 은 undefined 로 변환 (Image 안전)
 * - children 빈 배열은 undefined (Lnb 가 children 유무로 분기)
 *
 * 관련 결정: docs/plans/menus/lnb-program-sync.md 7.3
 */
export function toHeaderMenuItems(
  programs: Program[] | null | undefined,
  authorityPrograms: LoginAuthorityProgram[] | null | undefined,
): HeaderMenuItem[] {
  if (!programs) return []
  const readable = collectReadableIds(authorityPrograms)

  const map = (nodes: Program[]): HeaderMenuItem[] =>
    nodes
      .map((p) => ({ p, children: p.children ? map(p.children) : [] }))
      .filter(({ p, children }) => {
        if (!p.is_active) return false
        // 그룹 노드: 자식 중 통과된 게 있으면 표시
        if (p.path === null && children.length > 0) return true
        // leaf 노드: 권한 화이트리스트 통과 필요
        return p.id !== null && readable.has(p.id)
      })
      .sort((a, b) => a.p.order_index - b.p.order_index)
      .map(({ p, children }) => ({
        id: p.id ?? 0,
        name: p.name,
        link: p.path ?? '#',
        icon: p.icon_url ?? undefined,
        children: children.length > 0 ? children : undefined,
      }))

  return map(programs)
}
