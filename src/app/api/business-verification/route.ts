import { NextRequest, NextResponse } from 'next/server'

const BUSINESS_VALIDATE_URL = 'https://api.odcloud.kr/api/nts-businessman/v1/validate'
const BUSINESS_VALIDATE_KEY = process.env.BUSINESS_VALIDATE_KEY ?? ''

export async function POST(request: NextRequest) {
  if (!BUSINESS_VALIDATE_KEY) {
    console.error('BUSINESS_VALIDATE_KEY environment variable is not set')
    return NextResponse.json(
      { success: false, error: '사업자 인증 서비스가 설정되지 않았습니다.' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { businessRegistrationNumber, startDate, representativeName } = body

    if (!businessRegistrationNumber || !startDate || !representativeName) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${BUSINESS_VALIDATE_URL}?serviceKey=${BUSINESS_VALIDATE_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businesses: [
            {
              b_no: businessRegistrationNumber,
              start_dt: startDate,
              p_nm: representativeName,
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      console.error(`Business validation API returned ${response.status}`)
      return NextResponse.json(
        { success: false, error: `외부 인증 서비스 오류 (${response.status})` },
        { status: 502 }
      )
    }

    const data = await response.json()
    const result = data?.data?.[0]

    return NextResponse.json({
      success: true,
      data: {
        isValid: result?.valid === '01',
        rawResult: result,
      },
    })
  } catch (error) {
    console.error('Business verification error:', error)
    return NextResponse.json(
      { success: false, error: '사업자 인증 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
