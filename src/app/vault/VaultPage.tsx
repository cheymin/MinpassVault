'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useVault, VaultItemType } from '@/contexts/VaultContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
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
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [unlockPassword, setUnlockPassword] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

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
    { value: 'all', label: '全部', icon: 'folder' },
    { value: 'login', label: '登录凭证', icon: 'key' },
    { value: 'secure_note', label: '安全笔记', icon: 'file-lines' },
    { value: 'card', label: '银行卡', icon: 'credit-card' },
    { value: 'identity', label: '身份信息', icon: 'id-card' },
  ]

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
                <span className="font-semibold text-text">{user?.siteTitle || 'SecureVault'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowMobileMenu(!showMobileMenu)} className="lg:hidden">
                <Icon name="bars" className="w-5 h-5" />
              </Button>
              <div className="hidden lg:flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-textMuted hover:text-text">
                  <Icon name="chart-pie" className="w-4 h-4 mr-1.5" />
                  仪表盘
                </Button>
                <Button variant="ghost" size="sm" onClick={() => router.push('/audit-logs')} className="text-textMuted hover:text-text">
                  <Icon name="history" className="w-4 h-4 mr-1.5" />
                  审计日志
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowPasswordGen(true)} className="text-textMuted hover:text-text">
                  <Icon name="key" className="w-4 h-4 mr-1.5" />
                  密码生成器
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowImportExport(true)} className="text-textMuted hover:text-text">
                  <Icon name="download" className="w-4 h-4 mr-1.5" />
                  导入/导出
                </Button>
                <div className="w-px h-5 bg-border mx-1"></div>
                <Button variant="ghost" size="sm" onClick={() => router.push('/settings')} className="text-textMuted hover:text-text">
                  <Icon name="cog" className="w-4 h-4 mr-1.5" />
                  设置
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLock} className="text-textMuted hover:text-text">
                  <Icon name="lock" className="w-4 h-4 mr-1.5" />
                  锁定
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-textMuted hover:text-danger">
                  <Icon name="sign-out-alt" className="w-4 h-4 mr-1.5" />
                  退出
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {showMobileMenu && (
        <div className="lg:hidden fixed top-14 left-0 right-0 bg-surface border-b border-border z-30 shadow-lg animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            <Button variant="ghost" size="sm" onClick={() => { router.push('/dashboard'); setShowMobileMenu(false) }} className="w-full justify-start text-textMuted">
              <Icon name="chart-pie" className="w-4 h-4 mr-2" />
              仪表盘
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { router.push('/audit-logs'); setShowMobileMenu(false) }} className="w-full justify-start text-textMuted">
              <Icon name="history" className="w-4 h-4 mr-2" />
              审计日志
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowPasswordGen(true); setShowMobileMenu(false) }} className="w-full justify-start text-textMuted">
              <Icon name="key" className="w-4 h-4 mr-2" />
              密码生成器
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowImportExport(true); setShowMobileMenu(false) }} className="w-full justify-start text-textMuted">
              <Icon name="download" className="w-4 h-4 mr-2" />
              导入/导出
            </Button>
            <div className="border-t border-border my-2"></div>
            <Button variant="ghost" size="sm" onClick={() => { router.push('/settings'); setShowMobileMenu(false) }} className="w-full justify-start text-textMuted">
              <Icon name="cog" className="w-4 h-4 mr-2" />
              设置
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { handleLock(); setShowMobileMenu(false) }} className="w-full justify-start text-textMuted">
              <Icon name="lock" className="w-4 h-4 mr-2" />
              锁定
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { handleSignOut(); setShowMobileMenu(false) }} className="w-full justify-start text-danger">
              <Icon name="sign-out-alt" className="w-4 h-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-surface border border-border rounded-xl p-4 sticky top-20 shadow-sm">
              <Button onClick={() => setShowAddModal(true)} className="w-full mb-4">
                <Icon name="plus" className="w-4 h-4 mr-2" />
                添加项目
              </Button>

              <div className="space-y-1 mb-4">
                {typeFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedType(filter.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                      selectedType === filter.value
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-textMuted hover:bg-surfaceHover hover:text-text'
                    }`}
                  >
                    <Icon name={filter.icon as any} className="w-4 h-4" />
                    <span className="text-sm flex-1">{filter.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedType === filter.value ? 'bg-primary/20 text-primary' : 'bg-surfaceHover text-textMuted'
                    }`}>
                      {filter.value === 'all' ? items.length : items.filter((i) => i.type === filter.value).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-textMuted uppercase tracking-wide">文件夹</span>
                  <button
                    onClick={() => setShowFolderModal(true)}
                    className="text-textMuted hover:text-primary transition-colors"
                  >
                    <Icon name="plus" className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                      selectedFolder === null
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-textMuted hover:bg-surfaceHover hover:text-text'
                    }`}
                  >
                    <Icon name="folder" className="w-4 h-4" />
                    <span className="text-sm">全部项目</span>
                  </button>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all group ${
                        selectedFolder === folder.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-textMuted hover:bg-surfaceHover hover:text-text'
                      }`}
                    >
                      <Icon name="folder" className="w-4 h-4" />
                      <span className="text-sm flex-1 truncate">{folder.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteFolder(folder.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-textMuted hover:text-danger transition-all"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-6">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
                <input
                  type="search"
                  placeholder="搜索保险库..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-text placeholder-textMuted focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-surfaceHover rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="search" className="w-8 h-8 text-textMuted" />
                </div>
                <h3 className="text-lg font-medium text-text mb-1">未找到项目</h3>
                <p className="text-textMuted mb-6">
                  {search ? '请尝试其他搜索词' : '添加您的第一个项目开始使用'}
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Icon name="plus" className="w-4 h-4 mr-2" />
                  添加项目
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {favoriteItems.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-textMuted mb-3 flex items-center gap-2">
                      <Icon name="star" className="w-4 h-4 text-warning" />
                      收藏
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {favoriteItems.map((item) => (
                        <VaultItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {regularItems.length > 0 && (
                  <div>
                    {favoriteItems.length > 0 && (
                      <h2 className="text-sm font-semibold text-textMuted mb-3">全部项目</h2>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
