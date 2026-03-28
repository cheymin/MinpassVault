'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/contexts/ToastContext'

function ForgotPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const usernameParam = searchParams.get('username')

  const [email, setEmail] = useState(usernameParam || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!email.trim()) {
      setError('请输入邮箱或用户名')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'reset',
          email: email.trim(),
          username: email.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '发送邮件失败')
        setLoading(false)
        return
      }

      setSuccess(true)
      showToast('重置邮件已发送', 'success')
    } catch (err) {
      setError('发送邮件失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-success/20 to-success/10 rounded-2xl mb-4">
              <Icon name="envelope" className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">邮件已发送</h1>
            <p className="text-sm sm:text-base text-textMuted">
              我们已向 {email} 发送了密码重置邮件
            </p>
          </div>

          <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-6 shadow-lg">
            <div className="text-center space-y-4">
              <p className="text-text">
                请检查您的邮箱并点击邮件中的链接来重置密码。
              </p>
              <p className="text-sm text-textMuted">
                如果您没有收到邮件，请检查垃圾邮件文件夹或稍后重试。
              </p>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-textMuted mb-4">
                  链接将在 30 分钟后过期
                </p>
                <Button onClick={() => router.push('/')} className="w-full">
                  <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                  返回登录
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primaryLight/20 rounded-2xl mb-4">
            <Icon name="lock" className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">忘记密码</h1>
          <p className="text-sm sm:text-base text-textMuted">
            输入您的邮箱或用户名来重置密码
          </p>
        </div>

        <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="邮箱或用户名"
              placeholder="请输入邮箱或用户名"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={<Icon name="envelope" className="w-5 h-5" />}
            />

            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              <Icon name="envelope" className="w-4 h-4 mr-2" />
              发送重置邮件
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-textMuted hover:text-primary transition-colors"
            >
              <Icon name="arrow-left" className="w-4 h-4 mr-1" />
              返回登录
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-8 shadow-lg text-center">
            <Icon name="lock" className="w-16 h-16 mx-auto text-primary mb-4 animate-pulse" />
            <h2 className="text-xl font-semibold text-text mb-2">加载中...</h2>
          </div>
        </div>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}