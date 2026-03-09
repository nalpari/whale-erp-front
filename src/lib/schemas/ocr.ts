import { z } from 'zod/v4'

export const businessLicenseOcrResultSchema = z.object({
  businessRegistrationNumber: z.string(),
  companyName: z.string(),
  representativeName: z.string(),
  address1: z.string(),
  address2: z.string().nullable(),
  businessType: z.string().nullable(),
  businessItem: z.string().nullable(),
  openDate: z.string().nullable(),
  corporateRegistrationNumber: z.string().nullable(),
  confidence: z.number().min(0).max(1),
})

export const businessLicenseOcrResponseSchema = z.object({
  success: z.boolean(),
  data: businessLicenseOcrResultSchema.nullable(),
  error: z.string().nullable(),
})

export type BusinessLicenseOcrResult = z.infer<typeof businessLicenseOcrResultSchema>
export type BusinessLicenseOcrResponse = z.infer<typeof businessLicenseOcrResponseSchema>
