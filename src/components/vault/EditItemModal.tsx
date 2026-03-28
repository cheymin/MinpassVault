'use client'

import { useState, useEffect } from 'react'
import { useVault, VaultItemType, LoginData, SecureNoteData, CardData, IdentityData, VaultItem } from '@/contexts/VaultContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { generateRandomPassword, calculatePasswordStrength } from '@/lib/crypto'

interface EditItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: VaultItem | null
}

export function EditItemModal({ isOpen, onClose, item }: EditItemModalProps) {
  const { updateItem, folders } = useVault()
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

  useEffect(() => {
    if (item) {
      setType(item.type)
      setName(item.name)
      setFolderId(item.folderId)
      
      switch (item.type) {
        case 'login':
          setLoginData(item.data as LoginData)
          break
        case 'secure_note':
          setNoteData(item.data as SecureNoteData)
          break
        case 'card':
          setCardData(item.data as CardData)
          break
        case 'identity':
          setIdentityData(item.data as IdentityData)
          break
      }
    }
  }, [item])

  const handleGeneratePassword = () => {
    const password = generateRandomPassword(16, {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    })
    setLoginData({ ...loginData, password })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!item) return
    
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

    const result = await updateItem(item.id, {
      name,
      data,
      folderId,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      showToast('项目更新成功', 'success')
      onClose()
    }
  }

  const typeOptions = [
    { value: 'login', label: '登录凭证', icon: 'key' },
    { value: 'secure_note', label: '安全笔记', icon: 'file-lines' },
    { value: 'card', label: '银行卡', icon: 'credit-card' },
    { value: 'identity', label: '身份信息', icon: 'id-card' },
  ]

  if (!item) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="编辑项目" size="lg">
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
                <Icon name={option.icon as any} className="w-5 h-5 mb-1 mx-auto" />
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
                    <Icon name={showPassword ? 'eye-slash' : 'eye'} className="w-5 h-5" />
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
            保存更改
          </Button>
        </div>
      </form>
    </Modal>
  )
}
