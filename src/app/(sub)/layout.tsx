'use client'

import { ReactNode, useState } from 'react'
import Lnb from '@/components/ui/common/Lnb'
import FullDownMenu from '@/components/ui/common/FullDownMenu'
import Header from '@/components/ui/Header'

interface MainLayoutProps {
    children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
    const [isOpen, setIsOpen] = useState(false)
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
