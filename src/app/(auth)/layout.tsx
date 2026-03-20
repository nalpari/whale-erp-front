import { ReactNode } from 'react'
import { AlertProvider } from '@/components/common/ui/Alert'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <AlertProvider>{children}</AlertProvider>
}
