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
  originalFileName: z.string(),
  storedFileName: z.string(),
  fileExtension: z.string(),
  fileSize: z.number(),
  contentType: z.string(),
  uploadFileType: z.string(),
  uploadFileCategory: z.string(),
  referenceType: z.string(),
  referenceId: z.number(),
  isPublic: z.boolean(),
  publicUrl: z.string().nullable(),
  createdAt: z.string(),
});

/**
 * 메뉴 카테고리 응답 스키마
 */
export const menuCategoryResponseSchema = z.object({
  menuCategoryId: z.number(),
  categoryId: z.number(),
  menuId: z.number(),
  name: z.string(),
  isActive: z.boolean(),
});

/**
 * 메뉴 옵션 SET 응답 스키마
 */
export const menuOptionSetResponseSchema = z.object({
  id: z.number(),
  setName: z.string(),
});

/**
 * 메뉴 응답 스키마 (Master Menu 목록/상세)
 */
export const menuResponseSchema = z.object({
  id: z.number(),
  menuCode: z.string().nullable().optional(),
  marketingTags: z.array(z.string()).nullable(),
  temperatureTags: z.array(z.string()).nullable(),
  operationStatus: z.string(),
  menuName: z.string(),
  menuNameEng: z.string().nullable(),
  menuNameChs: z.string().nullable(),
  menuNameCht: z.string().nullable(),
  menuNameJpn: z.string().nullable(),
  menuGroup: z.string(),
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

/**
 * 옵션 항목 상세 응답 스키마
 */
export const menuOptionItemDetailSchema = z.object({
  id: z.number(),
  optionSetId: z.number().optional(),
  optionSetItemId: z.number().optional(),
  optionName: z.string(),
  optionSetItemName: z.string().optional(),
  optionSetItemCode: z.string().optional(),
  operationStatus: z.string().optional(),
  additionalPrice: z.number(),
  isQuantity: z.boolean(),
  quantity: z.number().optional(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  displayOrder: z.number().nullable().optional(),
});

/**
 * 옵션 SET 상세 응답 스키마
 */
export const menuOptionSetDetailSchema = z.object({
  id: z.number(),
  setName: z.string(),
  isRequired: z.boolean(),
  isMultipleChoice: z.boolean(),
  displayOrder: z.number().nullable(),
  isActive: z.boolean(),
  optionSetItems: z.array(menuOptionItemDetailSchema).nullable().default(null),
});

/**
 * 메뉴 상세 응답 스키마 (옵션 SET 상세 포함)
 */
export const menuDetailResponseSchema = menuResponseSchema.extend({
  isActive: z.boolean().optional(),
  optionSets: z.array(menuOptionSetDetailSchema).nullable(),
});

/**
 * 상세 응답 타입 추출
 */
export type MenuOptionItemDetail = z.infer<typeof menuOptionItemDetailSchema>;
export type MenuOptionSetDetail = z.infer<typeof menuOptionSetDetailSchema>;
export type MenuDetailResponse = z.infer<typeof menuDetailResponseSchema>;

/**
 * 옵션 항목 폼 스키마
 */
export const optionItemFormSchema = z.object({
  id: z.number().optional(),
  optionSetItemId: z.number().nullable().optional(),
  optionName: z.string().min(1, '필수 입력 항목입니다.'),
  additionalPrice: z.number().default(0),
  isQuantity: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  displayOrder: z.number().nullable().optional(),
  // 옵션찾기로 선택된 메뉴의 표시용 메타데이터
  selectedMenuCode: z.string().nullable().optional(),
  selectedOperationStatus: z.string().nullable().optional(),
});

/**
 * 옵션 SET 폼 스키마
 */
export const optionSetFormSchema = z.object({
  id: z.number().optional(),
  setName: z.string().min(1, '필수 입력 항목입니다.'),
  isRequired: z.boolean().default(false),
  isMultipleChoice: z.boolean().default(false),
  displayOrder: z.number().nullable().default(null),
  isActive: z.boolean().default(true),
  optionItems: z.array(optionItemFormSchema).min(1, '옵션을 1개 이상 추가해주세요'),
});

/**
 * 메뉴 등록 폼 스키마
 */
export const menuFormSchema = z.object({
  // 기본 정보
  menuOwnership: z.enum(['HEAD_OFFICE', 'FRANCHISE']),
  bpId: z.number({ error: '필수 선택 항목입니다.' }),
  menuGroup: z.string(),
  storeId: z.number().nullable().default(null),

  // 메뉴 정보
  operationStatus: z.string(),
  menuType: z.string().min(1, '필수 선택 항목입니다.'),
  setStatus: z.string(),
  menuClassificationCode: z.string().min(1, '필수 선택 항목입니다.'),
  menuName: z.string().min(1, '필수 입력 항목입니다.'),
  menuNameEng: z.string().nullable().default(null),
  menuNameChs: z.string().nullable().default(null),
  menuNameCht: z.string().nullable().default(null),
  menuNameJpn: z.string().nullable().default(null),
  taxType: z.string(),
  marketingTags: z.array(z.string()).default([]),
  temperatureTags: z.array(z.string()).default([]),
  displayOrder: z.number().nullable().default(null),
  description: z.string().min(1, '필수 입력 항목입니다.'),

  // 옵션 SET (여러 개)
  optionSets: z.array(optionSetFormSchema).default([]),

  // 카테고리
  categories: z.array(z.object({ id: z.number().optional(), categoryId: z.number() })).min(1, '필수 선택 항목입니다.'),
});

/**
 * 폼 타입 추출
 */
export type OptionItemFormData = z.infer<typeof optionItemFormSchema>;
export type OptionSetFormData = z.infer<typeof optionSetFormSchema>;
export type MenuFormData = z.infer<typeof menuFormSchema>;
