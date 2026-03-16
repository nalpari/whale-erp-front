import { ReactNode } from 'react'
import BeforeHeader from '@/components/ui/common/BeforeHeader'
import BeforeFooter from '@/components/ui/common/BeforeFooter'
import { AlertProvider } from '@/components/common/ui/Alert'

interface PublicLayoutProps {
  children: ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {

  return (
    <AlertProvider>
      <div className="main-wrap">
        <BeforeHeader />
        <div className="container">{children}</div>
        <BeforeFooter />
      </div>
    </AlertProvider>
  )
}
