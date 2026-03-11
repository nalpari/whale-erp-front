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
    businessRegistrationNumber: string
    address1: string | null
    address2: string | null
    headOfficeName: string | null
    franchiseStoreName: string | null
    representativeName: string | null
    representativeMobilePhone: string | null
    representativeEmail: string | null
    bpType: string | null
    lnbLogoExpandFile: UploadFile | null
    lnbLogoContractFile: UploadFile | null
    pfList: PfList[]
    invitationStatus: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REJECTED' | null
    createdBy: number
    createdByName: string | null
    updatedBy: number
    createdAt: Date
    updatedAt: Date
}

export interface BpSearchFilters {
    officeId: number | null
    franchiseId: number | null
    representativeName: string
    bpoprType: string
    subscriptionPlanType: string
    createdAtFrom: Date | null
    createdAtTo: Date | null
}

export interface BpInvitationFormData {
    headOfficeId: number | null
    businessRegistrationNumber: string
    startDate: string
    representativeName: string
    representativeMobilePhone: string
    representativeEmail: string
}

export interface BpPfSaveRequest {
    id?: number
    organizationId?: number
    partnerBusinessPartnerId?: number | null
}

export interface BpFormData {
    bpoprType: string
    pfType: string
    masterId: string
    companyName: string
    brandName: string
    businessRegistrationNumber: string
    address1: string
    address2: string
    representativeName: string
    representativeMobilePhone: string
    representativeEmail: string
    bpType: string
    pfSaveRequest: BpPfSaveRequest[]
}

export interface BpListParams {
    page?: number
    size?: number
    id?: number
    companyName?: string
    businessRegistrationNumber?: string
    representativeName?: string
    representativeMobilePhone?: string
    address1?: string
    address2?: string
    createdAtFrom?: string
    createdAtTo?: string
    bpoprType?: string
    subscriptionPlanType?: string
}
