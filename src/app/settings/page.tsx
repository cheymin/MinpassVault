'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useVault } from '@/contexts/VaultContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { resetDatabase } from '@/lib/init'

export default function SettingsPage() {
  const { user, signOut, changePassword, updateSiteSettings } = useAuth()
  const { items, addItem } = useVault()
  const { showToast } = useToast()
  const router = useRouter()

  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [showSiteSettings, setShowSiteSettings] = useState(false)
  const [showSmtpSettings, setShowSmtpSettings] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [resetLoading, setResetLoading] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)

  const [siteTitle, setSiteTitle] = useState('')
  const [siteIcon, setSiteIcon] = useState('')
  const [siteSettingsLoading, setSiteSettingsLoading] = useState(false)
  const [siteSettingsError, setSiteSettingsError] = useState('')

  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpSecure, setSmtpSecure] = useState(false)
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpFrom, setSmtpFrom] = useState('')
  const [smtpSettingsLoading, setSmtpSettingsLoading] = useState(false)
  const [smtpSettingsError, setSmtpSettingsError] = useState('')

  useEffect(() => {
    if (user) {
      setSiteTitle(user.siteTitle || 'SecureVault密码管理器')
      setSiteIcon(user.siteIcon || 'https://djkl.qzz.io/file/1.webp')
    }
  }, [user])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword !== confirmPassword) {
      setPasswordError('两次密码不一致')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('密码至少需要8个字符')
      return
    }

    setPasswordLoading(true)
    const result = await changePassword(oldPassword, newPassword)
    setPasswordLoading(false)

    if (result.error) {
      setPasswordError(result.error)
    } else {
      showToast('密码修改成功', 'success')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setShowChangePassword(false), 1500)
    }
  }

  const handleReset = async () => {
    setResetLoading(true)
    const result = await resetDatabase()
    setResetLoading(false)

    if (result.error) {
      showToast('重置失败: ' + result.error, 'error')
    } else {
      showToast('数据库已重置', 'success')
      signOut()
      router.push('/')
    }
  }

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvLoading(true)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter((line) => line.trim())
      
      if (lines.length < 2) {
        throw new Error('CSV 文件为空或格式不正确')
      }

      const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/"/g, ''))
      const nameIndex = header.findIndex((h) => h === 'name' || h === '名称')
      const urlIndex = header.findIndex((h) => h === 'url' || h === '网址' || h === 'website')
      const usernameIndex = header.findIndex((h) => h === 'username' || h === '用户名')
      const passwordIndex = header.findIndex((h) => h === 'password' || h === '密码')
      const notesIndex = header.findIndex((h) => h === 'notes' || h === '备注')

      if (nameIndex === -1) {
        throw new Error('CSV 文件缺少名称列')
      }

      let imported = 0
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
        
        if (values.length < 1 || !values[nameIndex]) continue

        const data = {
          username: usernameIndex !== -1 ? values[usernameIndex] || '' : '',
          password: passwordIndex !== -1 ? values[passwordIndex] || '' : '',
          url: urlIndex !== -1 ? values[urlIndex] || '' : '',
          notes: notesIndex !== -1 ? values[notesIndex] || '' : '',
        }

        const result = await addItem({
          type: 'login',
          name: values[nameIndex],
          data,
          folderId: null,
          favorite: false,
        })

        if (!result.error) imported++
      }

      showToast(`成功导入 ${imported} 个项目`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '导入失败，请检查文件格式', 'error')
    } finally {
      setCsvLoading(false)
      e.target.value = ''
    }
  }

  const handleSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSiteSettingsError('')
    setSiteSettingsLoading(true)

    const result = await updateSiteSettings(siteTitle, siteIcon)
    setSiteSettingsLoading(false)

    if (result.error) {
      setSiteSettingsError(result.error)
    } else {
      showToast('设置已保存', 'success')
      setShowSiteSettings(false)
    }
  }

  const handleSmtpSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSmtpSettingsError('')
    setSmtpSettingsLoading(true)

    try {
      const response = await fetch('/api/smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: smtpHost,
          port: parseInt(smtpPort),
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
          from: smtpFrom,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setSmtpSettingsError(data.error || '保存失败')
      } else {
        showToast('SMTP 设置已保存', 'success')
        setShowSmtpSettings(false)
      }
    } catch (err) {
      setSmtpSettingsError('保存失败，请稍后重试')
    } finally {
      setSmtpSettingsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/vault')}
                className="flex items-center gap-2 text-textMuted hover:text-text"
              >
                <Icon name="arrow-left" className="w-5 h-5" />
                返回
              </button>
              <h1 className="text-lg font-semibold text-text">设置</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-medium text-text mb-4 flex items-center gap-2">
              <Icon name="user" className="w-5 h-5 text-primary" />
              账户信息
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                <span className="text-textMuted">用户名</span>
                <span className="text-text font-medium">{user?.username}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-medium text-text mb-4 flex items-center gap-2">
              <Icon name="globe" className="w-5 h-5 text-primary" />
              网站设置
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                <div>
                  <p className="text-text">网站标题</p>
                  <p className="text-sm text-textMuted">{user?.siteTitle || 'SecureVault密码管理器'}</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                <div>
                  <p className="text-text">网站图标</p>
                  <div className="flex items-center gap-2 mt-1">
                    <img 
                      src={user?.siteIcon || 'https://djkl.qzz.io/file/1.webp'} 
                      alt="网站图标" 
                      className="w-6 h-6 rounded"
                    />
                    <p className="text-sm text-textMuted truncate max-w-[200px]">
                      {user?.siteIcon || 'https://djkl.qzz.io/file/1.webp'}
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={() => setShowSiteSettings(true)} variant="secondary" className="w-full mt-2">
                修改网站设置
              </Button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-medium text-text mb-4 flex items-center gap-2">
              <Icon name="lock" className="w-5 h-5 text-primary" />
              安全设置
            </h2>
            <Button onClick={() => setShowChangePassword(true)} variant="secondary" className="w-full">
              更改主密码
            </Button>
          </div>

          <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-medium text-text mb-4 flex items-center gap-2">
              <Icon name="envelope" className="w-5 h-5 text-primary" />
              邮件设置
            </h2>
            <p className="text-sm text-textMuted mb-4">
              配置 SMTP 邮件服务以支持密码重置和邮箱验证功能
            </p>
            <Button onClick={() => setShowSmtpSettings(true)} variant="secondary" className="w-full">
              配置 SMTP 邮件
            </Button>
          </div>

          <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-medium text-text mb-4 flex items-center gap-2">
              <Icon name="database" className="w-5 h-5 text-primary" />
              数据管理
            </h2>
            <div className="space-y-3">
              <Button onClick={() => setShowCsvImport(true)} variant="secondary" className="w-full">
                从 CSV 导入密码
              </Button>
              <p className="text-xs text-textMuted">
                支持 Chrome、Firefox 等浏览器导出的 CSV 格式
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-danger/10 to-red-900/10 border border-danger/30 rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-medium text-danger mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              危险区域
            </h2>
            <p className="text-sm text-textMuted mb-4">
              重置数据库将删除所有用户数据和密码，此操作不可恢复。
            </p>
            <Button variant="danger" onClick={() => setShowReset(true)}>
              重置数据库
            </Button>
          </div>
        </div>
      </div>

      <Modal isOpen={showSiteSettings} onClose={() => setShowSiteSettings(false)} title="网站设置" size="sm">
        <form onSubmit={handleSiteSettings} className="space-y-4">
          <Input
            type="text"
            label="网站标题"
            placeholder="请输入网站标题"
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text mb-1">网站图标 URL</label>
            <Input
              type="url"
              placeholder="请输入图标URL"
              value={siteIcon}
              onChange={(e) => setSiteIcon(e.target.value)}
              required
            />
            {siteIcon && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-textMuted">预览:</span>
                <img src={siteIcon} alt="图标预览" className="w-8 h-8 rounded" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }} />
              </div>
            )}
          </div>
          {siteSettingsError && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {siteSettingsError}
            </div>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowSiteSettings(false)} className="flex-1">
              取消
            </Button>
            <Button type="submit" className="flex-1" loading={siteSettingsLoading}>
              保存
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showSmtpSettings} onClose={() => setShowSmtpSettings(false)} title="SMTP 邮件配置" size="sm">
        <form onSubmit={handleSmtpSettings} className="space-y-4">
          <Input
            type="text"
            label="SMTP 服务器"
            placeholder="例如: smtp.gmail.com"
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            required
          />
          <Input
            type="number"
            label="端口"
            placeholder="例如: 587"
            value={smtpPort}
            onChange={(e) => setSmtpPort(e.target.value)}
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="smtpSecure"
              checked={smtpSecure}
              onChange={(e) => setSmtpSecure(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary"
            />
            <label htmlFor="smtpSecure" className="text-sm text-text">
              使用 SSL/TLS
            </label>
          </div>
          <Input
            type="text"
            label="用户名"
            placeholder="邮箱地址"
            value={smtpUser}
            onChange={(e) => setSmtpUser(e.target.value)}
            required
          />
          <Input
            type="password"
            label="密码"
            placeholder="邮箱密码或应用专用密码"
            value={smtpPass}
            onChange={(e) => setSmtpPass(e.target.value)}
            required
          />
          <Input
            type="email"
            label="发件人地址"
            placeholder="例如: noreply@securevault.com"
            value={smtpFrom}
            onChange={(e) => setSmtpFrom(e.target.value)}
            required
          />
          {smtpSettingsError && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {smtpSettingsError}
            </div>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowSmtpSettings(false)} className="flex-1">
              取消
            </Button>
            <Button type="submit" className="flex-1" loading={smtpSettingsLoading}>
              保存配置
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} title="更改主密码" size="sm">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            type="password"
            label="原密码"
            placeholder="请输入原密码"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            label="新密码"
            placeholder="请输入新密码"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            label="确认新密码"
            placeholder="再次输入新密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {passwordError && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {passwordError}
            </div>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowChangePassword(false)} className="flex-1">
              取消
            </Button>
            <Button type="submit" className="flex-1" loading={passwordLoading}>
              确认更改
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showCsvImport} onClose={() => setShowCsvImport(false)} title="从 CSV 导入" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-textMuted">
            选择一个 CSV 文件导入密码。支持的列名：name, url, username, password, notes
          </p>
          <label className="block">
            <div className="w-full bg-surface border border-border border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primaryLight transition-colors">
              <svg className="w-12 h-12 mx-auto text-textMuted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-textMuted">点击选择 CSV 文件</span>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvImport}
              className="hidden"
              disabled={csvLoading}
            />
          </label>
          <Button variant="secondary" onClick={() => setShowCsvImport(false)} className="w-full">
            关闭
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showReset} onClose={() => setShowReset(false)} title="确认重置数据库" size="sm">
        <div className="space-y-4">
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
            <p className="text-danger font-medium mb-2">⚠️ 警告</p>
            <p className="text-sm text-textMuted">
              此操作将永久删除所有数据，包括用户账户和所有密码。此操作不可恢复！
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowReset(false)} className="flex-1">
              取消
            </Button>
            <Button variant="danger" onClick={handleReset} loading={resetLoading} className="flex-1">
              确认重置
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
