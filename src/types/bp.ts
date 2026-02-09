import { UploadFile } from './upload-files'

export interface PfList {
    id: number
    bpId: number
    partnerBpId: number
}

export interface BpFranchiseNode {
    id: number
    name: string
    organizationCode: string
}

export interface BpHeadOfficeNode {
    id: number
    name: string
    organizationCode: string
    franchises: BpFranchiseNode[]
}

export interface BpDetailResponse {
    id: number
    bpoprType: string
    pfType: string
    masterId: number | null
    companyName: string
    organizationType: 'HEAD_OFFICE' | 'FRANCHISE'
    parentOrganizationId: number | null
    organizationCode: string
    brandName: string
    businessRegistartionNumber: string
    address1: string | null
    address2: string | null
    headOfficeName: string | null
    franchiseStoreName: string | null
    representativeName: string | null
    representativeMobilePhone: string | null
    representativeEmail: string | null
    bpType: string | null
    lnbLogoExpandFile: UploadFile | null
    lnbLogoContarctFile: UploadFile | null
    pfList: PfList[]
    createdBy: number
    updatedBy: number
    createdAt: Date
    updatedAt: Date
}
