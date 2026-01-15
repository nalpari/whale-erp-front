import { z } from 'zod';

/**
 * 헤더 메뉴 아이템 스키마 (재귀적)
 */
export const headerMenuItemSchema: z.ZodType<HeaderMenuItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string().optional(),
    link: z.string(),
    children: z.array(headerMenuItemSchema).optional(),
  })
);

/**
 * 헤더 메뉴 배열 스키마
 */
export const headerMenuSchema = z.array(headerMenuItemSchema);

/**
 * 헤더 메뉴 아이템 타입
 */
export interface HeaderMenuItem {
  id: string;
  name: string;
  icon?: string;
  link: string;
  children?: HeaderMenuItem[];
}

/**
 * 타입 추출
 */
export type HeaderMenu = z.infer<typeof headerMenuSchema>;
