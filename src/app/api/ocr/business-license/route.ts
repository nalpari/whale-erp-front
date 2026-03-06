import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { businessLicenseOcrResultSchema } from '@/lib/schemas/ocr'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

const client = new Anthropic()

const SYSTEM_PROMPT = `당신은 한국 사업자등록증 이미지에서 정보를 추출하는 전문가입니다.
이미지에서 다음 필드를 정확히 추출하여 JSON으로 반환하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "businessRegistrationNumber": "하이픈 제거한 10자리 숫자",
  "companyName": "상호(법인명)",
  "representativeName": "대표자",
  "address1": "사업장 소재지 (시/도 ~ 도로명/번지)",
  "address2": "상세주소 (건물명, 호수 등) 없으면 null",
  "businessType": "업태, 없으면 null",
  "businessItem": "종목, 없으면 null",
  "openDate": "개업연월일 YYYY-MM-DD 형식, 없으면 null",
  "corporateRegistrationNumber": "법인등록번호, 없으면 null",
  "confidence": 0.0~1.0
}

규칙:
- 사업자등록번호는 반드시 하이픈(-)을 제거하고 숫자 10자리만 반환
- 읽을 수 없는 필드는 null로 반환
- confidence는 이미지 품질과 추출 확신도를 종합 판단
- JSON 외 다른 텍스트를 포함하지 마세요`

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, data: null, error: '파일이 필요합니다.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, data: null, error: '파일 크기는 10MB 이하여야 합니다.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, data: null, error: 'JPG, PNG, WebP, PDF 형식만 지원합니다.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const isPdf = file.type === 'application/pdf'

    // PDF는 document 타입, 이미지는 image 타입으로 전송
    const fileContent: Anthropic.Messages.ContentBlockParam = isPdf
      ? {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        }
      : {
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
            data: base64,
          },
        }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            fileContent,
            {
              type: 'text',
              text: '이 사업자등록증에서 정보를 추출해주세요.',
            },
          ],
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { success: false, data: null, error: 'AI 응답을 처리할 수 없습니다.' },
        { status: 500 }
      )
    }

    // JSON 추출 (코드블록 감싸기 대응)
    let jsonStr = textContent.text.trim()
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const parsed = JSON.parse(jsonStr)
    const validated = businessLicenseOcrResultSchema.parse(parsed)

    return NextResponse.json({ success: true, data: validated, error: null })
  } catch (error) {
    console.error('OCR API Error:', error)
    return NextResponse.json(
      { success: false, data: null, error: '사업자등록증 인식에 실패했습니다.' },
      { status: 500 }
    )
  }
}
