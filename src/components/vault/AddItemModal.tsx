'use client'

import { useState } from 'react'
import { useVault, VaultItemType, LoginData, SecureNoteData, CardData, IdentityData } from '@/contexts/VaultContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { generateRandomPassword, calculatePasswordStrength } from '@/lib/crypto'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  const { addItem, folders } = useVault()
  const { showToast } = useToast()
  const [type, setType] = useState<VaultItemType>('login')
  const [name, setName] = useState('')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [loginData, setLoginData] = useState<LoginData>({
    username: '',
    password: '',
    url: '',
    notes: '',
  })
  
  const [noteData, setNoteData] = useState<SecureNoteData>({
    content: '',
  })
  
  const [cardData, setCardData] = useState<CardData>({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    notes: '',
  })
  
  const [identityData, setIdentityData] = useState<IdentityData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  })

  const [passwordOptions, setPasswordOptions] = useState({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })

  const handleGeneratePassword = () => {
    const password = generateRandomPassword(passwordOptions.length, passwordOptions)
    setLoginData({ ...loginData, password })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!name.trim()) {
      setError('请输入项目名称')
      return
    }

    setLoading(true)

    let data: LoginData | SecureNoteData | CardData | IdentityData
    switch (type) {
      case 'login':
        data = loginData
        break
      case 'secure_note':
        data = noteData
        break
      case 'card':
        data = cardData
        break
      case 'identity':
        data = identityData
        break
      default:
        setLoading(false)
        setError('无效的项目类型')
        return
    }

    const result = await addItem({
      type,
      name,
      data,
      folderId,
      favorite: false,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      showToast('项目添加成功', 'success')
      onClose()
      resetForm()
    }
  }

  const resetForm = () => {
    setType('login')
    setName('')
    setFolderId(null)
    setLoginData({ username: '', password: '', url: '', notes: '' })
    setNoteData({ content: '' })
    setCardData({ cardholderName: '', cardNumber: '', expiryDate: '', cvv: '', notes: '' })
    setIdentityData({ fullName: '', email: '', phone: '', address: '', notes: '' })
  }

  const typeOptions = [
    { value: 'login', label: '登录凭证', icon: '🔑' },
    { value: 'secure_note', label: '安全笔记', icon: '📝' },
    { value: 'card', label: '银行卡', icon: '💳' },
    { value: 'identity', label: '身份信息', icon: '👤' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="添加新项目" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">类型</label>
          <div className="grid grid-cols-4 gap-2">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value as VaultItemType)}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  type === option.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primaryLight text-textMuted'
                }`}
              >
                <span className="text-xl">{option.icon}</span>
                <span className="block text-xs mt-1">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="名称"
          placeholder="项目名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
            {error}
          </div>
        )}

        {folders.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1.5">文件夹</label>
            <select
              value={folderId || ''}
              onChange={(e) => setFolderId(e.target.value || null)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text"
            >
              <option value="">无文件夹</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {type === 'login' && (
          <>
            <Input
              label="用户名"
              placeholder="用户名或邮箱"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1.5">密码</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="密码"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-text"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <Button type="button" variant="secondary" onClick={handleGeneratePassword}>
                  生成
                </Button>
              </div>
              {loginData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          calculatePasswordStrength(loginData.password).score <= 2
                            ? 'bg-danger'
                            : calculatePasswordStrength(loginData.password).score <= 4
                            ? 'bg-warning'
                            : calculatePasswordStrength(loginData.password).score <= 5
                            ? 'bg-primaryLight'
                            : 'bg-success'
                        }`}
                        style={{ width: `${(calculatePasswordStrength(loginData.password).score / 7) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs ${calculatePasswordStrength(loginData.password).color}`}>
                      {calculatePasswordStrength(loginData.password).label}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <Input
              label="网址"
              placeholder="https://example.com"
              value={loginData.url}
              onChange={(e) => setLoginData({ ...loginData, url: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1.5">备注</label>
              <textarea
                placeholder="其他备注"
                value={loginData.notes}
                onChange={(e) => setLoginData({ ...loginData, notes: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text min-h-[80px] resize-none"
              />
            </div>
          </>
        )}

        {type === 'secure_note' && (
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1.5">内容</label>
            <textarea
              placeholder="在此输入安全笔记..."
              value={noteData.content}
              onChange={(e) => setNoteData({ ...noteData, content: e.target.value })}
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text min-h-[200px] resize-none"
              required
            />
          </div>
        )}

        {type === 'card' && (
          <>
            <Input
              label="持卡人姓名"
              placeholder="张三"
              value={cardData.cardholderName}
              onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value })}
            />
            <Input
              label="卡号"
              placeholder="1234 5678 9012 3456"
              value={cardData.cardNumber}
              onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="有效期"
                placeholder="MM/YY"
                value={cardData.expiryDate}
                onChange={(e) => setCardData({ ...cardData, expiryDate: e.target.value })}
              />
              <Input
                label="安全码"
                placeholder="123"
                type="password"
                value={cardData.cvv}
                onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1.5">备注</label>
              <textarea
                placeholder="其他备注"
                value={cardData.notes}
                onChange={(e) => setCardData({ ...cardData, notes: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text min-h-[80px] resize-none"
              />
            </div>
          </>
        )}

        {type === 'identity' && (
          <>
            <Input
              label="姓名"
              placeholder="张三"
              value={identityData.fullName}
              onChange={(e) => setIdentityData({ ...identityData, fullName: e.target.value })}
            />
            <Input
              label="邮箱"
              type="email"
              placeholder="zhangsan@example.com"
              value={identityData.email}
              onChange={(e) => setIdentityData({ ...identityData, email: e.target.value })}
            />
            <Input
              label="电话"
              placeholder="+86 138 0000 0000"
              value={identityData.phone}
              onChange={(e) => setIdentityData({ ...identityData, phone: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1.5">地址</label>
              <textarea
                placeholder="详细地址"
                value={identityData.address}
                onChange={(e) => setIdentityData({ ...identityData, address: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text min-h-[80px] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1.5">备注</label>
              <textarea
                placeholder="其他备注"
                value={identityData.notes}
                onChange={(e) => setIdentityData({ ...identityData, notes: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text min-h-[80px] resize-none"
              />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            取消
          </Button>
          <Button type="submit" className="flex-1" loading={loading}>
            添加项目
          </Button>
        </div>
      </form>
    </Modal>
  )
}
