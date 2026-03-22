'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { InitForm } from '@/components/auth/InitForm'
import { checkInitialized } from '@/lib/init'

function LandingContent() {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkInit = async () => {
      const initialized = await checkInitialized()
      setIsInitialized(initialized)
      setLoading(false)
    }
    checkInit()
  }, [])

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/vault')
    }
  }, [user, authLoading, router])

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isInitialized) {
    return <InitForm />
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-primaryLight/20 rounded-2xl mb-4 animate-fade-in">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2 bg-gradient-to-r from-text to-textMuted bg-clip-text text-transparent">SecureVault</h1>
          <p className="text-sm sm:text-base text-textMuted">安全可靠的密码管理器</p>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-textMuted mt-8">
          ©2026 Designed by{' '}
          <a
            href="https://github.com/djklmin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primaryLight hover:underline transition-colors"
          >
            min
          </a>
          {' '}for you!
        </p>
      </div>
    </div>
  )
}

export default function Home() {
  return <LandingContent />
}
