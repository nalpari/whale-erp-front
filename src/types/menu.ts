export interface MenuResponse {
  id: number
  marketingTags: string[] | null
  temperatureTags: string[] | null
  operationStatus: string
  menuName: string
  menuNameEng: string | null
  menuNameChs: string | null
  menuNameCht: string | null
  menuNameJpn: string | null
  menuProperty: string
  bpId: number | null
  companyName: string | null
  menuType: string
  setStatus: string
  menuClassificationCode: string | null
  categories: MenuCategoryResponse[] | null
  salePrice: number | null
  discountPrice: number | null
  taxType: string | null
  description: string | null
  displayOrder: number | null
  optionSets: MenuOptionSetResponse[] | null
  createdBy: number | null
  updatedBy: number | null
  createdAt: string | null
  updatedAt: string | null
  menuImgFile: MenuImageFile | null
  masterMenuName: string | null
  masterMenuCode: string | null
}

export interface MenuCategoryResponse {
  id: number
  categoryName: string
}

export interface MenuOptionSetResponse {
  id: number
  optionSetName: string
}

export interface MenuImageFile {
  id: number
  fileName: string
  fileUrl: string
}

export interface CategoryResponse {
  id: number
  bpId: number
  companyName: string
  categoryCode: string
  categoryName: string
  depth: number
  parentCategoryId: number | null
  isFixed: boolean
  isActive: boolean
  isDeleted: boolean
  sortOrder: number
  createdBy: number | null
  updatedBy: number | null
  createdAt: string | null
  updatedAt: string | null
  children: CategoryResponse[] | null
}
