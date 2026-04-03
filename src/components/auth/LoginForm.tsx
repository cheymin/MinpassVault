'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'

const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const { signIn, verify2FA } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [remainingTime, setRemainingTime] = useState(0)

  useEffect(() => {
    const storedAttempts = localStorage.getItem('loginAttempts')
    const storedLockout = localStorage.getItem('lockoutUntil')
    
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts, 10))
    }
    
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout, 10)
      if (lockoutTime > Date.now()) {
        setLockoutUntil(lockoutTime)
      } else {
        localStorage.removeItem('lockoutUntil')
        localStorage.removeItem('loginAttempts')
      }
    }
  }, [])

  useEffect(() => {
    if (lockoutUntil) {
      const interval = setInterval(() => {
        const remaining = lockoutUntil - Date.now()
        if (remaining <= 0) {
          setLockoutUntil(null)
          setLoginAttempts(0)
          localStorage.removeItem('lockoutUntil')
          localStorage.removeItem('loginAttempts')
        } else {
          setRemainingTime(Math.ceil(remaining / 1000))
        }
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [lockoutUntil])

  const handleFailedAttempt = () => {
    const newAttempts = loginAttempts + 1
    setLoginAttempts(newAttempts)
    localStorage.setItem('loginAttempts', newAttempts.toString())
    
    if (newAttempts >= MAX_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_TIME
      setLockoutUntil(lockoutTime)
      localStorage.setItem('lockoutUntil', lockoutTime.toString())
    }
  }

  const handleSuccessfulLogin = () => {
    setLoginAttempts(0)
    localStorage.removeItem('loginAttempts')
    localStorage.removeItem('lockoutUntil')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (lockoutUntil && lockoutUntil > Date.now()) {
      setError(`登录已被锁定，请等待 ${formatTime(remainingTime)}`)
      return
    }

    setLoading(true)

    if (requires2FA) {
      const result = await verify2FA(twoFactorCode)
      setLoading(false)
      if (result.error) {
        setError(result.error)
        showToast(result.error, 'error')
      } else {
        handleSuccessfulLogin()
        showToast('登录成功', 'success')
        router.push('/vault')
      }
    } else {
      const result = await signIn(username, password)
      setLoading(false)
      if (result.error) {
        setError(result.error)
        showToast(result.error, 'error')
        handleFailedAttempt()
      } else if (result.requires2FA) {
        setRequires2FA(true)
      } else {
        handleSuccessfulLogin()
        showToast('登录成功', 'success')
        router.push('/vault')
      }
    }
  }

  const isLocked = !!(lockoutUntil && lockoutUntil > Date.now())

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!requires2FA ? (
          <>
            <Input
              type="text"
              label="用户名"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLocked}
              icon={<Icon name="user" className="w-5 h-5" />}
            />
            <Input
              type="password"
              label="主密码"
              placeholder="请输入主密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLocked}
              icon={<Icon name="lock" className="w-5 h-5" />}
            />
            {loginAttempts > 0 && !isLocked && (
              <div className="text-xs text-warning">
                <Icon name="shield" className="w-3 h-3 mr-1" />
                登录失败 {loginAttempts} 次，{MAX_ATTEMPTS - loginAttempts} 次后将被锁定 15 分钟
              </div>
            )}
          </>
        ) : (
          <Input
            type="text"
            label="两步验证码"
            placeholder="请输入6位验证码"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            required
            maxLength={6}
            icon={<Icon name="shield" className="w-5 h-5" />}
          />
        )}

        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
            {error}
          </div>
        )}

        {isLocked && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-warning text-sm">
            🔒 登录已被锁定，请等待 {formatTime(remainingTime)} 后重试
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          loading={loading}
          disabled={isLocked}
        >
          {requires2FA ? '验证' : '登录'}
        </Button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              const username = (document.querySelector('input[type="text"]') as HTMLInputElement)?.value
              if (username) {
                window.location.href = `/forgot-password?username=${encodeURIComponent(username)}`
              } else {
                window.location.href = '/forgot-password'
              }
            }}
            className="text-sm text-textMuted hover:text-primary transition-colors"
          >
            忘记密码？
          </button>
        </div>
      </form>
    </div>
  )
}
