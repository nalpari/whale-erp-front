import { z } from 'zod'
import { apiResponseSchema } from '@/lib/schemas/api'

/**
 * 점포 옵션(드롭다운) 응답 스키마.
 *
 * `franchiseId`/`headOfficeId`는 상호 배타적이다(정확히 한쪽만 non-null):
 * - 직영 점포: `headOfficeId` 값, `franchiseId == null`
 * - 가맹 산하 점포: `franchiseId` 값, `headOfficeId == null`
 *
 * `filterStoreOptionsByOwner`(src/util/store-options.ts)가 `franchiseId == null` 여부로
 * 직영/가맹을 가르므로, BE가 이 불변식을 어기거나 필드를 누락(키 오타·NamingStrategy 변경 등)하면
 * 필터가 조용히 오동작한다. `.refine()`으로 개발 단계에서 이를 포착한다.
 * (`validateApiResponse`는 개발 모드에서만 safeParse → console.warn, 프로덕션은 패스스루)
 */
export const storeOptionSchema = z
  .object({
    id: z.number(), // 점포 ID (와이어 키도 id)
    storeName: z.string(), // 점포명
    franchiseId: z.number().nullable(), // 가맹 점포일 때만 값 (직영이면 null)
    headOfficeId: z.number().nullable(), // 직영 점포일 때만 값 (가맹 산하이면 null)
  })
  .refine((s) => (s.franchiseId == null) !== (s.headOfficeId == null), {
    message: 'franchiseId와 headOfficeId는 상호 배타적이어야 합니다(정확히 한쪽만 값).',
  })

export const storeOptionListResponseSchema = apiResponseSchema(z.array(storeOptionSchema))
