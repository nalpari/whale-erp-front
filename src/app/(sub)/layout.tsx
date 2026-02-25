'use client'

import { ReactNode, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import Lnb from '@/components/ui/common/Lnb'
import FullDownMenu from '@/components/ui/common/FullDownMenu'
import Header from '@/components/ui/Header'
import MyPageLayout from '@/components/mypage/MyPageLayout'
import { AlertProvider } from '@/components/common/ui'

interface MainLayoutProps {
    children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()
    const accessToken = useAuthStore((state) => state.accessToken)
    const [menuType, setMenuType] = useState<'header' | 'support'>('header')

    const redirectToLogin = useCallback(() => {
        const returnUrl = pathname ? `?returnUrl=${encodeURIComponent(pathname)}` : ''
        router.replace(`/login${returnUrl}`)
    }, [pathname, router])

    const handleToggleMenuType = () => {
        setMenuType((prev) => (prev === 'header' ? 'support' : 'header'))
    }

    useEffect(() => {
        // 클라이언트에서만 실행
        const checkAuth = () => {
            // localStorage에서 직접 토큰 확인 (Zustand hydration 대기)
            try {
                const stored = localStorage.getItem('auth-storage')
                if (stored) {
                    const parsed = JSON.parse(stored)
                    const token = parsed.state?.accessToken
                    if (token) {
                        setIsLoading(false)
                        return
                    }
                }
            } catch {
                // 파싱 실패 시 무시
            }
            // 토큰이 없으면 로그인 페이지로
            const timer = setTimeout(() => {
                redirectToLogin()
            }, 0)
            return () => clearTimeout(timer)
        }

        return checkAuth()
    }, [redirectToLogin])

    // accessToken 변경 감지 (로그아웃 시)
    useEffect(() => {
        if (!isLoading && !accessToken) {
            const timer = setTimeout(() => {
                redirectToLogin()
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [accessToken, isLoading, redirectToLogin])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    return (
        <AlertProvider>
            <div className={`wrap ${isOpen ? 'sm' : ''}`}>
                <Lnb isOpen={isOpen} setIsOpen={setIsOpen} menuType={menuType} />
                <div className="container">
                    <div className="frame">
                        <div className="header-wrap">
                            <FullDownMenu />
                            <Header onToggleMenuType={handleToggleMenuType} />
                        </div>

                        {children}
                    </div>
                </div>
                <MyPageLayout />
            </div>
        </AlertProvider>
    )
}
