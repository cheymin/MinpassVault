'use client'

import { useState } from 'react'
import { VaultItem, useVault } from '@/contexts/VaultContext'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EditItemModal } from './EditItemModal'

interface VaultItemCardProps {
  item: VaultItem
}

export function VaultItemCard({ item }: VaultItemCardProps) {
  const { updateItem, deleteItem } = useVault()
  const [showDetails, setShowDetails] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const typeIcons: Record<string, string> = {
    login: '🔑',
    secure_note: '📝',
    card: '💳',
    identity: '👤',
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = async () => {
    if (confirm('确定要删除此项目吗？')) {
      await deleteItem(item.id)
      setShowDetails(false)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await updateItem(item.id, { favorite: !item.favorite })
  }

  const handleEdit = () => {
    setShowEditModal(true)
  }

  return (
    <>
      <div
        className="bg-surface border border-border rounded-lg p-4 hover:border-primaryLight transition-colors cursor-pointer group"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{typeIcons[item.type]}</span>
            <div>
              <h3 className="font-medium text-text">{item.name}</h3>
              {item.type === 'login' && (
                <p className="text-sm text-textMuted">{(item.data as { username: string }).username}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleToggleFavorite}
            className={`text-xl transition-colors ${
              item.favorite ? 'text-warning' : 'text-textMuted opacity-0 group-hover:opacity-100'
            }`}
          >
            {item.favorite ? '★' : '☆'}
          </button>
        </div>
      </div>

      <Modal isOpen={showDetails} onClose={() => setShowDetails(false)} title={item.name} size="lg">
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              编辑
            </Button>
          </div>

          {item.type === 'login' && (
            <LoginItemDetails
              item={item}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              copied={copied}
              copyToClipboard={copyToClipboard}
            />
          )}
          
          {item.type === 'secure_note' && (
            <div className="bg-background border border-border rounded-lg p-4">
              <p className="text-text whitespace-pre-wrap">{(item.data as { content: string }).content}</p>
            </div>
          )}
          
          {item.type === 'card' && (
            <CardItemDetails 
              item={item} 
              showPassword={showPassword} 
              setShowPassword={setShowPassword}
              copied={copied} 
              copyToClipboard={copyToClipboard} 
            />
          )}
          
          {item.type === 'identity' && (
            <IdentityItemDetails item={item} copied={copied} copyToClipboard={copyToClipboard} />
          )}

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="danger" onClick={handleDelete} className="flex-1">
              删除
            </Button>
            <Button variant="secondary" onClick={() => setShowDetails(false)} className="flex-1">
              关闭
            </Button>
          </div>
        </div>
      </Modal>

      <EditItemModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setShowDetails(false)
        }}
        item={item}
      />
    </>
  )
}

function LoginItemDetails({
  item,
  showPassword,
  setShowPassword,
  copied,
  copyToClipboard,
}: {
  item: VaultItem
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  copied: string | null
  copyToClipboard: (text: string, field: string) => void
}) {
  const data = item.data as { username: string; password: string; url: string; notes: string }

  return (
    <div className="space-y-4">
      <DetailField
        label="用户名"
        value={data.username}
        copied={copied === 'username'}
        onCopy={() => copyToClipboard(data.username, 'username')}
      />
      
      <div>
        <label className="block text-sm font-medium text-textMuted mb-1.5">密码</label>
        <div className="flex gap-2">
          <div className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 font-mono text-text">
            {showPassword ? data.password : '••••••••••••'}
          </div>
          <Button variant="secondary" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? '隐藏' : '显示'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => copyToClipboard(data.password, 'password')}
          >
            {copied === 'password' ? '已复制!' : '复制'}
          </Button>
        </div>
      </div>
      
      {data.url && (
        <DetailField
          label="网址"
          value={data.url}
          copied={copied === 'url'}
          onCopy={() => copyToClipboard(data.url, 'url')}
          isLink
        />
      )}
      
      {data.notes && (
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1.5">备注</label>
          <div className="bg-background border border-border rounded-lg p-4">
            <p className="text-text whitespace-pre-wrap">{data.notes}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function CardItemDetails({
  item,
  showPassword,
  setShowPassword,
  copied,
  copyToClipboard,
}: {
  item: VaultItem
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  copied: string | null
  copyToClipboard: (text: string, field: string) => void
}) {
  const data = item.data as { cardholderName: string; cardNumber: string; expiryDate: string; cvv: string; notes: string }

  return (
    <div className="space-y-4">
      <DetailField
        label="持卡人姓名"
        value={data.cardholderName}
        copied={copied === 'name'}
        onCopy={() => copyToClipboard(data.cardholderName, 'name')}
      />
      <DetailField
        label="卡号"
        value={data.cardNumber}
        copied={copied === 'number'}
        onCopy={() => copyToClipboard(data.cardNumber, 'number')}
      />
      <div className="grid grid-cols-2 gap-4">
        <DetailField
          label="有效期"
          value={data.expiryDate}
          copied={copied === 'expiry'}
          onCopy={() => copyToClipboard(data.expiryDate, 'expiry')}
        />
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1.5">安全码</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 font-mono text-text">
              {showPassword ? data.cvv : '•••'}
            </div>
            <Button variant="secondary" onClick={() => setShowPassword(!showPassword)} className="px-3">
              {showPassword ? '隐藏' : '显示'}
            </Button>
            <Button variant="secondary" onClick={() => copyToClipboard(data.cvv, 'cvv')}>
              {copied === 'cvv' ? '已复制!' : '复制'}
            </Button>
          </div>
        </div>
      </div>
      {data.notes && (
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1.5">备注</label>
          <div className="bg-background border border-border rounded-lg p-4">
            <p className="text-text whitespace-pre-wrap">{data.notes}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function IdentityItemDetails({
  item,
  copied,
  copyToClipboard,
}: {
  item: VaultItem
  copied: string | null
  copyToClipboard: (text: string, field: string) => void
}) {
  const data = item.data as { fullName: string; email: string; phone: string; address: string; notes: string }

  return (
    <div className="space-y-4">
      <DetailField
        label="姓名"
        value={data.fullName}
        copied={copied === 'name'}
        onCopy={() => copyToClipboard(data.fullName, 'name')}
      />
      <DetailField
        label="邮箱"
        value={data.email}
        copied={copied === 'email'}
        onCopy={() => copyToClipboard(data.email, 'email')}
      />
      <DetailField
        label="电话"
        value={data.phone}
        copied={copied === 'phone'}
        onCopy={() => copyToClipboard(data.phone, 'phone')}
      />
      {data.address && (
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1.5">地址</label>
          <div className="bg-background border border-border rounded-lg p-4">
            <p className="text-text whitespace-pre-wrap">{data.address}</p>
          </div>
        </div>
      )}
      {data.notes && (
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1.5">备注</label>
          <div className="bg-background border border-border rounded-lg p-4">
            <p className="text-text whitespace-pre-wrap">{data.notes}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailField({
  label,
  value,
  copied,
  onCopy,
  isLink = false,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
  isLink?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-textMuted mb-1.5">{label}</label>
      <div className="flex gap-2">
        <div className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-text overflow-hidden">
          {isLink ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-primaryLight hover:underline truncate block">
              {value}
            </a>
          ) : (
            <span className="truncate block">{value}</span>
          )}
        </div>
        <Button variant="secondary" onClick={onCopy}>
          {copied ? '已复制!' : '复制'}
        </Button>
      </div>
    </div>
  )
}
