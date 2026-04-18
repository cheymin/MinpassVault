'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { createClient } from '@supabase/supabase-js'

const ACTION_LABELS: Record<string, string> = {
  login: '登录',
  logout: '登出',
  login_failed: '登录失败',
  password_change: '修改密码',
  '2fa_enable': '启用两步验证',
  '2fa_disable': '禁用两步验证',
  email_verification_enable: '启用邮箱验证',
  email_verification_disable: '禁用邮箱验证',
  vault_unlock: '解锁保险库',
  vault_lock: '锁定保险库',
  item_create: '创建密码项',
  item_update: '更新密码项',
  item_delete: '删除密码项',
  item_view: '查看密码项',
  export_data: '导出数据',
  import_data: '导入数据',
  settings_update: '更新设置',
  email_update: '更新邮箱',
  database_reset: '重置数据库',
  backup_create: '创建备份',
  backup_restore: '恢复备份',
}

const ACTION_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  login: { bg: 'bg-success/10', text: 'text-success', icon: 'sign-in-alt' },
  logout: { bg: 'bg-surfaceHover', text: 'text-textMuted', icon: 'sign-out-alt' },
  login_failed: { bg: 'bg-danger/10', text: 'text-danger', icon: 'exclamation-circle' },
  password_change: { bg: 'bg-warning/10', text: 'text-warning', icon: 'key' },
  '2fa_enable': { bg: 'bg-success/10', text: 'text-success', icon: 'shield-alt' },
  '2fa_disable': { bg: 'bg-warning/10', text: 'text-warning', icon: 'shield-alt' },
  email_verification_enable: { bg: 'bg-success/10', text: 'text-success', icon: 'envelope' },
  email_verification_disable: { bg: 'bg-warning/10', text: 'text-warning', icon: 'envelope' },
  vault_unlock: { bg: 'bg-success/10', text: 'text-success', icon: 'lock-open' },
  vault_lock: { bg: 'bg-surfaceHover', text: 'text-textMuted', icon: 'lock' },
  item_create: { bg: 'bg-success/10', text: 'text-success', icon: 'plus' },
  item_update: { bg: 'bg-primary/10', text: 'text-primary', icon: 'edit' },
  item_delete: { bg: 'bg-danger/10', text: 'text-danger', icon: 'trash' },
  item_view: { bg: 'bg-surfaceHover', text: 'text-textMuted', icon: 'eye' },
  export_data: { bg: 'bg-warning/10', text: 'text-warning', icon: 'download' },
  import_data: { bg: 'bg-primary/10', text: 'text-primary', icon: 'upload' },
  settings_update: { bg: 'bg-primary/10', text: 'text-primary', icon: 'cog' },
  email_update: { bg: 'bg-primary/10', text: 'text-primary', icon: 'envelope' },
  database_reset: { bg: 'bg-danger/10', text: 'text-danger', icon: 'database' },
  backup_create: { bg: 'bg-success/10', text: 'text-success', icon: 'cloud-upload-alt' },
  backup_restore: { bg: 'bg-primary/10', text: 'text-primary', icon: 'cloud-download-alt' },
}

function AuditLogsContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState('')
  const pageSize = 15

  useEffect(() => {
    if (user) {
      fetchLogs()
    }
  }, [user, page, filter])

  const fetchLogs = async () => {
    if (!user) return
    setLoading(true)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const supabase = createClient(supabaseUrl, supabaseKey)

      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (filter) {
        query = query.eq('action', filter)
      }

      const { data, error, count } = await query

      if (error) throw error

      setLogs(data || [])
      setTotal(count || 0)
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    if (days < 7) return `${days} 天前`
    
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const totalPages = Math.ceil(total / pageSize)

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
                <span className="font-semibold text-text">{user?.siteTitle || 'SecureVault'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/vault')} className="text-textMuted hover:text-text">
                <Icon name="key" className="w-4 h-4 mr-1.5" />
                保险库
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-textMuted hover:text-text">
                <Icon name="chart-pie" className="w-4 h-4 mr-1.5" />
                仪表盘
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/settings')} className="text-textMuted hover:text-text">
                <Icon name="cog" className="w-4 h-4 mr-1.5" />
                设置
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text mb-1">安全审计日志</h1>
              <p className="text-textMuted">查看所有账户活动记录</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                <Icon name="filter" className="w-4 h-4 text-textMuted" />
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value)
                    setPage(0)
                  }}
                  className="bg-transparent text-sm text-text focus:outline-none cursor-pointer"
                >
                  <option value="">全部操作</option>
                  {Object.entries(ACTION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="bg-surface border border-border rounded-lg px-3 py-2">
                <span className="text-sm text-textMuted">共 </span>
                <span className="text-sm font-semibold text-text">{total}</span>
                <span className="text-sm text-textMuted"> 条</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-textMuted">加载中...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-surfaceHover rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="inbox" className="w-8 h-8 text-textMuted" />
              </div>
              <p className="text-text font-medium mb-1">暂无审计日志</p>
              <p className="text-textMuted text-sm">您的账户活动记录将显示在这里</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => {
                const style = ACTION_STYLES[log.action] || { bg: 'bg-surfaceHover', text: 'text-textMuted', icon: 'info' }
                return (
                  <div key={log.id} className="p-4 hover:bg-surfaceHover/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                        <Icon name={style.icon as any} className={`w-5 h-5 ${style.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${style.text}`}>
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                          {log.resource_type && (
                            <span className="text-xs px-2 py-0.5 bg-background rounded-full text-textMuted">
                              {log.resource_type === 'vault_item' ? '密码项' : log.resource_type}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-textMuted">
                          <span title={formatFullDate(log.created_at)}>{formatDate(log.created_at)}</span>
                          {log.ip_address && (
                            <span className="flex items-center gap-1">
                              <Icon name="globe" className="w-3 h-3" />
                              {log.ip_address}
                            </span>
                          )}
                          {log.details && typeof log.details === 'object' && (
                            <span className="truncate max-w-xs" title={JSON.stringify(log.details, null, 2)}>
                              {log.details.name || log.details.username || ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-4 border-t border-border bg-background/50">
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  variant="secondary"
                  size="sm"
                >
                  <Icon name="chevron-left" className="w-4 h-4 mr-1" />
                  上一页
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i
                    } else if (page < 2) {
                      pageNum = i
                    } else if (page > totalPages - 3) {
                      pageNum = totalPages - 5 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-primary text-white'
                            : 'bg-surface hover:bg-surfaceHover text-textMuted'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    )
                  })}
                </div>
                <Button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  variant="secondary"
                  size="sm"
                >
                  下一页
                  <Icon name="chevron-right" className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuditLogsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-textMuted text-sm">加载中...</p>
        </div>
      </div>
    }>
      <AuditLogsContent />
    </Suspense>
  )
}
