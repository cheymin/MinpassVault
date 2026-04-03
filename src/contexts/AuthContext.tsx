'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import {
  generateSalt,
  deriveKey,
  generateMasterKey,
  encryptMasterKey,
  decryptMasterKey,
} from '@/lib/crypto'
import { verifyTOTP } from '@/lib/totp'

interface User {
  id: string
  username: string
  email?: string
  twoFactorEnabled: boolean
  emailVerificationEnabled: boolean
  siteTitle: string
  siteIcon: string
}

interface PendingUser extends User {
  masterKey: string
  twoFactorSecret: string | null
  emailVerificationEnabled: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  masterKey: string | null
  signUp: (username: string, password: string, email?: string) => Promise<{ error: string | null }>
  signIn: (username: string, password: string) => Promise<{ requires2FA: boolean; requiresEmailVerification: boolean; error: string | null }>
  verify2FA: (code: string) => Promise<{ error: string | null }>
  verifyEmailLogin: (code: string) => Promise<{ error: string | null }>
  sendLoginVerificationCode: () => Promise<{ error: string | null }>
  signOut: () => void
  unlockVault: (password: string) => Promise<{ error: string | null }>
  lockVault: () => void
  isVaultUnlocked: boolean
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ error: string | null }>
  updateSiteSettings: (title: string, icon: string) => Promise<{ error: string | null }>
  updateEmail: (email: string) => Promise<{ error: string | null }>
  enable2FA: (secret: string) => Promise<{ error: string | null }>
  disable2FA: () => Promise<{ error: string | null }>
  enableEmailVerification: () => Promise<{ error: string | null }>
  disableEmailVerification: () => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [masterKey, setMasterKey] = useState<string | null>(null)
  const [pendingUser, setPendingUser] = useState<PendingUser | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedMasterKey = localStorage.getItem('masterKey')
    const storedLoginTime = localStorage.getItem('loginTime')
    
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      
      const LOGIN_EXPIRY = 15 * 60 * 1000
      const isExpired = storedLoginTime && (Date.now() - parseInt(storedLoginTime)) > LOGIN_EXPIRY
      
      if (isExpired) {
        localStorage.removeItem('user')
        localStorage.removeItem('masterKey')
        localStorage.removeItem('loginTime')
        setUser(null)
        setMasterKey(null)
      } else {
        setUser(userData)
        if (storedMasterKey) {
          setMasterKey(storedMasterKey)
        }
      }
    }
    setLoading(false)
  }, [])

  const signUp = async (username: string, password: string, email?: string) => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (existingUser) {
        return { error: '用户名已存在' }
      }

      const salt = generateSalt()
      const derivedKey = deriveKey(password, salt)
      const masterKey = generateMasterKey()
      const encryptedMasterKey = encryptMasterKey(masterKey, derivedKey)

      const userId = uuidv4()
      const { error } = await supabase.from('users').insert({
        id: userId,
        username,
        email: email || null,
        encrypted_master_key: encryptedMasterKey,
        salt,
        two_factor_enabled: false,
        two_factor_secret: null,
        site_title: 'SecureVault密码管理器',
        site_icon: 'https://djkl.qzz.io/file/1.webp',
      })

      if (error) {
        return { error: error.message }
      }

      const newUser = {
        id: userId,
        username,
        email,
        twoFactorEnabled: false,
        emailVerificationEnabled: false,
        siteTitle: 'SecureVault密码管理器',
        siteIcon: 'https://djkl.qzz.io/file/1.webp',
      }
      setUser(newUser)
      setMasterKey(masterKey)
      localStorage.setItem('user', JSON.stringify(newUser))
      localStorage.setItem('masterKey', masterKey)

      return { error: null }
    } catch (err) {
      return { error: '注册过程中发生错误' }
    }
  }

  const signIn = async (username: string, password: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (error || !userData) {
        return { requires2FA: false, requiresEmailVerification: false, error: '用户名或密码错误' }
      }

      const derivedKey = deriveKey(password, userData.salt)
      
      try {
        const decryptedMasterKey = decryptMasterKey(userData.encrypted_master_key, derivedKey)
        
        const pendingUserData = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          twoFactorEnabled: userData.two_factor_enabled,
          emailVerificationEnabled: userData.email_verification_enabled || false,
          masterKey: decryptedMasterKey,
          twoFactorSecret: userData.two_factor_secret,
          siteTitle: userData.site_title,
          siteIcon: userData.site_icon,
        }

        if (userData.two_factor_enabled) {
          setPendingUser(pendingUserData)
          return { requires2FA: true, requiresEmailVerification: false, error: null }
        }

        if (userData.email_verification_enabled) {
          setPendingUser(pendingUserData)
          return { requires2FA: false, requiresEmailVerification: true, error: null }
        }

        const newUser = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          twoFactorEnabled: false,
          emailVerificationEnabled: false,
          siteTitle: userData.site_title,
          siteIcon: userData.site_icon,
        }
        setUser(newUser)
        setMasterKey(decryptedMasterKey)
        localStorage.setItem('user', JSON.stringify(newUser))
        localStorage.setItem('masterKey', decryptedMasterKey)
        localStorage.setItem('loginTime', Date.now().toString())

        return { requires2FA: false, requiresEmailVerification: false, error: null }
      } catch {
        return { requires2FA: false, requiresEmailVerification: false, error: '用户名或密码错误' }
      }
    } catch (err) {
      return { requires2FA: false, requiresEmailVerification: false, error: '登录过程中发生错误' }
    }
  }

  const verify2FA = async (code: string) => {
    if (!pendingUser || !pendingUser.twoFactorSecret) {
      return { error: '无待验证的2FA' }
    }

    const isValid = verifyTOTP(pendingUser.twoFactorSecret, code)
    if (!isValid) {
      return { error: '验证码无效' }
    }

    const newUser = {
      id: pendingUser.id,
      username: pendingUser.username,
      email: pendingUser.email,
      twoFactorEnabled: pendingUser.twoFactorEnabled,
      emailVerificationEnabled: pendingUser.emailVerificationEnabled,
      siteTitle: pendingUser.siteTitle,
      siteIcon: pendingUser.siteIcon,
    }
    setUser(newUser)
    setMasterKey(pendingUser.masterKey)
    localStorage.setItem('user', JSON.stringify(newUser))
    localStorage.setItem('masterKey', pendingUser.masterKey)
    localStorage.setItem('loginTime', Date.now().toString())
    setPendingUser(null)

    return { error: null }
  }

  const sendLoginVerificationCode = async () => {
    if (!pendingUser || !pendingUser.email) {
      return { error: '无待验证的用户或邮箱未设置' }
    }

    try {
      const response = await fetch('/api/email/login-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pendingUser.id }),
      })

      const data = await response.json()
      if (!response.ok) {
        return { error: data.error || '发送验证码失败' }
      }

      return { error: null }
    } catch (err) {
      return { error: '发送验证码失败' }
    }
  }

  const verifyEmailLogin = async (code: string) => {
    if (!pendingUser) {
      return { error: '无待验证的用户' }
    }

    try {
      const response = await fetch('/api/email/login-verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pendingUser.id, code }),
      })

      const data = await response.json()
      if (!response.ok) {
        return { error: data.error || '验证失败' }
      }

      const newUser = {
        id: pendingUser.id,
        username: pendingUser.username,
        email: pendingUser.email,
        twoFactorEnabled: pendingUser.twoFactorEnabled,
        emailVerificationEnabled: pendingUser.emailVerificationEnabled,
        siteTitle: pendingUser.siteTitle,
        siteIcon: pendingUser.siteIcon,
      }
      setUser(newUser)
      setMasterKey(pendingUser.masterKey)
      localStorage.setItem('user', JSON.stringify(newUser))
      localStorage.setItem('masterKey', pendingUser.masterKey)
      localStorage.setItem('loginTime', Date.now().toString())
      setPendingUser(null)

      return { error: null }
    } catch (err) {
      return { error: '验证失败' }
    }
  }

  const signOut = () => {
    setUser(null)
    setMasterKey(null)
    localStorage.removeItem('user')
    localStorage.removeItem('masterKey')
    localStorage.removeItem('loginTime')
  }

  const unlockVault = async (password: string) => {
    if (!user) {
      return { error: '未登录' }
    }

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('salt, encrypted_master_key')
        .eq('id', user.id)
        .single()

      if (error || !userData) {
        return { error: '解锁保险库失败' }
      }

      const derivedKey = deriveKey(password, userData.salt)
      const decryptedMasterKey = decryptMasterKey(userData.encrypted_master_key, derivedKey)
      
      setMasterKey(decryptedMasterKey)
      localStorage.setItem('masterKey', decryptedMasterKey)

      return { error: null }
    } catch {
      return { error: '密码错误' }
    }
  }

  const lockVault = () => {
    setMasterKey(null)
    localStorage.removeItem('masterKey')
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!user) {
      return { error: '未登录' }
    }

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !userData) {
        return { error: '获取用户数据失败' }
      }

      const oldDerivedKey = deriveKey(oldPassword, userData.salt)
      
      let decryptedMasterKey: string
      try {
        decryptedMasterKey = decryptMasterKey(userData.encrypted_master_key, oldDerivedKey)
      } catch {
        return { error: '原密码错误' }
      }

      const newSalt = generateSalt()
      const newDerivedKey = deriveKey(newPassword, newSalt)
      const newEncryptedMasterKey = encryptMasterKey(decryptedMasterKey, newDerivedKey)

      const { error: updateError } = await supabase
        .from('users')
        .update({
          encrypted_master_key: newEncryptedMasterKey,
          salt: newSalt,
        })
        .eq('id', user.id)

      if (updateError) {
        return { error: updateError.message }
      }

      setMasterKey(decryptedMasterKey)
      localStorage.setItem('masterKey', decryptedMasterKey)

      return { error: null }
    } catch (err) {
      return { error: '更改密码失败' }
    }
  }

  const updateSiteSettings = async (title: string, icon: string) => {
    if (!user) {
      return { error: '未登录' }
    }

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          site_title: title,
          site_icon: icon,
        })
        .eq('id', user.id)

      if (updateError) {
        return { error: updateError.message }
      }

      const updatedUser = { ...user, siteTitle: title, siteIcon: icon }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))

      return { error: null }
    } catch (err) {
      return { error: '更新设置失败' }
    }
  }

  const enable2FA = async (secret: string) => {
    if (!user) {
      return { error: '未登录' }
    }

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          two_factor_enabled: true,
          two_factor_secret: secret,
        })
        .eq('id', user.id)

      if (updateError) {
        return { error: updateError.message }
      }

      const updatedUser = { ...user, twoFactorEnabled: true }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))

      return { error: null }
    } catch (err) {
      return { error: '启用两步验证失败' }
    }
  }

  const disable2FA = async () => {
    if (!user) {
      return { error: '未登录' }
    }

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
        })
        .eq('id', user.id)

      if (updateError) {
        return { error: updateError.message }
      }

      const updatedUser = { ...user, twoFactorEnabled: false }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))

      return { error: null }
    } catch (err) {
      return { error: '禁用两步验证失败' }
    }
  }

  const updateEmail = async (email: string) => {
    if (!user) {
      return { error: '未登录' }
    }

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email: email || null,
        })
        .eq('id', user.id)

      if (updateError) {
        return { error: updateError.message }
      }

      const updatedUser = { ...user, email: email || undefined }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))

      return { error: null }
    } catch (err) {
      return { error: '更新邮箱失败' }
    }
  }

  const enableEmailVerification = async () => {
    if (!user) {
      return { error: '未登录' }
    }

    try {
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single()

      if (fetchError || !userData?.email) {
        return { error: '请先设置邮箱地址' }
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          email_verification_enabled: true,
        })
        .eq('id', user.id)

      if (updateError) {
        return { error: updateError.message }
      }

      const updatedUser = { ...user, emailVerificationEnabled: true }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))

      return { error: null }
    } catch (err) {
      return { error: '启用邮箱验证失败' }
    }
  }

  const disableEmailVerification = async () => {
    if (!user) {
      return { error: '未登录' }
    }

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email_verification_enabled: false,
          login_verification_code: null,
          login_verification_expires_at: null,
        })
        .eq('id', user.id)

      if (updateError) {
        return { error: updateError.message }
      }

      const updatedUser = { ...user, emailVerificationEnabled: false }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))

      return { error: null }
    } catch (err) {
      return { error: '禁用邮箱验证失败' }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        masterKey,
        signUp,
        signIn,
        verify2FA,
        verifyEmailLogin,
        sendLoginVerificationCode,
        signOut,
        unlockVault,
        lockVault,
        isVaultUnlocked: !!masterKey,
        changePassword,
        updateSiteSettings,
        updateEmail,
        enable2FA,
        disable2FA,
        enableEmailVerification,
        disableEmailVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
