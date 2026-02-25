import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 로그인 없이 접근 가능한 경로
const PUBLIC_PATHS = ['/', '/main', '/login', '/signup', '/pricing', '/introduction', '/before-notice', '/store-operation', '/financial', '/franchise', '/pricing-info']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 경로 확인 ('/'는 정확히 매칭, 나머지는 prefix 매칭)
  const isPublicPath = PUBLIC_PATHS.some((path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  // 보호된 경로: 인증 쿠키 확인
  const authToken = request.cookies.get('auth-token')

  if (!authToken) {
    const loginUrl = new URL('/login', request.url)
    const returnUrl = request.nextUrl.pathname + request.nextUrl.search
    if (returnUrl && returnUrl !== '/') {
      loginUrl.searchParams.set('returnUrl', returnUrl)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/|api/).*)',
  ],
}
