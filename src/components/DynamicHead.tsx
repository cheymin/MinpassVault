'use client'

import { useEffect } from 'react'
import CryptoJS from 'crypto-js'

if (typeof window !== 'undefined') {
  (window as any).CryptoJS = CryptoJS
}

export function DynamicHead() {
  useEffect(() => {
    document.title = 'MinpassVault'
    
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = '/icon.png'
  }, [])

  return null
}
