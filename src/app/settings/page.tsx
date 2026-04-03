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
import { generateTOTPSecret, verifyTOTP } from '@/lib/totp'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const { user, signOut, changePassword, updateSiteSettings, updateEmail, enableEmailVerification, disableEmailVerification } = useAuth()
  const { items, addItem } = useVault()
  const { showToast } = useToast()
  const router = useRouter()

  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [showSiteSettings, setShowSiteSettings] = useState(false)
  const [showSmtpSettings, setShowSmtpSettings] = useState(false)
  const [show2FASettings, setShow2FASettings] = useState(false)
  const [showEmailSettings, setShowEmailSettings] = useState(false)
  const [showEmailVerificationSettings, setShowEmailVerificationSettings] = useState(false)

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

  const [emailServiceType, setEmailServiceType] = useState<'smtp' | 'resend'>('smtp')
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpSecure, setSmtpSecure] = useState(true)
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpFrom, setSmtpFrom] = useState('')
  const [resendApiKey, setResendApiKey] = useState('')
  const [resendFrom, setResendFrom] = useState('')
  const [emailSettingsLoading, setEmailSettingsLoading] = useState(false)
  const [emailSettingsError, setEmailSettingsError] = useState('')

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorSecret, setTwoFactorSecret] = useState('')
  const [twoFactorQrUri, setTwoFactorQrUri] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [twoFactorError, setTwoFactorError] = useState('')
  const [twoFactorStep, setTwoFactorStep] = useState<'setup' | 'verify' | 'disable'>('setup')

  const [email, setEmail] = useState('')
  const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(false)
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false)
  const [emailVerificationError, setEmailVerificationError] = useState('')

  useEffect(() => {
    if (user) {
      setSiteTitle(user.siteTitle || 'SecureVault密码管理器')
      setSiteIcon(user.siteIcon || 'https://djkl.qzz.io/file/1.webp')
      setTwoFactorEnabled(user.twoFactorEnabled || false)
      setEmail(user.email || '')
      setEmailVerificationEnabled(user.emailVerificationEnabled || false)
    }
  }, [user])

  useEffect(() => {
    const loadEmailConfig = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/smtp?userId=${user.id}`)
          const data = await response.json()
          
          if (data.success && data.config) {
            setEmailServiceType(data.config.email_service_type || 'smtp')
            setSmtpHost(data.config.smtp_host || '')
            setSmtpPort(data.config.smtp_port?.toString() || '587')
            setSmtpSecure(data.config.smtp_secure ?? true)
            setSmtpUser(data.config.smtp_user || '')
            setSmtpPass(data.config.smtp_pass || '')
            setSmtpFrom(data.config.smtp_from || '')
            setResendApiKey(data.config.resend_api_key || '')
            setResendFrom(data.config.resend_from || '')
          }
        } catch (err) {
          console.error('Failed to load email config:', err)
        }
      }
    }
    
    loadEmailConfig()
  }, [user?.id])

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

  const handleEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailSettingsError('')
    setEmailSettingsLoading(true)

    if (!user?.id) {
      setEmailSettingsError('用户信息错误')
      setEmailSettingsLoading(false)
      return
    }

    if (emailServiceType === 'smtp') {
      if (!smtpHost.trim() || !smtpUser.trim() || !smtpPass.trim()) {
        setEmailSettingsError('请填写完整的SMTP配置信息')
        setEmailSettingsLoading(false)
        return
      }
    } else {
      if (!resendApiKey.trim()) {
        setEmailSettingsError('请输入 Resend API Key')
        setEmailSettingsLoading(false)
        return
      }
    }

    try {
      const response = await fetch('/api/smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailServiceType,
          smtpHost: smtpHost.trim(),
          smtpPort: parseInt(smtpPort) || 587,
          smtpSecure,
          smtpUser: smtpUser.trim(),
          smtpPass: smtpPass.trim(),
          smtpFrom: smtpFrom.trim(),
          resendApiKey: resendApiKey.trim(),
          resendFrom: resendFrom.trim() || 'onboarding@resend.dev',
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setEmailSettingsError(data.error || '保存失败')
      } else {
        showToast('邮件配置已保存', 'success')
        setShowSmtpSettings(false)
      }
    } catch (err) {
      setEmailSettingsError('保存失败，请稍后重试')
    } finally {
      setEmailSettingsLoading(false)
    }
  }

  const handleEnable2FA = () => {
    if (!user?.username) return
    
    const { secret, uri } = generateTOTPSecret(user.username)
    setTwoFactorSecret(secret)
    setTwoFactorQrUri(uri)
    setTwoFactorStep('verify')
    setTwoFactorCode('')
    setTwoFactorError('')
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setTwoFactorError('')
    setTwoFactorLoading(true)

    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setTwoFactorError('请输入6位验证码')
      setTwoFactorLoading(false)
      return
    }

    const isValid = verifyTOTP(twoFactorSecret, twoFactorCode)
    if (!isValid) {
      setTwoFactorError('验证码无效，请重试')
      setTwoFactorLoading(false)
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          two_factor_enabled: true,
          two_factor_secret: twoFactorSecret,
        })
        .eq('id', user?.id)

      if (error) {
        setTwoFactorError('启用两步验证失败')
      } else {
        setTwoFactorEnabled(true)
        showToast('两步验证已启用', 'success')
        setShow2FASettings(false)
        setTwoFactorStep('setup')
      }
    } catch (err) {
      setTwoFactorError('启用两步验证失败')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailVerificationError('')
    setEmailVerificationLoading(true)

    const result = await updateEmail(email)
    setEmailVerificationLoading(false)

    if (result.error) {
      setEmailVerificationError(result.error)
    } else {
      showToast('邮箱已更新', 'success')
      setShowEmailSettings(false)
    }
  }

  const handleEnableEmailVerification = async () => {
    setEmailVerificationLoading(true)
    const result = await enableEmailVerification()
    setEmailVerificationLoading(false)

    if (result.error) {
      showToast(result.error, 'error')
    } else {
      setEmailVerificationEnabled(true)
      showToast('邮箱验证登录已启用', 'success')
      setShowEmailVerificationSettings(false)
    }
  }

  const handleDisableEmailVerification = async () => {
    setEmailVerificationLoading(true)
    const result = await disableEmailVerification()
    setEmailVerificationLoading(false)

    if (result.error) {
      showToast(result.error, 'error')
    } else {
      setEmailVerificationEnabled(false)
      showToast('邮箱验证登录已禁用', 'success')
      setShowEmailVerificationSettings(false)
    }
  }

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setTwoFactorError('')
    setTwoFactorLoading(true)

    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setTwoFactorError('请输入6位验证码')
      setTwoFactorLoading(false)
      return
    }

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('two_factor_secret')
        .eq('id', user?.id)
        .single()

      if (!userData?.two_factor_secret) {
        setTwoFactorError('未找到两步验证信息')
        setTwoFactorLoading(false)
        return
      }

      const isValid = verifyTOTP(userData.two_factor_secret, twoFactorCode)
      if (!isValid) {
        setTwoFactorError('验证码无效')
        setTwoFactorLoading(false)
        return
      }

      const { error } = await supabase
        .from('users')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
        })
        .eq('id', user?.id)

      if (error) {
        setTwoFactorError('禁用两步验证失败')
      } else {
        setTwoFactorEnabled(false)
        showToast('两步验证已禁用', 'success')
        setShow2FASettings(false)
        setTwoFactorStep('setup')
      }
    } catch (err) {
      setTwoFactorError('禁用两步验证失败')
    } finally {
      setTwoFactorLoading(false)
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
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                <span className="text-textMuted">邮箱</span>
                <span className="text-text font-medium">{user?.email || '未设置'}</span>
              </div>
              <Button onClick={() => setShowEmailSettings(true)} variant="secondary" className="w-full mt-2">
                设置邮箱
              </Button>
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
            <div className="space-y-3">
              <Button onClick={() => setShowChangePassword(true)} variant="secondary" className="w-full">
                更改主密码
              </Button>
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon name="shield" className="w-4 h-4 text-textMuted" />
                  <span className="text-sm text-text">两步验证</span>
                </div>
                <span className={`text-sm ${twoFactorEnabled ? 'text-success' : 'text-textMuted'}`}>
                  {twoFactorEnabled ? '已启用' : '未启用'}
                </span>
              </div>
              <Button 
                onClick={() => {
                  setTwoFactorStep(twoFactorEnabled ? 'disable' : 'setup')
                  setTwoFactorCode('')
                  setTwoFactorError('')
                  setShow2FASettings(true)
                }} 
                variant="secondary" 
                className="w-full"
              >
                {twoFactorEnabled ? '管理两步验证' : '启用两步验证'}
              </Button>
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon name="envelope" className="w-4 h-4 text-textMuted" />
                  <span className="text-sm text-text">邮箱验证登录</span>
                </div>
                <span className={`text-sm ${emailVerificationEnabled ? 'text-success' : 'text-textMuted'}`}>
                  {emailVerificationEnabled ? '已启用' : '未启用'}
                </span>
              </div>
              <Button 
                onClick={() => setShowEmailVerificationSettings(true)} 
                variant="secondary" 
                className="w-full"
              >
                {emailVerificationEnabled ? '管理邮箱验证' : '启用邮箱验证'}
              </Button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-surface to-surfaceHover border border-border rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-medium text-text mb-4 flex items-center gap-2">
              <Icon name="envelope" className="w-5 h-5 text-primary" />
              邮件设置
            </h2>
            <p className="text-sm text-textMuted mb-4">
              配置邮件服务以支持密码重置功能
            </p>
            <Button onClick={() => setShowSmtpSettings(true)} variant="secondary" className="w-full">
              配置邮件服务
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

      <Modal isOpen={showSmtpSettings} onClose={() => setShowSmtpSettings(false)} title="邮件服务配置" size="sm">
        <form onSubmit={handleEmailSettings} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-textMuted">选择邮件服务</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEmailServiceType('smtp')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${
                  emailServiceType === 'smtp'
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-textMuted hover:text-text'
                }`}
              >
                SMTP
              </button>
              <button
                type="button"
                onClick={() => setEmailServiceType('resend')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${
                  emailServiceType === 'resend'
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-textMuted hover:text-text'
                }`}
              >
                Resend
              </button>
            </div>
          </div>

          {emailServiceType === 'smtp' ? (
            <>
              <Input
                type="text"
                label="SMTP 服务器"
                placeholder="例如: smtp.gmail.com"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
              />
              <Input
                type="number"
                label="端口"
                placeholder="587"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  checked={smtpSecure}
                  onChange={(e) => setSmtpSecure(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-surface text-primary"
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
              />
              <Input
                type="password"
                label="密码"
                placeholder="邮箱密码或应用专用密码"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
              />
              <Input
                type="email"
                label="发件人地址"
                placeholder="例如: noreply@yourdomain.com"
                value={smtpFrom}
                onChange={(e) => setSmtpFrom(e.target.value)}
              />
            </>
          ) : (
            <>
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
                <p className="font-medium text-text mb-1">💡 如何获取 Resend API Key</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-textMuted">
                  <li>访问 <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com</a> 注册账号</li>
                  <li>在 Dashboard 中创建 API Key</li>
                  <li>复制 API Key 粘贴到下方</li>
                </ol>
              </div>
              <Input
                type="text"
                label="Resend API Key"
                placeholder="re_xxxxxxxxxxxx"
                value={resendApiKey}
                onChange={(e) => setResendApiKey(e.target.value)}
              />
              <Input
                type="email"
                label="发件人邮箱（可选）"
                placeholder="例如: noreply@yourdomain.com"
                value={resendFrom}
                onChange={(e) => setResendFrom(e.target.value)}
              />
              <p className="text-xs text-textMuted">
                留空则使用 Resend 默认发件地址 onboarding@resend.dev
              </p>
            </>
          )}

          {emailSettingsError && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {emailSettingsError}
            </div>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowSmtpSettings(false)} className="flex-1">
              取消
            </Button>
            <Button type="submit" className="flex-1" loading={emailSettingsLoading}>
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

      <Modal 
        isOpen={show2FASettings} 
        onClose={() => {
          setShow2FASettings(false)
          setTwoFactorStep(twoFactorEnabled ? 'disable' : 'setup')
          setTwoFactorCode('')
          setTwoFactorError('')
        }} 
        title={twoFactorEnabled ? '管理两步验证' : '启用两步验证'} 
        size="sm"
      >
        {twoFactorStep === 'setup' && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-text mb-2">
                两步验证可以为您的账户添加额外的安全保护。启用后，登录时需要输入验证器应用生成的6位验证码。
              </p>
            </div>
            <div className="space-y-2 text-sm text-textMuted">
              <p>推荐验证器应用：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Google Authenticator</li>
                <li>Microsoft Authenticator</li>
                <li>Authy</li>
              </ul>
            </div>
            <Button onClick={handleEnable2FA} className="w-full">
              开始设置
            </Button>
          </div>
        )}

        {twoFactorStep === 'verify' && (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div className="p-4 bg-surface border border-border rounded-lg">
              <p className="text-sm text-textMuted mb-3">1. 使用验证器应用扫描下方二维码：</p>
              <div className="flex justify-center mb-3">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactorQrUri)}`}
                  alt="2FA QR Code"
                  className="w-48 h-48 rounded-lg"
                />
              </div>
              <p className="text-xs text-textMuted text-center mb-3">或手动输入密钥：</p>
              <code className="block p-2 bg-background rounded text-xs text-center break-all select-all">
                {twoFactorSecret}
              </code>
            </div>
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
              <p className="text-text">2. 输入验证器应用显示的6位验证码：</p>
            </div>
            <Input
              type="text"
              label="验证码"
              placeholder="请输入6位验证码"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
            />
            {twoFactorError && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                {twoFactorError}
              </div>
            )}
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setTwoFactorStep('setup')} 
                className="flex-1"
              >
                返回
              </Button>
              <Button type="submit" className="flex-1" loading={twoFactorLoading}>
                确认启用
              </Button>
            </div>
          </form>
        )}

        {twoFactorStep === 'disable' && (
          <form onSubmit={handleDisable2FA} className="space-y-4">
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-text">
                禁用两步验证将降低账户安全性。请输入当前验证器应用显示的验证码以确认禁用。
              </p>
            </div>
            <Input
              type="text"
              label="验证码"
              placeholder="请输入6位验证码"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
            />
            {twoFactorError && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                {twoFactorError}
              </div>
            )}
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setShow2FASettings(false)} 
                className="flex-1"
              >
                取消
              </Button>
              <Button type="submit" variant="danger" className="flex-1" loading={twoFactorLoading}>
                禁用两步验证
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={showEmailSettings} onClose={() => setShowEmailSettings(false)} title="设置邮箱" size="sm">
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
            <p className="text-text">邮箱用于密码重置和邮箱验证登录功能</p>
          </div>
          <Input
            type="email"
            label="邮箱地址"
            placeholder="请输入邮箱地址"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {emailVerificationError && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {emailVerificationError}
            </div>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowEmailSettings(false)} className="flex-1">
              取消
            </Button>
            <Button type="submit" className="flex-1" loading={emailVerificationLoading}>
              保存
            </Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={showEmailVerificationSettings} 
        onClose={() => setShowEmailVerificationSettings(false)} 
        title={emailVerificationEnabled ? '管理邮箱验证登录' : '启用邮箱验证登录'} 
        size="sm"
      >
        <div className="space-y-4">
          {!emailVerificationEnabled ? (
            <>
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-text mb-2">
                  启用邮箱验证登录后，每次登录时将向您的邮箱发送验证码，提供额外的安全保护。
                </p>
                <p className="text-xs text-textMuted">
                  注意：需要先设置邮箱地址并配置邮件服务
                </p>
              </div>
              {!user?.email && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm text-warning">
                  请先在账户信息中设置邮箱地址
                </div>
              )}
              <Button 
                onClick={handleEnableEmailVerification} 
                className="w-full" 
                loading={emailVerificationLoading}
                disabled={!user?.email}
              >
                启用邮箱验证登录
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-text">
                  邮箱验证登录已启用。每次登录时，系统将向您的邮箱发送验证码。
                </p>
              </div>
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-textMuted">
                  禁用后，登录时将不再需要邮箱验证码。
                </p>
              </div>
              <Button 
                variant="danger" 
                onClick={handleDisableEmailVerification} 
                className="w-full" 
                loading={emailVerificationLoading}
              >
                禁用邮箱验证登录
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => setShowEmailVerificationSettings(false)} className="w-full">
            关闭
          </Button>
        </div>
      </Modal>
    </div>
  )
}
