'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import CryptoJS from 'crypto-js'

if (typeof window !== 'undefined') {
  (window as any).CryptoJS = CryptoJS
}

export function DynamicHead() {
  const { user } = useAuth()

  useEffect(() => {
    const title = user?.siteTitle || 'SecureVault密码管理器'
    const icon = user?.siteIcon || 'https://djkl.qzz.io/file/1.webp'
    
    document.title = title
    
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = icon
  }, [user?.siteTitle, user?.siteIcon])

  return null
}
