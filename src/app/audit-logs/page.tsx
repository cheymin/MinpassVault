'use client'

import { useState, useEffect, Suspense } from 'react'
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

const ACTION_COLORS: Record<string, string> = {
  login: 'text-success',
  logout: 'text-textMuted',
  login_failed: 'text-danger',
  password_change: 'text-warning',
  '2fa_enable': 'text-success',
  '2fa_disable': 'text-warning',
  email_verification_enable: 'text-success',
  email_verification_disable: 'text-warning',
  vault_unlock: 'text-success',
  vault_lock: 'text-textMuted',
  item_create: 'text-success',
  item_update: 'text-primary',
  item_delete: 'text-danger',
  item_view: 'text-textMuted',
  export_data: 'text-warning',
  import_data: 'text-primary',
  settings_update: 'text-primary',
  email_update: 'text-primary',
  database_reset: 'text-danger',
  backup_create: 'text-success',
  backup_restore: 'text-primary',
}

function AuditLogsContent() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState('')
  const pageSize = 20

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
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">安全审计日志</h1>
              <p className="text-textMuted">查看所有账户活动记录</p>
            </div>
            <Button onClick={() => window.location.href = '/vault'} variant="secondary">
              <Icon name="arrow-left" className="w-4 h-4 mr-2" />
              返回保险库
            </Button>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Icon name="filter" className="w-4 h-4 text-textMuted" />
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value)
                  setPage(0)
                }}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">全部操作</option>
                {Object.entries(ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-textMuted">
              共 {total} 条记录
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Icon name="spinner" className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-textMuted">加载中...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center">
              <Icon name="inbox" className="w-12 h-12 text-textMuted mx-auto mb-4" />
              <p className="text-textMuted">暂无审计日志</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">操作</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">资源</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">详情</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">IP地址</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-background/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-textMuted whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${ACTION_COLORS[log.action] || 'text-text'}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text">
                        {log.resource_type && (
                          <span className="inline-flex items-center gap-1">
                            <Icon name={log.resource_type === 'vault_item' ? 'key' : 'cube'} className="w-3 h-3" />
                            {log.resource_type}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-textMuted max-w-xs truncate">
                        {log.details && typeof log.details === 'object' && (
                          <span title={JSON.stringify(log.details, null, 2)}>
                            {log.details.name || log.details.username || JSON.stringify(log.details).slice(0, 50)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-textMuted">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <Button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                variant="secondary"
                size="sm"
              >
                上一页
              </Button>
              <span className="text-sm text-textMuted">
                第 {page + 1} / {totalPages} 页
              </span>
              <Button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                variant="secondary"
                size="sm"
              >
                下一页
              </Button>
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
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="spinner" className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <AuditLogsContent />
    </Suspense>
  )
}
