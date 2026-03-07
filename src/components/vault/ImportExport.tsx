'use client'

import { useState } from 'react'
import { useVault, VaultItemType } from '@/contexts/VaultContext'
import { useAuth } from '@/contexts/AuthContext'
import { encryptVaultData, decryptVaultData } from '@/lib/crypto'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface ImportExportProps {
  isOpen: boolean
  onClose: () => void
}

export function ImportExport({ isOpen, onClose }: ImportExportProps) {
  const { items, addItem } = useVault()
  const { masterKey } = useAuth()
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleExport = async () => {
    if (!masterKey) return

    setExporting(true)
    setError('')

    try {
      const exportData = items.map((item) => ({
        type: item.type,
        name: item.name,
        data: item.data,
        favorite: item.favorite,
        folderId: item.folderId,
      }))

      const json = JSON.stringify(exportData, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `securevault-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess('导出成功！')
    } catch (err) {
      setError('导出数据失败')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !masterKey) return

    setImporting(true)
    setError('')
    setSuccess('')

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!Array.isArray(data)) {
        throw new Error('Invalid format')
      }

      let imported = 0
      for (const item of data) {
        if (!item.type || !item.name || !item.data) continue

        const result = await addItem({
          type: item.type as VaultItemType,
          name: item.name,
          data: item.data,
          folderId: item.folderId || null,
          favorite: item.favorite || false,
        })

        if (!result.error) imported++
      }

      setSuccess(`成功导入 ${imported} 个项目`)
    } catch (err) {
      setError('导入数据失败，请检查文件格式。')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const handleClose = () => {
    setError('')
    setSuccess('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="导入 / 导出">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-text mb-2">导出数据</h3>
          <p className="text-sm text-textMuted mb-4">
            将所有保险库项目导出为 JSON 文件。此文件包含未加密数据，请妥善保管！
          </p>
          <Button onClick={handleExport} loading={exporting} className="w-full">
            导出为 JSON
          </Button>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-medium text-text mb-2">导入数据</h3>
          <p className="text-sm text-textMuted mb-4">
            从 JSON 文件导入保险库项目。这将添加新项目到您的保险库。
          </p>
          <label className="block">
            <div className="w-full bg-surface border border-border border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primaryLight transition-colors">
              <svg className="w-12 h-12 mx-auto text-textMuted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-textMuted">点击选择文件</span>
              <span className="block text-xs text-textMuted mt-1">仅支持 JSON 格式</span>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>

        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
            {success}
          </div>
        )}

        <Button variant="secondary" onClick={handleClose} className="w-full">
          关闭
        </Button>
      </div>
    </Modal>
  )
}
