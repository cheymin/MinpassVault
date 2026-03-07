'use client'

import { useState, useEffect } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { InitForm } from '@/components/auth/InitForm'
import { checkInitialized } from '@/lib/init'

function LandingContent() {
  const [isLogin, setIsLogin] = useState(true)
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkInit = async () => {
      const initialized = await checkInitialized()
      setIsInitialized(initialized)
      setLoading(false)
    }
    checkInit()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isInitialized) {
    return <InitForm />
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-text mb-2">SecureVault</h1>
            <p className="text-textMuted">端到端加密密码管理器</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  isLogin
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-textMuted hover:text-text'
                }`}
              >
                登录
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  !isLogin
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-textMuted hover:text-text'
                }`}
              >
                注册
              </button>
            </div>

            {isLogin ? <LoginForm /> : <div className="text-center text-textMuted py-4">系统已初始化，请联系管理员获取账户</div>}
          </div>

          <p className="text-center text-xs text-textMuted mt-6">
            您的数据在本地加密，我们无法访问您的主密码。
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 to-primaryLight/10 items-center justify-center p-8">
        <div className="max-w-lg">
          <h2 className="text-4xl font-bold text-text mb-6">
            保护您的数字生活
          </h2>
          <div className="space-y-4">
            {[
              { icon: '🔐', title: '端到端加密', desc: '数据在离开设备前就已加密' },
              { icon: '🔑', title: '零知识架构', desc: '我们永远无法看到您的主密码或解密数据' },
              { icon: '📱', title: '跨平台同步', desc: '随时随地从任何设备访问您的密码库' },
              { icon: '🛡️', title: '双重验证', desc: '为您的账户添加额外的安全保护' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 bg-surface/50 rounded-lg p-4">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <h3 className="font-medium text-text">{feature.title}</h3>
                  <p className="text-sm text-textMuted">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return <LandingContent />
}
