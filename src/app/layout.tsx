import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { VaultProvider } from '@/contexts/VaultContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { DynamicHead } from '@/components/DynamicHead'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SecureVault密码管理器',
  description: '安全可靠的密码管理器',
  icons: {
    icon: 'https://djkl.qzz.io/file/1770081419896_头像.webp',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          <VaultProvider>
            <ToastProvider>
              <DynamicHead />
              {children}
            </ToastProvider>
          </VaultProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
