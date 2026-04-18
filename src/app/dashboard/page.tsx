'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useVault } from '@/contexts/VaultContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
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
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
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

  const ACTION_LABELS: Record<string, Record<string, string>> = {
    login: { zh: '登录', en: 'Login' },
    logout: { zh: '登出', en: 'Logout' },
    item_create: { zh: '创建密码项', en: 'Create Item' },
    item_update: { zh: '更新密码项', en: 'Update Item' },
    item_delete: { zh: '删除密码项', en: 'Delete Item' },
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primaryLight rounded-lg flex items-center justify-center">
                  <Icon name="lock" className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-text">MinpassVault</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/vault')} className="text-textMuted hover:text-text">
                <Icon name="key" className="w-4 h-4 mr-1.5" />
                {t('vault')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/audit-logs')} className="text-textMuted hover:text-text">
                <Icon name="history" className="w-4 h-4 mr-1.5" />
                {t('auditLogs')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/settings')} className="text-textMuted hover:text-text">
                <Icon name="cog" className="w-4 h-4 mr-1.5" />
                {t('settings')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text mb-1">{t('dashboard')}</h1>
          <p className="text-textMuted">{language === 'zh' ? '密码安全概览与统计分析' : 'Password security overview and statistics'}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="key" className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-text mb-1">{vaultStats.totalItems}</p>
            <p className="text-sm text-textMuted">{t('totalPasswords')}</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Icon name="user" className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-3xl font-bold text-text mb-1">{vaultStats.loginItems}</p>
            <p className="text-sm text-textMuted">{t('loginItems')}</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Icon name="star" className="w-5 h-5 text-warning" />
              </div>
            </div>
            <p className="text-3xl font-bold text-text mb-1">{vaultStats.favorites}</p>
            <p className="text-sm text-textMuted">{t('favorites')}</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-primaryLight/20 rounded-lg flex items-center justify-center">
                <Icon name="plus" className="w-5 h-5 text-primaryLight" />
              </div>
            </div>
            <p className="text-3xl font-bold text-text mb-1">{vaultStats.recentlyAdded}</p>
            <p className="text-sm text-textMuted">{t('addedThisWeek')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="shield-alt" className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text">{t('passwordStrength')}</h2>
                <p className="text-sm text-textMuted">{language === 'zh' ? '检测您的密码安全程度' : 'Check your password security level'}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-textMuted text-sm">{t('securityScore')}</span>
                <span className={`text-lg font-bold ${
                  strengthPercentage >= 70 ? 'text-success' : 
                  strengthPercentage >= 40 ? 'text-warning' : 'text-danger'
                }`}>{strengthPercentage}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    strengthPercentage >= 70 ? 'bg-gradient-to-r from-success to-emerald-400' : 
                    strengthPercentage >= 40 ? 'bg-gradient-to-r from-warning to-amber-400' : 
                    'bg-gradient-to-r from-danger to-red-400'
                  }`}
                  style={{ width: `${strengthPercentage}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-danger" />
                  <span className="text-sm text-text">{t('weak')}</span>
                </div>
                <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                  passwordStrength.weak > 0 ? 'bg-danger/10 text-danger' : 'bg-surfaceHover text-textMuted'
                }`}>{passwordStrength.weak}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-sm text-text">{t('medium')}</span>
                </div>
                <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                  passwordStrength.medium > 0 ? 'bg-warning/10 text-warning' : 'bg-surfaceHover text-textMuted'
                }`}>{passwordStrength.medium}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-sm text-text">{t('strong')}</span>
                </div>
                <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                  passwordStrength.strong > 0 ? 'bg-success/10 text-success' : 'bg-surfaceHover text-textMuted'
                }`}>{passwordStrength.strong}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm text-text">{t('veryStrong')}</span>
                </div>
                <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                  passwordStrength.veryStrong > 0 ? 'bg-primary/10 text-primary' : 'bg-surfaceHover text-textMuted'
                }`}>{passwordStrength.veryStrong}</span>
              </div>
            </div>

            {passwordStrength.weak > 0 && (
              <div className="mt-4 p-4 bg-danger/5 border border-danger/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Icon name="exclamation-triangle" className="w-5 h-5 text-danger mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-danger">{t('securityWarning')}</p>
                    <p className="text-sm text-textMuted mt-1">{t('weakPasswordWarning', { count: passwordStrength.weak })}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="history" className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text">{t('recentActivity')}</h2>
                <p className="text-sm text-textMuted">{language === 'zh' ? '最近的账户操作记录' : 'Recent account activity'}</p>
              </div>
            </div>
            
            {recentLogs.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-surfaceHover rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon name="inbox" className="w-6 h-6 text-textMuted" />
                </div>
                <p className="text-textMuted">{t('noActivity')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-surfaceHover transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon 
                        name={log.action.includes('create') ? 'plus' : 
                              log.action.includes('update') ? 'edit' : 
                              log.action.includes('delete') ? 'trash' : 'info'} 
                        className="w-4 h-4 text-primary" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{ACTION_LABELS[log.action]?.[language] || log.action}</p>
                      <p className="text-xs text-textMuted">
                        {new Date(log.created_at).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button 
              onClick={() => router.push('/audit-logs')} 
              variant="secondary" 
              className="w-full mt-4"
            >
              <Icon name="arrow-right" className="w-4 h-4 mr-2" />
              {t('viewAllLogs')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="chart-pie" className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text">{t('strengthDistribution')}</h2>
                <p className="text-sm text-textMuted">{language === 'zh' ? '可视化展示您的密码安全状况' : 'Visualize your password security'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 h-10 rounded-lg overflow-hidden">
              {totalPasswords > 0 ? (
                <>
                  {passwordStrength.weak > 0 && (
                    <div 
                      className="h-full bg-danger transition-all flex items-center justify-center" 
                      style={{ width: `${(passwordStrength.weak / totalPasswords) * 100}%` }}
                      title={`${t('weak')}: ${passwordStrength.weak}`}
                    >
                      {(passwordStrength.weak / totalPasswords) * 100 > 10 && (
                        <span className="text-xs text-white font-medium">{passwordStrength.weak}</span>
                      )}
                    </div>
                  )}
                  {passwordStrength.medium > 0 && (
                    <div 
                      className="h-full bg-warning transition-all flex items-center justify-center" 
                      style={{ width: `${(passwordStrength.medium / totalPasswords) * 100}%` }}
                      title={`${t('medium')}: ${passwordStrength.medium}`}
                    >
                      {(passwordStrength.medium / totalPasswords) * 100 > 10 && (
                        <span className="text-xs text-white font-medium">{passwordStrength.medium}</span>
                      )}
                    </div>
                  )}
                  {passwordStrength.strong > 0 && (
                    <div 
                      className="h-full bg-success transition-all flex items-center justify-center" 
                      style={{ width: `${(passwordStrength.strong / totalPasswords) * 100}%` }}
                      title={`${t('strong')}: ${passwordStrength.strong}`}
                    >
                      {(passwordStrength.strong / totalPasswords) * 100 > 10 && (
                        <span className="text-xs text-white font-medium">{passwordStrength.strong}</span>
                      )}
                    </div>
                  )}
                  {passwordStrength.veryStrong > 0 && (
                    <div 
                      className="h-full bg-primary transition-all flex items-center justify-center" 
                      style={{ width: `${(passwordStrength.veryStrong / totalPasswords) * 100}%` }}
                      title={`${t('veryStrong')}: ${passwordStrength.veryStrong}`}
                    >
                      {(passwordStrength.veryStrong / totalPasswords) * 100 > 10 && (
                        <span className="text-xs text-white font-medium">{passwordStrength.veryStrong}</span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full bg-background w-full flex items-center justify-center">
                  <span className="text-xs text-textMuted">{t('noData')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-danger" />
                <span className="text-xs text-textMuted">{language === 'zh' ? '弱' : 'Weak'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-xs text-textMuted">{language === 'zh' ? '中' : 'Medium'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-xs text-textMuted">{language === 'zh' ? '强' : 'Strong'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-textMuted">{language === 'zh' ? '非常强' : 'V.Strong'}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-danger/10 rounded-lg flex items-center justify-center">
                <Icon name="shield-alt" className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text">{t('breachCheck')}</h2>
                <p className="text-sm text-textMuted">{t('breachCheckDesc')}</p>
              </div>
            </div>

            <div className="p-4 bg-danger/5 border border-danger/20 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <Icon name="info-circle" className="w-5 h-5 text-danger mt-0.5" />
                <div>
                  <p className="text-sm text-text">{language === 'zh' ? '使用 Have I Been Pwned API 安全检测您的密码是否在已知数据泄露中出现过。' : 'Use Have I Been Pwned API to safely check if your passwords have appeared in known data breaches.'}</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => router.push('/breach-check')} 
              className="w-full"
            >
              <Icon name="search" className="w-4 h-4 mr-2" />
              {t('checkBreaches')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-textMuted text-sm">加载中...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
