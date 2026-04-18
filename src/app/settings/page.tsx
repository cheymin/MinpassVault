'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useVault } from '@/contexts/VaultContext'
import { useToast } from '@/contexts/ToastContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { resetDatabase } from '@/lib/init'
import { generateTOTPSecret, verifyTOTP } from '@/lib/totp'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const { user, signOut, changePassword, updateEmail, enableEmailVerification, disableEmailVerification } = useAuth()
  const { items, addItem } = useVault()
  const { showToast } = useToast()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()

  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [showCsvImport, setShowCsvImport] = useState(false)
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

  const [showWebDAVSettings, setShowWebDAVSettings] = useState(false)
  const [webdavUrl, setWebdavUrl] = useState('')
  const [webdavUsername, setWebdavUsername] = useState('')
  const [webdavPassword, setWebdavPassword] = useState('')
  const [webdavAutoBackup, setWebdavAutoBackup] = useState(false)
  const [webdavLoading, setWebdavLoading] = useState(false)
  const [webdavError, setWebdavError] = useState('')
  const [backupLoading, setBackupLoading] = useState(false)

  useEffect(() => {
    if (user) {
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

  useEffect(() => {
    const loadWebDAVConfig = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('webdav_url, webdav_username, webdav_password, webdav_auto_backup')
            .eq('id', user.id)
            .single()
          
          if (data) {
            setWebdavUrl(data.webdav_url || '')
            setWebdavUsername(data.webdav_username || '')
            setWebdavPassword(data.webdav_password || '')
            setWebdavAutoBackup(data.webdav_auto_backup || false)
          }
        } catch (err) {
          console.error('Failed to load WebDAV config:', err)
        }
      }
    }
    
    loadWebDAVConfig()
  }, [user?.id])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword !== confirmPassword) {
      setPasswordError(language === 'zh' ? '两次密码不一致' : 'Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError(language === 'zh' ? '密码至少需要8个字符' : 'Password must be at least 8 characters')
      return
    }

    setPasswordLoading(true)
    const result = await changePassword(oldPassword, newPassword)
    setPasswordLoading(false)

    if (result.error) {
      setPasswordError(result.error)
    } else {
      showToast(language === 'zh' ? '密码修改成功' : 'Password changed successfully', 'success')
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
      showToast(language === 'zh' ? '重置失败: ' : 'Reset failed: ' + result.error, 'error')
    } else {
      showToast(language === 'zh' ? '数据库已重置' : 'Database reset', 'success')
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
        throw new Error(language === 'zh' ? 'CSV 文件为空或格式不正确' : 'CSV file is empty or invalid')
      }

      const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/"/g, ''))
      const nameIndex = header.findIndex((h) => h === 'name' || h === '名称')
      const urlIndex = header.findIndex((h) => h === 'url' || h === '网址' || h === 'website')
      const usernameIndex = header.findIndex((h) => h === 'username' || h === '用户名')
      const passwordIndex = header.findIndex((h) => h === 'password' || h === '密码')
      const notesIndex = header.findIndex((h) => h === 'notes' || h === '备注')

      if (nameIndex === -1) {
        throw new Error(language === 'zh' ? 'CSV 文件缺少名称列' : 'CSV file missing name column')
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

      showToast(language === 'zh' ? `成功导入 ${imported} 个项目` : `Successfully imported ${imported} items`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : (language === 'zh' ? '导入失败' : 'Import failed'), 'error')
    } finally {
      setCsvLoading(false)
      e.target.value = ''
    }
  }

  const handleEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailSettingsError('')
    setEmailSettingsLoading(true)

    if (!user?.id) {
      setEmailSettingsError(language === 'zh' ? '用户信息错误' : 'User info error')
      setEmailSettingsLoading(false)
      return
    }

    if (emailServiceType === 'smtp') {
      if (!smtpHost.trim() || !smtpUser.trim() || !smtpPass.trim()) {
        setEmailSettingsError(language === 'zh' ? '请填写完整的SMTP配置信息' : 'Please fill in all SMTP fields')
        setEmailSettingsLoading(false)
        return
      }
    } else {
      if (!resendApiKey.trim()) {
        setEmailSettingsError(language === 'zh' ? '请输入 Resend API Key' : 'Please enter Resend API Key')
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
        setEmailSettingsError(data.error || (language === 'zh' ? '保存失败' : 'Save failed'))
      } else {
        showToast(language === 'zh' ? '邮件配置已保存' : 'Email settings saved', 'success')
        setShowSmtpSettings(false)
      }
    } catch (err) {
      setEmailSettingsError(language === 'zh' ? '保存失败，请稍后重试' : 'Save failed, please try again')
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
      setTwoFactorError(language === 'zh' ? '请输入6位验证码' : 'Please enter 6-digit code')
      setTwoFactorLoading(false)
      return
    }

    const isValid = verifyTOTP(twoFactorSecret, twoFactorCode)
    if (!isValid) {
      setTwoFactorError(language === 'zh' ? '验证码无效，请重试' : 'Invalid code, please try again')
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
        setTwoFactorError(language === 'zh' ? '启用两步验证失败' : 'Failed to enable 2FA')
      } else {
        setTwoFactorEnabled(true)
        showToast(language === 'zh' ? '两步验证已启用' : '2FA enabled', 'success')
        setShow2FASettings(false)
        setTwoFactorStep('setup')
      }
    } catch (err) {
      setTwoFactorError(language === 'zh' ? '启用两步验证失败' : 'Failed to enable 2FA')
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
      showToast(language === 'zh' ? '邮箱已更新' : 'Email updated', 'success')
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
      showToast(language === 'zh' ? '邮箱验证登录已启用' : 'Email verification enabled', 'success')
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
      showToast(language === 'zh' ? '邮箱验证登录已禁用' : 'Email verification disabled', 'success')
      setShowEmailVerificationSettings(false)
    }
  }

  const handleTestWebDAV = async () => {
    if (!webdavUrl || !webdavUsername || !webdavPassword) {
      setWebdavError(language === 'zh' ? '请填写完整的 WebDAV 配置' : 'Please fill in all WebDAV fields')
      return
    }

    setWebdavLoading(true)
    setWebdavError('')

    try {
      const response = await fetch('/api/webdav/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webdavUrl,
          username: webdavUsername,
          password: webdavPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        showToast(language === 'zh' ? 'WebDAV 连接成功' : 'WebDAV connected', 'success')
      } else {
        setWebdavError(data.error || (language === 'zh' ? '连接失败' : 'Connection failed'))
      }
    } catch (err) {
      setWebdavError(language === 'zh' ? '连接失败' : 'Connection failed')
    } finally {
      setWebdavLoading(false)
    }
  }

  const handleSaveWebDAV = async () => {
    if (!user?.id) return

    setWebdavLoading(true)
    setWebdavError('')

    try {
      const { error } = await supabase
        .from('users')
        .update({
          webdav_url: webdavUrl,
          webdav_username: webdavUsername,
          webdav_password: webdavPassword,
          webdav_auto_backup: webdavAutoBackup,
        })
        .eq('id', user.id)

      if (error) {
        setWebdavError(error.message)
      } else {
        showToast(language === 'zh' ? 'WebDAV 配置已保存' : 'WebDAV settings saved', 'success')
        setShowWebDAVSettings(false)
      }
    } catch (err) {
      setWebdavError(language === 'zh' ? '保存失败' : 'Save failed')
    } finally {
      setWebdavLoading(false)
    }
  }

  const handleBackup = async () => {
    if (!user?.id) return

    setBackupLoading(true)

    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          webdavUrl,
          webdavUsername,
          webdavPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        showToast(language === 'zh' ? `备份成功: ${data.filename}` : `Backup successful: ${data.filename}`, 'success')
      } else {
        showToast(data.error || (language === 'zh' ? '备份失败' : 'Backup failed'), 'error')
      }
    } catch (err) {
      showToast(language === 'zh' ? '备份失败' : 'Backup failed', 'error')
    } finally {
      setBackupLoading(false)
    }
  }

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setTwoFactorError('')
    setTwoFactorLoading(true)

    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setTwoFactorError(language === 'zh' ? '请输入6位验证码' : 'Please enter 6-digit code')
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
        setTwoFactorError(language === 'zh' ? '未找到两步验证信息' : '2FA info not found')
        setTwoFactorLoading(false)
        return
      }

      const isValid = verifyTOTP(userData.two_factor_secret, twoFactorCode)
      if (!isValid) {
        setTwoFactorError(language === 'zh' ? '验证码无效' : 'Invalid code')
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
        setTwoFactorError(language === 'zh' ? '禁用两步验证失败' : 'Failed to disable 2FA')
      } else {
        setTwoFactorEnabled(false)
        showToast(language === 'zh' ? '两步验证已禁用' : '2FA disabled', 'success')
        setShow2FASettings(false)
        setTwoFactorStep('setup')
      }
    } catch (err) {
      setTwoFactorError(language === 'zh' ? '禁用两步验证失败' : 'Failed to disable 2FA')
    } finally {
      setTwoFactorLoading(false)
    }
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
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-textMuted hover:text-text">
                <Icon name="chart-pie" className="w-4 h-4 mr-1.5" />
                {t('dashboard')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/audit-logs')} className="text-textMuted hover:text-text">
                <Icon name="history" className="w-4 h-4 mr-1.5" />
                {t('auditLogs')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text mb-1">{t('settings')}</h1>
          <p className="text-textMuted">{language === 'zh' ? '管理您的账户和应用配置' : 'Manage your account and app settings'}</p>
        </div>

        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="user" className="w-4 h-4 text-primary" />
              </div>
              {t('accountInfo')}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-textMuted text-sm">{t('username')}</span>
                <span className="text-text font-medium">{user?.username}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-textMuted text-sm">{t('email')}</span>
                <span className="text-text font-medium">{user?.email || (language === 'zh' ? '未设置' : 'Not set')}</span>
              </div>
              <Button onClick={() => setShowEmailSettings(true)} variant="secondary" className="w-full mt-2">
                {language === 'zh' ? '设置邮箱' : 'Set Email'}
              </Button>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="palette" className="w-4 h-4 text-primary" />
              </div>
              {t('appearance')}
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <div>
                  <span className="text-text text-sm font-medium">{t('theme')}</span>
                  <p className="text-xs text-textMuted">{language === 'zh' ? '选择暗色或亮色主题' : 'Choose dark or light theme'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      theme === 'dark' ? 'bg-primary text-white' : 'bg-surfaceHover text-textMuted hover:text-text'
                    }`}
                  >
                    {t('darkMode')}
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      theme === 'light' ? 'bg-primary text-white' : 'bg-surfaceHover text-textMuted hover:text-text'
                    }`}
                  >
                    {t('lightMode')}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-border">
                <div>
                  <span className="text-text text-sm font-medium">{t('language')}</span>
                  <p className="text-xs text-textMuted">{language === 'zh' ? '选择界面语言' : 'Select interface language'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLanguage('zh')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      language === 'zh' ? 'bg-primary text-white' : 'bg-surfaceHover text-textMuted hover:text-text'
                    }`}
                  >
                    中文
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      language === 'en' ? 'bg-primary text-white' : 'bg-surfaceHover text-textMuted hover:text-text'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="lock" className="w-4 h-4 text-primary" />
              </div>
              {t('securitySettings')}
            </h2>
            <div className="space-y-3">
              <Button onClick={() => setShowChangePassword(true)} variant="secondary" className="w-full">
                {t('changePassword')}
              </Button>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Icon name="shield" className="w-4 h-4 text-textMuted" />
                  <span className="text-sm text-text">{t('twoFactorAuth')}</span>
                </div>
                <span className={`text-sm font-medium ${twoFactorEnabled ? 'text-success' : 'text-textMuted'}`}>
                  {twoFactorEnabled ? t('enabled') : t('disabled')}
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
                {twoFactorEnabled ? (language === 'zh' ? '管理两步验证' : 'Manage 2FA') : (language === 'zh' ? '启用两步验证' : 'Enable 2FA')}
              </Button>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Icon name="envelope" className="w-4 h-4 text-textMuted" />
                  <span className="text-sm text-text">{t('emailVerification')}</span>
                </div>
                <span className={`text-sm font-medium ${emailVerificationEnabled ? 'text-success' : 'text-textMuted'}`}>
                  {emailVerificationEnabled ? t('enabled') : t('disabled')}
                </span>
              </div>
              <Button 
                onClick={() => setShowEmailVerificationSettings(true)} 
                variant="secondary" 
                className="w-full"
              >
                {emailVerificationEnabled ? (language === 'zh' ? '管理邮箱验证' : 'Manage Email Verification') : (language === 'zh' ? '启用邮箱验证' : 'Enable Email Verification')}
              </Button>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="envelope" className="w-4 h-4 text-primary" />
              </div>
              {t('emailSettings')}
            </h2>
            <p className="text-sm text-textMuted mb-4">
              {language === 'zh' ? '配置邮件服务以支持密码重置功能' : 'Configure email service for password reset'}
            </p>
            <Button onClick={() => setShowSmtpSettings(true)} variant="secondary" className="w-full">
              {language === 'zh' ? '配置邮件服务' : 'Configure Email Service'}
            </Button>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="database" className="w-4 h-4 text-primary" />
              </div>
              {t('dataManagement')}
            </h2>
            <div className="space-y-3">
              <Button onClick={() => setShowCsvImport(true)} variant="secondary" className="w-full">
                {t('importFromCSV')}
              </Button>
              <p className="text-xs text-textMuted text-center">
                {language === 'zh' ? '支持 Chrome、Firefox 等浏览器导出的 CSV 格式' : 'Supports CSV format from Chrome, Firefox, etc.'}
              </p>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="upload" className="w-4 h-4 text-primary" />
              </div>
              {t('webdavBackup')}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-textMuted text-sm">{language === 'zh' ? 'WebDAV 状态' : 'WebDAV Status'}</span>
                <span className={`text-sm font-medium ${webdavUrl ? 'text-success' : 'text-textMuted'}`}>
                  {webdavUrl ? t('configured') : t('notConfigured')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-textMuted text-sm">{t('autoBackup')}</span>
                <span className={`text-sm font-medium ${webdavAutoBackup ? 'text-success' : 'text-textMuted'}`}>
                  {webdavAutoBackup ? t('enabled') : t('disabled')}
                </span>
              </div>
              <Button onClick={() => setShowWebDAVSettings(true)} variant="secondary" className="w-full">
                {language === 'zh' ? '配置 WebDAV' : 'Configure WebDAV'}
              </Button>
              <Button 
                onClick={handleBackup} 
                variant="secondary" 
                className="w-full"
                loading={backupLoading}
                disabled={!webdavUrl}
              >
                {t('backupNow')}
              </Button>
            </div>
          </div>

          <div className="bg-danger/5 border border-danger/20 rounded-xl p-6">
            <h2 className="text-base font-semibold text-danger mb-2 flex items-center gap-2">
              <Icon name="trash" className="w-5 h-5" />
              {t('dangerZone')}
            </h2>
            <p className="text-sm text-textMuted mb-4">
              {t('resetWarning')}
            </p>
            <Button variant="danger" onClick={() => setShowReset(true)}>
              {t('resetDatabase')}
            </Button>
          </div>
        </div>
      </div>

      <Modal isOpen={showSmtpSettings} onClose={() => setShowSmtpSettings(false)} title={language === 'zh' ? '邮件服务配置' : 'Email Service Configuration'} size="sm">
        <form onSubmit={handleEmailSettings} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-textMuted">{language === 'zh' ? '选择邮件服务' : 'Select Email Service'}</label>
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
                label={language === 'zh' ? 'SMTP 服务器' : 'SMTP Server'}
                placeholder="smtp.gmail.com"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
              />
              <Input
                type="number"
                label={language === 'zh' ? '端口' : 'Port'}
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
                <label htmlFor="smtpSecure" className="text-sm text-text">SSL/TLS</label>
              </div>
              <Input
                type="text"
                label={language === 'zh' ? '用户名' : 'Username'}
                placeholder={language === 'zh' ? '邮箱地址' : 'Email address'}
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
              />
              <Input
                type="password"
                label={t('password')}
                placeholder={language === 'zh' ? '邮箱密码或应用专用密码' : 'Password or app password'}
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
              />
              <Input
                type="email"
                label={language === 'zh' ? '发件人地址' : 'From Address'}
                placeholder="noreply@yourdomain.com"
                value={smtpFrom}
                onChange={(e) => setSmtpFrom(e.target.value)}
              />
            </>
          ) : (
            <>
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
                <p className="font-medium text-text mb-1">{language === 'zh' ? '如何获取 Resend API Key' : 'How to get Resend API Key'}</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-textMuted">
                  <li>{language === 'zh' ? '访问' : 'Visit'} <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com</a></li>
                  <li>{language === 'zh' ? '在 Dashboard 中创建 API Key' : 'Create API Key in Dashboard'}</li>
                  <li>{language === 'zh' ? '复制 API Key 粘贴到下方' : 'Copy and paste API Key below'}</li>
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
                label={language === 'zh' ? '发件人邮箱（可选）' : 'From Email (optional)'}
                placeholder="noreply@yourdomain.com"
                value={resendFrom}
                onChange={(e) => setResendFrom(e.target.value)}
              />
            </>
          )}

          {emailSettingsError && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {emailSettingsError}
            </div>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowSmtpSettings(false)} className="flex-1">
              {t('cancel')}
            </Button>
            <Button type="submit" className="flex-1" loading={emailSettingsLoading}>
              {t('saveConfig')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} title={t('changePassword')} size="sm">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            type="password"
            label={t('oldPassword')}
            placeholder={language === 'zh' ? '请输入原密码' : 'Enter old password'}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            label={t('newPassword')}
            placeholder={language === 'zh' ? '请输入新密码' : 'Enter new password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            label={t('confirmPassword')}
            placeholder={language === 'zh' ? '再次输入新密码' : 'Enter new password again'}
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
              {t('cancel')}
            </Button>
            <Button type="submit" className="flex-1" loading={passwordLoading}>
              {language === 'zh' ? '确认更改' : 'Confirm Change'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showCsvImport} onClose={() => setShowCsvImport(false)} title={t('importFromCSV')} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-textMuted">
            {language === 'zh' ? '选择一个 CSV 文件导入密码。支持的列名：name, url, username, password, notes' : 'Select a CSV file to import. Supported columns: name, url, username, password, notes'}
          </p>
          <label className="block">
            <div className="w-full bg-surface border border-border border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primaryLight transition-colors">
              <svg className="w-12 h-12 mx-auto text-textMuted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-textMuted">{language === 'zh' ? '点击选择 CSV 文件' : 'Click to select CSV file'}</span>
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
            {t('close')}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showReset} onClose={() => setShowReset(false)} title={language === 'zh' ? '确认重置数据库' : 'Confirm Reset'} size="sm">
        <div className="space-y-4">
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
            <p className="text-danger font-medium mb-2">{language === 'zh' ? '警告' : 'Warning'} ⚠️</p>
            <p className="text-sm text-textMuted">
              {t('resetWarning')}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowReset(false)} className="flex-1">
              {t('cancel')}
            </Button>
            <Button variant="danger" onClick={handleReset} loading={resetLoading} className="flex-1">
              {t('resetDatabase')}
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
        title={twoFactorEnabled ? (language === 'zh' ? '管理两步验证' : 'Manage 2FA') : (language === 'zh' ? '启用两步验证' : 'Enable 2FA')} 
        size="sm"
      >
        {twoFactorStep === 'setup' && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-text mb-2">
                {language === 'zh' 
                  ? '两步验证可以为您的账户添加额外的安全保护。启用后，登录时需要输入验证器应用生成的6位验证码。'
                  : '2FA adds extra security. After enabling, you need to enter a 6-digit code from an authenticator app when logging in.'}
              </p>
            </div>
            <div className="space-y-2 text-sm text-textMuted">
              <p>{language === 'zh' ? '推荐验证器应用：' : 'Recommended authenticator apps:'}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Google Authenticator</li>
                <li>Microsoft Authenticator</li>
                <li>Authy</li>
              </ul>
            </div>
            <Button onClick={handleEnable2FA} className="w-full">
              {language === 'zh' ? '开始设置' : 'Start Setup'}
            </Button>
          </div>
        )}

        {twoFactorStep === 'verify' && (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div className="p-4 bg-surface border border-border rounded-lg">
              <p className="text-sm text-textMuted mb-3">1. {language === 'zh' ? '使用验证器应用扫描下方二维码：' : 'Scan QR code with authenticator app:'}</p>
              <div className="flex justify-center mb-3">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactorQrUri)}`}
                  alt="2FA QR Code"
                  className="w-48 h-48 rounded-lg"
                />
              </div>
              <p className="text-xs text-textMuted text-center mb-3">{language === 'zh' ? '或手动输入密钥：' : 'Or enter key manually:'}</p>
              <code className="block p-2 bg-background rounded text-xs text-center break-all select-all">
                {twoFactorSecret}
              </code>
            </div>
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
              <p className="text-text">2. {language === 'zh' ? '输入验证器应用显示的6位验证码：' : 'Enter 6-digit code from app:'}</p>
            </div>
            <Input
              type="text"
              label={language === 'zh' ? '验证码' : 'Code'}
              placeholder={language === 'zh' ? '请输入6位验证码' : 'Enter 6-digit code'}
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
                {t('back')}
              </Button>
              <Button type="submit" className="flex-1" loading={twoFactorLoading}>
                {language === 'zh' ? '确认启用' : 'Confirm Enable'}
              </Button>
            </div>
          </form>
        )}

        {twoFactorStep === 'disable' && (
          <form onSubmit={handleDisable2FA} className="space-y-4">
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-text">
                {language === 'zh' 
                  ? '禁用两步验证将降低账户安全性。请输入当前验证器应用显示的验证码以确认禁用。'
                  : 'Disabling 2FA will reduce account security. Enter current code to confirm.'}
              </p>
            </div>
            <Input
              type="text"
              label={language === 'zh' ? '验证码' : 'Code'}
              placeholder={language === 'zh' ? '请输入6位验证码' : 'Enter 6-digit code'}
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
                {t('cancel')}
              </Button>
              <Button type="submit" variant="danger" className="flex-1" loading={twoFactorLoading}>
                {language === 'zh' ? '禁用两步验证' : 'Disable 2FA'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={showEmailSettings} onClose={() => setShowEmailSettings(false)} title={language === 'zh' ? '设置邮箱' : 'Set Email'} size="sm">
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
            <p className="text-text">{language === 'zh' ? '邮箱用于密码重置和邮箱验证登录功能' : 'Email is used for password reset and verification'}</p>
          </div>
          <Input
            type="email"
            label={t('email')}
            placeholder={language === 'zh' ? '请输入邮箱地址' : 'Enter email address'}
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
              {t('cancel')}
            </Button>
            <Button type="submit" className="flex-1" loading={emailVerificationLoading}>
              {t('save')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={showEmailVerificationSettings} 
        onClose={() => setShowEmailVerificationSettings(false)} 
        title={emailVerificationEnabled ? (language === 'zh' ? '管理邮箱验证登录' : 'Manage Email Verification') : (language === 'zh' ? '启用邮箱验证登录' : 'Enable Email Verification')} 
        size="sm"
      >
        <div className="space-y-4">
          {!emailVerificationEnabled ? (
            <>
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-text mb-2">
                  {language === 'zh' 
                    ? '启用邮箱验证登录后，每次登录时将向您的邮箱发送验证码，提供额外的安全保护。'
                    : 'After enabling, a verification code will be sent to your email on each login.'}
                </p>
                <p className="text-xs text-textMuted">
                  {language === 'zh' ? '注意：需要先设置邮箱地址并配置邮件服务' : 'Note: Email must be set and email service configured first'}
                </p>
              </div>
              {!user?.email && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm text-warning">
                  {language === 'zh' ? '请先在账户信息中设置邮箱地址' : 'Please set email address first'}
                </div>
              )}
              <Button 
                onClick={handleEnableEmailVerification} 
                className="w-full" 
                loading={emailVerificationLoading}
                disabled={!user?.email}
              >
                {language === 'zh' ? '启用邮箱验证登录' : 'Enable Email Verification'}
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-text">
                  {language === 'zh' 
                    ? '邮箱验证登录已启用。每次登录时，系统将向您的邮箱发送验证码。'
                    : 'Email verification is enabled. A code will be sent on each login.'}
                </p>
              </div>
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-textMuted">
                  {language === 'zh' ? '禁用后，登录时将不再需要邮箱验证码。' : 'After disabling, email code will not be required.'}
                </p>
              </div>
              <Button 
                variant="danger" 
                onClick={handleDisableEmailVerification} 
                className="w-full" 
                loading={emailVerificationLoading}
              >
                {language === 'zh' ? '禁用邮箱验证登录' : 'Disable Email Verification'}
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => setShowEmailVerificationSettings(false)} className="w-full">
            {t('close')}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showWebDAVSettings} onClose={() => setShowWebDAVSettings(false)} title={language === 'zh' ? 'WebDAV 配置' : 'WebDAV Configuration'} size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
            <p className="text-text">{language === 'zh' ? 'WebDAV 用于自动备份密码数据到云端存储服务' : 'WebDAV is used for automatic backup to cloud storage'}</p>
          </div>
          <Input
            type="url"
            label="WebDAV URL"
            placeholder="https://your-webdav-server.com/dav/"
            value={webdavUrl}
            onChange={(e) => setWebdavUrl(e.target.value)}
          />
          <Input
            type="text"
            label={t('username')}
            placeholder="WebDAV username"
            value={webdavUsername}
            onChange={(e) => setWebdavUsername(e.target.value)}
          />
          <Input
            type="password"
            label={t('password')}
            placeholder="WebDAV password"
            value={webdavPassword}
            onChange={(e) => setWebdavPassword(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="webdavAutoBackup"
              checked={webdavAutoBackup}
              onChange={(e) => setWebdavAutoBackup(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-surface text-primary"
            />
            <label htmlFor="webdavAutoBackup" className="text-sm text-text">
              {language === 'zh' ? '启用自动备份（每小时）' : 'Enable auto backup (hourly)'}
            </label>
          </div>
          {webdavError && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {webdavError}
            </div>
          )}
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleTestWebDAV} 
              className="flex-1"
              loading={webdavLoading}
            >
              {t('testConnection')}
            </Button>
            <Button 
              type="button"
              onClick={handleSaveWebDAV} 
              className="flex-1" 
              loading={webdavLoading}
            >
              {t('saveConfig')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
