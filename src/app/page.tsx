'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { InitForm } from '@/components/auth/InitForm'
import { checkInitialized } from '@/lib/init'
import { Icon } from '@/components/ui/Icon'

function LandingContent() {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
          className="p-2 rounded-lg bg-surface border border-border hover:bg-surfaceHover transition-colors"
          title={t('language')}
        >
          <span className="text-sm text-text">{language === 'zh' ? 'EN' : '中'}</span>
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-surface border border-border hover:bg-surfaceHover transition-colors"
          title={t('theme')}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5 text-text" />
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl shadow-xl border border-border p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primaryLight rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text mb-1">{t('appName')}</h1>
            <p className="text-sm text-textMuted">{t('tagline')}</p>
          </div>

          <LoginForm />

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-textMuted">
              ©2026{' '}
              <a
                href="https://github.com/cheymin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primaryHover font-medium transition-colors"
              >
                github.com/cheymin
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return <LandingContent />
}
