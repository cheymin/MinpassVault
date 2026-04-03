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

  const [username, setUsername] = useState(usernameParam || '')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'username' | 'code' | 'reset'>('username')
  const [maskedEmail, setMaskedEmail] = useState('')

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('请输入用户名')
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
          email: username.trim(),
          username: username.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '发送验证码失败')
        setLoading(false)
        return
      }

      if (data.maskedEmail) {
        setMaskedEmail(data.maskedEmail)
      }
      
      setStep('code')
      showToast('验证码已发送', 'success')
    } catch (err) {
      setError('发送验证码失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setError('请输入6位验证码')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          code: verificationCode.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '验证码错误')
        setLoading(false)
        return
      }

      setStep('reset')
      showToast('验证成功', 'success')
    } catch (err) {
      setError('验证失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('两次密码不一致')
      return
    }

    if (newPassword.length < 8) {
      setError('密码至少需要8个字符')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/email/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          code: verificationCode.trim(),
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '重置密码失败')
        setLoading(false)
        return
      }

      showToast('密码重置成功，请使用新密码登录', 'success')
      router.push('/')
    } catch (err) {
      setError('重置密码失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'code') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primaryLight/20 rounded-2xl mb-4">
              <Icon name="envelope" className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">输入验证码</h1>
            <p className="text-sm sm:text-base text-textMuted">
              验证码已发送到您的邮箱
            </p>
            {maskedEmail && (
              <p className="text-sm text-primary mt-2">{maskedEmail}</p>
            )}
          </div>

          <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-6 shadow-lg">
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <Input
                type="text"
                label="验证码"
                placeholder="请输入6位验证码"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                icon={<Icon name="shield" className="w-5 h-5" />}
              />

              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full">
                验证
              </Button>

              <button
                type="button"
                onClick={() => setStep('username')}
                className="w-full text-sm text-textMuted hover:text-primary transition-colors"
              >
                重新发送验证码
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primaryLight/20 rounded-2xl mb-4">
              <Icon name="lock" className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">重置密码</h1>
            <p className="text-sm sm:text-base text-textMuted">
              请输入您的新密码
            </p>
          </div>

          <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-6 shadow-lg">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                type="password"
                label="新密码"
                placeholder="请输入新密码"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                icon={<Icon name="lock" className="w-5 h-5" />}
              />
              <Input
                type="password"
                label="确认新密码"
                placeholder="再次输入新密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                icon={<Icon name="lock" className="w-5 h-5" />}
              />

              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full">
                重置密码
              </Button>
            </form>
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
            输入您的用户名来重置密码
          </p>
        </div>

        <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-6 shadow-lg">
          <form onSubmit={handleSendCode} className="space-y-4">
            <Input
              type="text"
              label="用户名"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              icon={<Icon name="user" className="w-5 h-5" />}
            />

            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              <Icon name="envelope" className="w-4 h-4 mr-2" />
              发送验证码
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