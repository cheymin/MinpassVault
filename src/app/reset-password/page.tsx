'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/contexts/ToastContext'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { showToast } = useToast()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validToken, setValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)

  useEffect(() => {
    if (!token) {
      setError('无效的重置链接')
      setCheckingToken(false)
      return
    }

    checkTokenValidity()
  }, [token])

  const checkTokenValidity = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('reset_token', token)
        .single()

      if (error || !users) {
        setError('无效的重置链接')
        setValidToken(false)
      } else {
        const expiresAt = new Date(users.reset_expires_at)
        if (expiresAt < new Date()) {
          setError('重置链接已过期')
          setValidToken(false)
        } else {
          setValidToken(true)
        }
      }
    } catch (err) {
      setError('验证链接失败')
      setValidToken(false)
    } finally {
      setCheckingToken(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('reset_token', token)
        .single()

      if (fetchError || !users) {
        setError('无效的重置链接')
        setLoading(false)
        return
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          reset_token: null,
          reset_expires_at: null,
        })
        .eq('id', users.id)

      if (updateError) {
        setError('更新失败')
        setLoading(false)
        return
      }

      showToast('密码重置成功，请使用新密码登录', 'success')
      router.push('/')
    } catch (err) {
      setError('重置密码失败')
      setLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-8 shadow-lg text-center">
            <Icon name="lock" className="w-16 h-16 mx-auto text-primary mb-4 animate-pulse" />
            <h2 className="text-xl font-semibold text-text mb-2">验证链接...</h2>
            <p className="text-textMuted">请稍候，我们正在验证您的重置链接</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-8 shadow-lg text-center">
            <Icon name="times" className="w-16 h-16 mx-auto text-danger mb-4" />
            <h2 className="text-xl font-semibold text-text mb-2">链接无效</h2>
            <p className="text-textMuted mb-6">{error}</p>
            <Button onClick={() => router.push('/')} className="w-full">
              返回登录
            </Button>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">重置密码</h1>
          <p className="text-sm sm:text-base text-textMuted">请输入您的新密码</p>
        </div>

        <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-textMuted hover:text-primary transition-colors"
            >
              返回登录
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  )
}