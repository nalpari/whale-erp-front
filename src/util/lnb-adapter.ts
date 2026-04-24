import type { Program } from '@/lib/schemas/program'
import type { HeaderMenuItem } from '@/lib/schemas/menu'

/**
 * Program 트리(API 응답)를 LNB 가 사용하는 HeaderMenuItem 트리로 변환.
 *
 * 정책 (B-1 — 단순 활성 필터, 권한 화이트리스트 미적용):
 * - is_active === false 노드는 트리에서 제외 (재귀)
 * - order_index 오름차순 정렬
 * - path === null 은 '#' 으로 통일 (Lnb 가 클릭 분기에 사용)
 * - icon_url === null 은 undefined 로 변환 (Image 안전)
 * - children 빈 배열은 undefined (Lnb 가 children 유무로 분기)
 *
 * 권한별 LNB 가 필요해지면 authority.programs 화이트리스트를 추가 (B-2 로 확장).
 * 관련 결정: docs/plans/menus/lnb-program-sync.md 7.3
 */
export function toHeaderMenuItems(
  programs: Program[] | null | undefined
): HeaderMenuItem[] {
  if (!programs) return []

  return programs
    .filter((p) => p.is_active)
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((p) => {
      const children = toHeaderMenuItems(p.children)
      return {
        id: p.id ?? 0,
        name: p.name,
        link: p.path ?? '#',
        icon: p.icon_url ?? undefined,
        children: children.length > 0 ? children : undefined,
      }
    })
}
