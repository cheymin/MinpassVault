'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useVault } from '@/contexts/VaultContext'
import { useToast } from '@/contexts/ToastContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { checkMultiplePasswords, BreachCheckResult } from '@/lib/breachCheck'

interface BreachItem {
  id: string
  name: string
  result: BreachCheckResult
}

export default function BreachCheckPage() {
  const { user } = useAuth()
  const { items } = useVault()
  const { showToast } = useToast()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()

  const [checking, setChecking] = useState(false)
  const [results, setResults] = useState<BreachItem[]>([])
  const [progress, setProgress] = useState(0)

  const handleCheck = async () => {
    if (!items || items.length === 0) {
      showToast(language === 'zh' ? '没有密码项目可以检测' : 'No passwords to check', 'error')
      return
    }

    setChecking(true)
    setProgress(0)
    setResults([])

    const loginItems = items.filter(item => item.type === 'login' && item.data?.password)
    const passwords = loginItems.map(item => ({
      id: item.id,
      name: item.name,
      password: item.data.password,
    }))

    const checkedResults: BreachItem[] = []
    
    for (let i = 0; i < passwords.length; i++) {
      const item = passwords[i]
      
      try {
        const response = await fetch('/api/breach-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: item.password }),
        })
        const result = await response.json()
        
        checkedResults.push({
          id: item.id,
          name: item.name,
          result,
        })
      } catch (error) {
        checkedResults.push({
          id: item.id,
          name: item.name,
          result: { compromised: false, error: 'Check failed' },
        })
      }
      
      setResults([...checkedResults])
      setProgress(Math.round(((i + 1) / passwords.length) * 100))
      
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    setChecking(false)
    
    const compromised = checkedResults.filter(r => r.result.compromised).length
    if (compromised > 0) {
      showToast(language === 'zh' ? `发现 ${compromised} 个泄露密码！` : `Found ${compromised} compromised passwords!`, 'error')
    } else {
      showToast(language === 'zh' ? '所有密码安全' : 'All passwords are safe', 'success')
    }
  }

  const compromisedCount = results.filter(r => r.result.compromised).length
  const safeCount = results.filter(r => !r.result.compromised && !r.result.error).length

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
              <Button variant="ghost" size="sm" onClick={() => router.push('/settings')} className="text-textMuted hover:text-text">
                <Icon name="cog" className="w-4 h-4 mr-1.5" />
                {t('settings')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text mb-1">{t('breachCheck')}</h1>
          <p className="text-textMuted">{t('breachCheckDesc')}</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Icon name="shield-alt" className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">{language === 'zh' ? 'Have I Been Pwned' : 'Have I Been Pwned'}</h2>
              <p className="text-sm text-textMuted">
                {language === 'zh' 
                  ? '使用 k-匿名算法安全检测，不会发送完整密码' 
                  : 'Uses k-anonymity for secure checking, never sends full password'}
              </p>
            </div>
          </div>

          <Button 
            onClick={handleCheck} 
            className="w-full" 
            loading={checking}
            disabled={!items || items.length === 0}
          >
            {checking ? (language === 'zh' ? `检测中... ${progress}%` : `Checking... ${progress}%`) : t('checkBreaches')}
          </Button>

          {checking && (
            <div className="mt-4">
              <div className="h-2 bg-surfaceHover rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-danger/10 border border-danger/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-danger/20 rounded-lg flex items-center justify-center">
                    <Icon name="exclamation-triangle" className="w-5 h-5 text-danger" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-danger">{compromisedCount}</p>
                    <p className="text-sm text-textMuted">{t('breachFound')}</p>
                  </div>
                </div>
              </div>
              <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                    <Icon name="check-circle" className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">{safeCount}</p>
                    <p className="text-sm text-textMuted">{t('noBreach')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-text">{language === 'zh' ? '检测结果' : 'Check Results'}</h3>
              </div>
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {results.map(item => (
                  <div key={item.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        item.result.compromised ? 'bg-danger/20' : 'bg-success/20'
                      }`}>
                        <Icon 
                          name={item.result.compromised ? 'exclamation-circle' : 'check'} 
                          className={`w-4 h-4 ${item.result.compromised ? 'text-danger' : 'text-success'}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-text">{item.name}</p>
                        {item.result.compromised && item.result.count && (
                          <p className="text-xs text-danger">
                            {language === 'zh' 
                              ? `在 ${item.result.count.toLocaleString()} 次数据泄露中出现`
                              : `Found in ${item.result.count.toLocaleString()} data breaches`}
                          </p>
                        )}
                        {item.result.error && (
                          <p className="text-xs text-textMuted">{item.result.error}</p>
                        )}
                      </div>
                    </div>
                    {item.result.compromised && (
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => router.push('/vault')}
                      >
                        {language === 'zh' ? '修改' : 'Change'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {results.length === 0 && !checking && (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="search" className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-text mb-2">
              {language === 'zh' ? '开始检测您的密码' : 'Start Checking Your Passwords'}
            </h3>
            <p className="text-sm text-textMuted mb-4">
              {language === 'zh' 
                ? '点击上方按钮检测您的密码是否在已知数据泄露中出现过'
                : 'Click the button above to check if your passwords have appeared in known data breaches'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
