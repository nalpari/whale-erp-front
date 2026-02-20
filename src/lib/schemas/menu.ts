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
  id: z.number(),
  menuId: z.number(),
  name: z.string(),
  isActive: z.boolean(),
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
  menuCode: z.string().nullable().optional(),
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

/**
 * 옵션 항목 폼 스키마
 */
export const optionItemFormSchema = z.object({
  optionName: z.string().min(1, '필수 입력 항목입니다.'),
  additionalPrice: z.number().default(0),
  quantityInput: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  // 옵션찾기로 선택된 메뉴의 표시용 메타데이터
  selectedMenuCode: z.string().nullable().optional(),
  selectedOperationStatus: z.string().nullable().optional(),
});

/**
 * 옵션 SET 폼 스키마
 */
export const optionSetFormSchema = z.object({
  optionSetName: z.string().min(1, '필수 입력 항목입니다.'),
  isRequired: z.boolean().default(false),
  isMultiSelect: z.boolean().default(false),
  displayOrder: z.number().nullable().default(null),
  options: z.array(optionItemFormSchema).min(1, '옵션을 1개 이상 추가해주세요'),
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
  description: z.string().nullable().default(null),

  // 옵션 SET (여러 개)
  optionSets: z.array(optionSetFormSchema).default([]),

  // 카테고리
  categoryIds: z.array(z.number()).min(1, '필수 선택 항목입니다.'),
});

/**
 * 폼 타입 추출
 */
export type OptionItemFormData = z.infer<typeof optionItemFormSchema>;
export type OptionSetFormData = z.infer<typeof optionSetFormSchema>;
export type MenuFormData = z.infer<typeof menuFormSchema>;
