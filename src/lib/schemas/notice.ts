import { z } from 'zod'
import { apiResponseSchema } from '@/lib/schemas/api'

export const noticeListItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  createdAt: z.string(),
})

export const noticeFileSchema = z.object({
  id: z.number(),
  name: z.string(),
  downloadUrl: z.string().url(),
})

export const noticeDetailSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  files: z.array(noticeFileSchema),
})

export const noticeListResponseSchema = apiResponseSchema(z.array(noticeListItemSchema))
export const noticeDetailResponseSchema = apiResponseSchema(noticeDetailSchema)

export type NoticeListItem = z.infer<typeof noticeListItemSchema>
export type NoticeFile = z.infer<typeof noticeFileSchema>
export type NoticeDetail = z.infer<typeof noticeDetailSchema>
