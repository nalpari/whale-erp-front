'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import Lnb from '@/components/ui/common/Lnb'
import FullDownMenu from '@/components/ui/common/FullDownMenu'
import Header from '@/components/ui/Header'

interface MainLayoutProps {
    children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const accessToken = useAuthStore((state) => state.accessToken)

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
                router.replace('/login')
            }, 0)
            return () => clearTimeout(timer)
        }

        return checkAuth()
    }, [router])

    // accessToken 변경 감지 (로그아웃 시)
    useEffect(() => {
        if (!isLoading && !accessToken) {
            const timer = setTimeout(() => {
                router.replace('/login')
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [accessToken, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    return (
        <div className={`wrap ${isOpen ? 'sm' : ''}`}>
            <Lnb isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="container">
                <div className="frame">
                    <div className="header-wrap">
                        <FullDownMenu />
                        <Header />
                    </div>

                    {children}
                </div>
            </div>
        </div>
    )
}
