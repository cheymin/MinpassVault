'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Language = 'zh' | 'en'

interface Translations {
  [key: string]: {
    zh: string
    en: string
  }
}

const translations: Translations = {
  appName: { zh: 'MinpassVault', en: 'MinpassVault' },
  tagline: { zh: '安全可靠的密码管理器', en: 'Secure Password Manager' },
  
  login: { zh: '登录', en: 'Login' },
  logout: { zh: '退出', en: 'Logout' },
  username: { zh: '用户名', en: 'Username' },
  password: { zh: '密码', en: 'Password' },
  confirmPassword: { zh: '确认密码', en: 'Confirm Password' },
  oldPassword: { zh: '原密码', en: 'Old Password' },
  newPassword: { zh: '新密码', en: 'New Password' },
  email: { zh: '邮箱', en: 'Email' },
  
  vault: { zh: '保险库', en: 'Vault' },
  dashboard: { zh: '仪表盘', en: 'Dashboard' },
  auditLogs: { zh: '审计日志', en: 'Audit Logs' },
  settings: { zh: '设置', en: 'Settings' },
  
  addItem: { zh: '添加项目', en: 'Add Item' },
  editItem: { zh: '编辑项目', en: 'Edit Item' },
  deleteItem: { zh: '删除项目', en: 'Delete Item' },
  itemName: { zh: '名称', en: 'Name' },
  url: { zh: '网址', en: 'URL' },
  notes: { zh: '备注', en: 'Notes' },
  favorite: { zh: '收藏', en: 'Favorite' },
  
  loginCredential: { zh: '登录凭证', en: 'Login' },
  secureNote: { zh: '安全笔记', en: 'Secure Note' },
  card: { zh: '银行卡', en: 'Card' },
  identity: { zh: '身份信息', en: 'Identity' },
  
  allItems: { zh: '全部', en: 'All' },
  folders: { zh: '文件夹', en: 'Folders' },
  newFolder: { zh: '新建文件夹', en: 'New Folder' },
  
  search: { zh: '搜索保险库...', en: 'Search vault...' },
  noItems: { zh: '未找到项目', en: 'No items found' },
  addFirst: { zh: '添加您的第一个项目开始使用', en: 'Add your first item to get started' },
  
  passwordGenerator: { zh: '密码生成器', en: 'Password Generator' },
  generatePassword: { zh: '生成密码', en: 'Generate Password' },
  copy: { zh: '复制', en: 'Copy' },
  copied: { zh: '已复制', en: 'Copied' },
  
  importExport: { zh: '导入/导出', en: 'Import/Export' },
  import: { zh: '导入', en: 'Import' },
  export: { zh: '导出', en: 'Export' },
  importFromCSV: { zh: '从 CSV 导入', en: 'Import from CSV' },
  exportToJSON: { zh: '导出为 JSON', en: 'Export to JSON' },
  
  securitySettings: { zh: '安全设置', en: 'Security Settings' },
  changePassword: { zh: '更改主密码', en: 'Change Master Password' },
  twoFactorAuth: { zh: '两步验证', en: 'Two-Factor Auth' },
  enabled: { zh: '已启用', en: 'Enabled' },
  disabled: { zh: '未启用', en: 'Disabled' },
  enable: { zh: '启用', en: 'Enable' },
  disable: { zh: '禁用', en: 'Disable' },
  
  emailSettings: { zh: '邮件设置', en: 'Email Settings' },
  emailVerification: { zh: '邮箱验证登录', en: 'Email Verification Login' },
  
  webdavBackup: { zh: 'WebDAV 备份', en: 'WebDAV Backup' },
  configured: { zh: '已配置', en: 'Configured' },
  notConfigured: { zh: '未配置', en: 'Not Configured' },
  autoBackup: { zh: '自动备份', en: 'Auto Backup' },
  backupNow: { zh: '立即备份', en: 'Backup Now' },
  testConnection: { zh: '测试连接', en: 'Test Connection' },
  saveConfig: { zh: '保存配置', en: 'Save Config' },
  
  dangerZone: { zh: '危险区域', en: 'Danger Zone' },
  resetDatabase: { zh: '重置数据库', en: 'Reset Database' },
  resetWarning: { zh: '此操作将永久删除所有数据，不可恢复！', en: 'This will permanently delete all data!' },
  
  totalPasswords: { zh: '总密码数', en: 'Total Passwords' },
  loginItems: { zh: '登录项', en: 'Login Items' },
  favorites: { zh: '收藏项', en: 'Favorites' },
  addedThisWeek: { zh: '本周新增', en: 'Added This Week' },
  
  passwordStrength: { zh: '密码强度分析', en: 'Password Strength' },
  securityScore: { zh: '安全评分', en: 'Security Score' },
  weak: { zh: '弱密码', en: 'Weak' },
  medium: { zh: '中等密码', en: 'Medium' },
  strong: { zh: '强密码', en: 'Strong' },
  veryStrong: { zh: '非常强密码', en: 'Very Strong' },
  securityWarning: { zh: '安全警告', en: 'Security Warning' },
  weakPasswordWarning: { zh: '您有 {count} 个弱密码，建议尽快修改', en: 'You have {count} weak passwords, please update them' },
  
  recentActivity: { zh: '最近活动', en: 'Recent Activity' },
  viewAllLogs: { zh: '查看全部日志', en: 'View All Logs' },
  noActivity: { zh: '暂无活动记录', en: 'No recent activity' },
  
  strengthDistribution: { zh: '密码强度分布', en: 'Strength Distribution' },
  
  action_login: { zh: '登录', en: 'Login' },
  action_logout: { zh: '登出', en: 'Logout' },
  action_login_failed: { zh: '登录失败', en: 'Login Failed' },
  action_password_change: { zh: '修改密码', en: 'Password Changed' },
  action_2fa_enable: { zh: '启用两步验证', en: '2FA Enabled' },
  action_2fa_disable: { zh: '禁用两步验证', en: '2FA Disabled' },
  action_item_create: { zh: '创建密码项', en: 'Item Created' },
  action_item_update: { zh: '更新密码项', en: 'Item Updated' },
  action_item_delete: { zh: '删除密码项', en: 'Item Deleted' },
  
  justNow: { zh: '刚刚', en: 'Just now' },
  minutesAgo: { zh: '{count} 分钟前', en: '{count} minutes ago' },
  hoursAgo: { zh: '{count} 小时前', en: '{count} hours ago' },
  daysAgo: { zh: '{count} 天前', en: '{count} days ago' },
  
  cancel: { zh: '取消', en: 'Cancel' },
  save: { zh: '保存', en: 'Save' },
  confirm: { zh: '确认', en: 'Confirm' },
  close: { zh: '关闭', en: 'Close' },
  back: { zh: '返回', en: 'Back' },
  
  loading: { zh: '加载中...', en: 'Loading...' },
  noData: { zh: '暂无数据', en: 'No data' },
  
  theme: { zh: '主题', en: 'Theme' },
  darkMode: { zh: '暗色模式', en: 'Dark Mode' },
  lightMode: { zh: '亮色模式', en: 'Light Mode' },
  
  language: { zh: '语言', en: 'Language' },
  chinese: { zh: '中文', en: 'Chinese' },
  english: { zh: '英文', en: 'English' },
  
  font: { zh: '字体', en: 'Font' },
  defaultFont: { zh: '默认字体', en: 'Default' },
  
  breachCheck: { zh: '数据泄露检测', en: 'Breach Check' },
  breachCheckDesc: { zh: '检查您的密码是否在已知数据泄露中出现过', en: 'Check if your passwords have appeared in known data breaches' },
  checkBreaches: { zh: '检测泄露', en: 'Check Breaches' },
  breachFound: { zh: '发现泄露', en: 'Breach Found' },
  noBreach: { zh: '未发现泄露', en: 'No Breach Found' },
  compromisedPassword: { zh: '此密码已在数据泄露中出现，请立即修改！', en: 'This password has appeared in a data breach, please change it immediately!' },
  safePassword: { zh: '此密码安全，未在已知泄露中发现', en: 'This password is safe, not found in known breaches' },
  
  extension: { zh: '浏览器扩展', en: 'Browser Extension' },
  installExtension: { zh: '安装扩展', en: 'Install Extension' },
  extensionDesc: { zh: '安装浏览器扩展以实现自动填充和密码记录', en: 'Install browser extension for auto-fill and password saving' },
  
  lock: { zh: '锁定', en: 'Lock' },
  unlock: { zh: '解锁', en: 'Unlock' },
  vaultLocked: { zh: '保险库已锁定', en: 'Vault Locked' },
  enterMasterPassword: { zh: '请输入主密码解锁保险库', en: 'Enter master password to unlock vault' },
  
  copyright: { zh: '版权所有', en: 'Copyright' },
  
  appearance: { zh: '外观设置', en: 'Appearance' },
  accountInfo: { zh: '账户信息', en: 'Account Info' },
  dataManagement: { zh: '数据管理', en: 'Data Management' },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedLang = localStorage.getItem('language') as Language | null
    if (savedLang) {
      setLanguageState(savedLang)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('language', language)
  }, [language, mounted])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[key]
    if (!translation) return key
    
    let text = translation[language]
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v))
      })
    }
    return text
  }

  if (!mounted) {
    return null
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
