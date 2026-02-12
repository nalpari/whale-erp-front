'use client'

import { ReactNode } from 'react'

interface PublicLayoutProps {
  children: ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {

  return (
    <div className="min-h-screen flex flex-col bg-white">


      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

    </div>
  )
}
