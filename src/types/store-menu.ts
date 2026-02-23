/** 메뉴 이미지 파일 */
export interface StoreMenuImgFile {
  id: number
  originalFileName: string
  storedFileName: string
  fileSize: number
  contentType: string
  fileExtension: string
  uploadFileType: string
  uploadFileCategory: string
  referenceType: string
  referenceId: number
  isPublic: boolean
  publicUrl: string
  createdAt: string
}

/** 메뉴 카테고리 (서버 MenuCategoryResponse 매핑) */
export interface StoreMenuCategory {
  menuCategoryId: number | null
  categoryId: number | null
  menuId: number
  name: string
  isActive: boolean
}

/** 점포 메뉴 목록 아이템 */
export interface StoreMenuItem {
  id: number
  marketingTags: string[]
  temperatureTags: string[]
  operationStatus: string
  menuName: string
  menuNameEng: string | null
  menuNameChs: string | null
  menuNameCht: string | null
  menuNameJpn: string | null
  menuProperty: string | null
  bpId: number
  companyName: string
  menuType: string
  setStatus: string
  menuClassificationCode: string
  categories: StoreMenuCategory[]
  salePrice: number | null
  discountPrice: number | null
  taxType: string
  description: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
  menuImgFile: StoreMenuImgFile | null
  masterMenuName: string | null
  masterMenuCode: string | null
  franchiseId: number | null
  franchiseName: string | null
  storeId: number | null
  storeName: string | null
}

/** 점포 메뉴 목록 응답 */
export interface StoreMenuListResponse {
  content: StoreMenuItem[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  isFirst: boolean
  isLast: boolean
  hasNext: boolean
}

/** 노출순서 일괄 변경 요청 아이템 */
export interface MenuDisplayOrderUpdateRequest {
  bpId: number
  menuId: number
  displayOrder: number | null
}

/** 운영여부 일괄 변경 요청 */
export interface MenuOperationStatusUpdateRequest {
  bpId: number
  menuIds: number[]
  operationStatus: string
}

/** 메뉴 옵션 아이템 */
export interface StoreMenuOptionItem {
  id: number
  optionSetId: number
  optionSetItemId: number
  optionSetItemName: string
  optionSetItemCode: string
  operationStatus: string
  additionalPrice: number | null
  isQuantity: boolean
  quantity: number | null
  isDefault: boolean
  isActive: boolean
}

/** 메뉴 옵션 SET */
export interface StoreMenuOptionSet {
  id: number
  menuId: number
  setName: string
  isRequired: boolean
  isMultipleChoice: boolean
  isActive: boolean
  displayOrder: number | null
  optionSetItems: StoreMenuOptionItem[]
}

/** 점포 메뉴 상세 응답 */
export interface StoreMenuDetailResponse {
  id: number
  marketingTags: string[]
  temperatureTags: string[]
  operationStatus: string
  menuName: string
  menuNameEng: string | null
  menuNameChs: string | null
  menuNameCht: string | null
  menuNameJpn: string | null
  menuProperty: string | null
  bpId: number
  companyName: string
  menuType: string
  setStatus: string
  menuClassificationCode: string
  categories: StoreMenuCategory[]
  salePrice: number | null
  discountPrice: number | null
  promotionStartDate: string | null
  promotionEndDate: string | null
  taxType: string
  description: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
  createdByName: string | null
  updatedByName: string | null
  createdByLoginId: string | null
  updatedByLoginId: string | null
  menuImgFile: StoreMenuImgFile | null
  masterMenuName: string | null
  masterMenuCode: string | null
  optionSets: StoreMenuOptionSet[]
  franchiseId: number | null
  franchiseName: string | null
  storeId: number | null
  storeName: string | null
}

/** 점포 메뉴 목록 검색 파라미터 */
export interface StoreMenuListParams {
  bpId?: number
  menuGroup?: string
  storeId?: number
  menuName?: string
  operationStatus?: string
  menuType?: string
  menuClassificationCode?: string
  categoryId?: number
  createdAtFrom?: string
  createdAtTo?: string
  page?: number
  size?: number
}

/** 메뉴 수정 요청 - 카테고리 */
export interface StoreMenuCategoryRequest {
  id?: number | null
  categoryId: number
  isDeleted?: boolean
}

/** 메뉴 수정 요청 - 옵션 아이템 */
export interface StoreMenuOptionItemRequest {
  id?: number | null
  optionSetItemId: number
  additionalPrice: number | null
  isQuantity: boolean
  quantity: number | null
  isDefault: boolean
  isActive: boolean
  isDeleted?: boolean
}

/** 메뉴 수정 요청 - 옵션 SET */
export interface StoreMenuOptionSetRequest {
  id?: number | null
  setName: string
  isRequired: boolean
  isMultipleChoice: boolean
  isActive: boolean
  displayOrder: number
  isDeleted?: boolean
  optionItems: StoreMenuOptionItemRequest[]
}

/** 메뉴 수정 요청 본문 (multipart 'menu' JSON part) */
export interface StoreMenuUpdateRequest {
  id?: number
  bpId: number
  operationStatus: string
  menuType: string
  menuName: string
  menuNameEng: string | null
  menuNameChs: string | null
  menuNameCht: string | null
  menuNameJpn: string | null
  menuClassificationCode: string
  taxType: string
  marketingTags: string[]
  temperatureTags: string[]
  displayOrder: number | null
  description: string | null
  categories: StoreMenuCategoryRequest[]
  optionSets: StoreMenuOptionSetRequest[]
}

/** 메뉴 수정 파일 페이로드 */
export interface StoreMenuFilePayload {
  image?: File | null
  deleteFileId?: number | null
}
