import { z } from 'zod';
import { apiResponseSchema, pageResponseSchema } from './api';

/**
 * 헤더 메뉴 아이템 스키마 (재귀적)
 */
export const headerMenuItemSchema: z.ZodType<HeaderMenuItem> = z.lazy(() =>
  z.object({
    id: z.number(),
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
  id: number;
  name: string;
  icon?: string;
  link: string;
  children?: HeaderMenuItem[];
}

/**
 * 타입 추출
 */
export type HeaderMenu = z.infer<typeof headerMenuSchema>;

/**
 * 메뉴 이미지 파일 스키마
 */
export const menuImageFileSchema = z.object({
  id: z.number(),
  fileName: z.string(),
  fileUrl: z.string(),
});

/**
 * 메뉴 카테고리 응답 스키마
 */
export const menuCategoryResponseSchema = z.object({
  id: z.number(),
  categoryName: z.string(),
});

/**
 * 메뉴 옵션 SET 응답 스키마
 */
export const menuOptionSetResponseSchema = z.object({
  id: z.number(),
  optionSetName: z.string(),
});

/**
 * 메뉴 응답 스키마 (Master Menu 목록/상세)
 */
export const menuResponseSchema = z.object({
  id: z.number(),
  marketingTags: z.array(z.string()).nullable(),
  temperatureTags: z.array(z.string()).nullable(),
  operationStatus: z.string(),
  menuName: z.string(),
  menuNameEng: z.string().nullable(),
  menuNameChs: z.string().nullable(),
  menuNameCht: z.string().nullable(),
  menuNameJpn: z.string().nullable(),
  menuProperty: z.string(),
  bpId: z.number().nullable(),
  companyName: z.string().nullable(),
  menuType: z.string(),
  setStatus: z.string(),
  menuClassificationCode: z.string().nullable(),
  categories: z.array(menuCategoryResponseSchema).nullable(),
  salePrice: z.number().nullable(),
  discountPrice: z.number().nullable(),
  taxType: z.string().nullable(),
  description: z.string().nullable(),
  displayOrder: z.number().nullable(),
  optionSets: z.array(menuOptionSetResponseSchema).nullable(),
  createdBy: z.number().nullable(),
  updatedBy: z.number().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  menuImgFile: menuImageFileSchema.nullable(),
  masterMenuName: z.string().nullable(),
  masterMenuCode: z.string().nullable(),
});

/**
 * 메뉴 목록 페이징 응답 스키마
 */
export const menuListResponseSchema = apiResponseSchema(pageResponseSchema(menuResponseSchema));

/**
 * 타입 추출
 */
export type MenuResponse = z.infer<typeof menuResponseSchema>;
export type MenuCategoryResponse = z.infer<typeof menuCategoryResponseSchema>;
export type MenuOptionSetResponse = z.infer<typeof menuOptionSetResponseSchema>;
export type MenuImageFile = z.infer<typeof menuImageFileSchema>;
