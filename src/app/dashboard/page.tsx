'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useVault } from '@/contexts/VaultContext'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { createClient } from '@supabase/supabase-js'

interface PasswordStrength {
  weak: number
  medium: number
  strong: number
  veryStrong: number
}

interface VaultStats {
  totalItems: number
  loginItems: number
  secureNotes: number
  favorites: number
  recentlyAdded: number
  recentlyUpdated: number
}

function calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' | 'veryStrong' {
  if (!password) return 'weak'
  
  let score = 0
  
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  
  if (score <= 2) return 'weak'
  if (score <= 4) return 'medium'
  if (score <= 5) return 'strong'
  return 'veryStrong'
}

function DashboardContent() {
  const { user } = useAuth()
  const { items } = useVault()
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    weak: 0,
    medium: 0,
    strong: 0,
    veryStrong: 0,
  })
  const [vaultStats, setVaultStats] = useState<VaultStats>({
    totalItems: 0,
    loginItems: 0,
    secureNotes: 0,
    favorites: 0,
    recentlyAdded: 0,
    recentlyUpdated: 0,
  })
  const [recentLogs, setRecentLogs] = useState<any[]>([])

  useEffect(() => {
    if (items.length > 0) {
      analyzePasswords()
      calculateStats()
    }
    fetchRecentLogs()
  }, [items])

  const analyzePasswords = () => {
    const strength: PasswordStrength = { weak: 0, medium: 0, strong: 0, veryStrong: 0 }
    
    items.forEach(item => {
      if (item.type === 'login') {
        const loginData = item.data as { password?: string }
        if (loginData.password) {
          const result = calculatePasswordStrength(loginData.password)
          strength[result]++
        }
      }
    })
    
    setPasswordStrength(strength)
  }

  const calculateStats = () => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    setVaultStats({
      totalItems: items.length,
      loginItems: items.filter(i => i.type === 'login').length,
      secureNotes: items.filter(i => i.type === 'secure_note').length,
      favorites: items.filter(i => i.favorite).length,
      recentlyAdded: items.filter(i => new Date(i.createdAt) > oneWeekAgo).length,
      recentlyUpdated: items.filter(i => new Date(i.updatedAt) > oneWeekAgo).length,
    })
  }

  const fetchRecentLogs = async () => {
    if (!user) return
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentLogs(data || [])
    } catch (error) {
      console.error('Failed to fetch recent logs:', error)
    }
  }

  const totalPasswords = passwordStrength.weak + passwordStrength.medium + passwordStrength.strong + passwordStrength.veryStrong
  const strengthPercentage = totalPasswords > 0 
    ? Math.round(((passwordStrength.strong + passwordStrength.veryStrong) / totalPasswords) * 100) 
    : 0

  const ACTION_LABELS: Record<string, string> = {
    login: '登录',
    logout: '登出',
    item_create: '创建密码项',
    item_update: '更新密码项',
    item_delete: '删除密码项',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">仪表盘</h1>
              <p className="text-textMuted">密码安全概览</p>
            </div>
            <Button onClick={() => window.location.href = '/vault'} variant="secondary">
              <Icon name="arrow-left" className="w-4 h-4 mr-2" />
              返回保险库
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-textMuted text-sm">总密码数</span>
              <Icon name="key" className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-text">{vaultStats.totalItems}</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-textMuted text-sm">登录项</span>
              <Icon name="user" className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-bold text-text">{vaultStats.loginItems}</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-textMuted text-sm">收藏项</span>
              <Icon name="star" className="w-5 h-5 text-warning" />
            </div>
            <p className="text-3xl font-bold text-text">{vaultStats.favorites}</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-textMuted text-sm">本周新增</span>
              <Icon name="plus" className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-text">{vaultStats.recentlyAdded}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <Icon name="shield-alt" className="w-5 h-5 text-primary" />
              密码强度分析
            </h2>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-textMuted text-sm">安全评分</span>
                <span className="text-text font-medium">{strengthPercentage}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    strengthPercentage >= 70 ? 'bg-success' : 
                    strengthPercentage >= 40 ? 'bg-warning' : 'bg-danger'
                  }`}
                  style={{ width: `${strengthPercentage}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger" />
                  <span className="text-sm text-textMuted">弱密码</span>
                </div>
                <span className="text-text font-medium">{passwordStrength.weak}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-sm text-textMuted">中等密码</span>
                </div>
                <span className="text-text font-medium">{passwordStrength.medium}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-sm text-textMuted">强密码</span>
                </div>
                <span className="text-text font-medium">{passwordStrength.strong}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm text-textMuted">非常强密码</span>
                </div>
                <span className="text-text font-medium">{passwordStrength.veryStrong}</span>
              </div>
            </div>

            {passwordStrength.weak > 0 && (
              <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                <p className="text-sm text-danger">
                  ⚠️ 您有 {passwordStrength.weak} 个弱密码，建议尽快修改
                </p>
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <Icon name="history" className="w-5 h-5 text-primary" />
              最近活动
            </h2>
            
            {recentLogs.length === 0 ? (
              <p className="text-textMuted text-center py-4">暂无活动记录</p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-2 bg-background/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Icon 
                        name={log.action.includes('create') ? 'plus' : 
                              log.action.includes('update') ? 'edit' : 
                              log.action.includes('delete') ? 'trash' : 'info'} 
                        className="w-4 h-4 text-primary" 
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-text">{ACTION_LABELS[log.action] || log.action}</p>
                      <p className="text-xs text-textMuted">
                        {new Date(log.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button 
              onClick={() => window.location.href = '/audit-logs'} 
              variant="secondary" 
              className="w-full mt-4"
            >
              查看全部日志
            </Button>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <Icon name="chart-pie" className="w-5 h-5 text-primary" />
            密码强度分布
          </h2>
          
          <div className="flex items-center gap-4 h-8">
            {totalPasswords > 0 ? (
              <>
                {passwordStrength.weak > 0 && (
                  <div 
                    className="h-full bg-danger rounded transition-all" 
                    style={{ width: `${(passwordStrength.weak / totalPasswords) * 100}%` }}
                    title={`弱密码: ${passwordStrength.weak}`}
                  />
                )}
                {passwordStrength.medium > 0 && (
                  <div 
                    className="h-full bg-warning rounded transition-all" 
                    style={{ width: `${(passwordStrength.medium / totalPasswords) * 100}%` }}
                    title={`中等密码: ${passwordStrength.medium}`}
                  />
                )}
                {passwordStrength.strong > 0 && (
                  <div 
                    className="h-full bg-success rounded transition-all" 
                    style={{ width: `${(passwordStrength.strong / totalPasswords) * 100}%` }}
                    title={`强密码: ${passwordStrength.strong}`}
                  />
                )}
                {passwordStrength.veryStrong > 0 && (
                  <div 
                    className="h-full bg-primary rounded transition-all" 
                    style={{ width: `${(passwordStrength.veryStrong / totalPasswords) * 100}%` }}
                    title={`非常强密码: ${passwordStrength.veryStrong}`}
                  />
                )}
              </>
            ) : (
              <div className="h-full bg-background rounded w-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="spinner" className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
