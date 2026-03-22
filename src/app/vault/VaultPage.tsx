'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useVault, VaultItemType } from '@/contexts/VaultContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { AddItemModal } from '@/components/vault/AddItemModal'
import { VaultItemCard } from '@/components/vault/VaultItemCard'
import { PasswordGenerator } from '@/components/vault/PasswordGenerator'
import { ImportExport } from '@/components/vault/ImportExport'

export default function VaultPage() {
  const { user, signOut, lockVault, unlockVault, isVaultUnlocked } = useAuth()
  const { items, folders, addFolder, deleteFolder, loading } = useVault()
  const { showToast } = useToast()
  const router = useRouter()
  
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<VaultItemType | 'all'>('all')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPasswordGen, setShowPasswordGen] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [unlockPassword, setUnlockPassword] = useState('')
  const [unlockError, setUnlockError] = useState('')

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.type === 'login' && (item.data as { username: string }).username?.toLowerCase().includes(search.toLowerCase()))
      const matchesType = selectedType === 'all' || item.type === selectedType
      const matchesFolder = selectedFolder === null || item.folderId === selectedFolder
      return matchesSearch && matchesType && matchesFolder
    })
  }, [items, search, selectedType, selectedFolder])

  const favoriteItems = filteredItems.filter((item) => item.favorite)
  const regularItems = filteredItems.filter((item) => !item.favorite)

  const handleSignOut = () => {
    signOut()
    router.push('/')
  }

  const handleLock = () => {
    lockVault()
    setShowUnlockModal(true)
  }

  const handleUnlock = async () => {
    setUnlockError('')
    const { error } = await unlockVault(unlockPassword)
    if (error) {
      setUnlockError(error)
    } else {
      showToast('保险库已解锁', 'success')
      setShowUnlockModal(false)
      setUnlockPassword('')
    }
  }

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return
    await addFolder(newFolderName.trim())
    setNewFolderName('')
    setShowFolderModal(false)
    showToast('文件夹创建成功', 'success')
  }

  const typeFilters: { value: VaultItemType | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: '全部', icon: '📁' },
    { value: 'login', label: '登录凭证', icon: '🔑' },
    { value: 'secure_note', label: '安全笔记', icon: '📝' },
    { value: 'card', label: '银行卡', icon: '💳' },
    { value: 'identity', label: '身份信息', icon: '👤' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src={user?.siteIcon || 'https://djkl.qzz.io/file/1770081419896_头像.webp'} 
                  alt="Logo" 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg"
                />
                <span className="font-semibold text-text text-sm sm:text-base">{user?.siteTitle || 'SecureVault'}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/settings')} className="hidden sm:flex">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">设置</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowPasswordGen(true)} className="hidden sm:flex">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span className="hidden sm:inline">密码生成器</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowImportExport(true)} className="hidden sm:flex">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="hidden sm:inline">导入/导出</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLock} className="hidden sm:flex">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="hidden sm:inline">锁定</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">退出登录</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-surface border border-border rounded-xl p-3 sm:p-4 sticky top-20 lg:top-24">
              <Button onClick={() => setShowAddModal(true)} className="w-full mb-3 sm:mb-4">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加项目
              </Button>

              <div className="space-y-1 mb-3 sm:mb-4">
                {typeFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedType(filter.value)}
                    className={`w-full flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedType === filter.value
                        ? 'bg-primary/10 text-primary'
                        : 'text-textMuted hover:bg-surfaceHover hover:text-text'
                    }`}
                  >
                    <span>{filter.icon}</span>
                    <span className="text-xs sm:text-sm">{filter.label}</span>
                    <span className="ml-auto text-xs text-textMuted">
                      {filter.value === 'all' ? items.length : items.filter((i) => i.type === filter.value).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t border-border pt-3 sm:pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-textMuted uppercase">文件夹</span>
                  <button
                    onClick={() => setShowFolderModal(true)}
                    className="text-textMuted hover:text-text"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className={`w-full flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedFolder === null
                        ? 'bg-primary/10 text-primary'
                        : 'text-textMuted hover:bg-surfaceHover hover:text-text'
                    }`}
                  >
                    <span>📁</span>
                    <span className="text-xs sm:text-sm">全部项目</span>
                  </button>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`w-full flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-left transition-colors group ${
                        selectedFolder === folder.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-textMuted hover:bg-surfaceHover hover:text-text'
                      }`}
                    >
                      <span>📁</span>
                      <span className="text-xs sm:text-sm flex-1 truncate">{folder.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteFolder(folder.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-textMuted hover:text-danger"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-4 sm:mb-6">
              <Input
                type="search"
                placeholder="搜索保险库..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={
                  <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-text mb-1">未找到项目</h3>
                <p className="text-sm sm:text-base text-textMuted mb-4">
                  {search ? '请尝试其他搜索词' : '添加您的第一个项目开始使用'}
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加项目
                </Button>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {favoriteItems.length > 0 && (
                  <div>
                    <h2 className="text-xs sm:text-sm font-medium text-textMuted mb-2 sm:mb-3 flex items-center gap-2">
                      <span className="text-warning">★</span> 收藏
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {favoriteItems.map((item) => (
                        <VaultItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {regularItems.length > 0 && (
                  <div>
                    {favoriteItems.length > 0 && (
                      <h2 className="text-xs sm:text-sm font-medium text-textMuted mb-2 sm:mb-3">全部项目</h2>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {regularItems.map((item) => (
                        <VaultItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <AddItemModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <PasswordGenerator isOpen={showPasswordGen} onClose={() => setShowPasswordGen(false)} />
      <ImportExport isOpen={showImportExport} onClose={() => setShowImportExport(false)} />

      <Modal isOpen={showFolderModal} onClose={() => setShowFolderModal(false)} title="新建文件夹" size="sm">
        <div className="space-y-4">
          <Input
            label="文件夹名称"
            placeholder="请输入文件夹名称"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowFolderModal(false)} className="flex-1">
              取消
            </Button>
            <Button onClick={handleAddFolder} className="flex-1">
              创建
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showUnlockModal} onClose={() => setShowUnlockModal(false)} title="保险库已锁定" size="sm">
        <div className="space-y-4">
          <p className="text-textMuted text-sm">请输入主密码解锁保险库。</p>
          <Input
            type="password"
            placeholder="主密码"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            error={unlockError}
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => router.push('/')} className="flex-1">
              退出登录
            </Button>
            <Button onClick={handleUnlock} className="flex-1">
              解锁
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
