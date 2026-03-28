'use client'

import { useState } from 'react'
import { useVault, VaultItemType } from '@/contexts/VaultContext'
import { useAuth } from '@/contexts/AuthContext'
import { encryptVaultData, decryptVaultData } from '@/lib/crypto'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'

interface ImportExportProps {
  isOpen: boolean
  onClose: () => void
}

export function ImportExport({ isOpen, onClose }: ImportExportProps) {
  const { items, addItem } = useVault()
  const { masterKey } = useAuth()
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleExportJSON = async () => {
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

      setSuccess('JSON 导出成功！')
    } catch (err) {
      setError('导出数据失败')
    } finally {
      setExporting(false)
    }
  }

  const handleExportCSV = async () => {
    if (!masterKey) return

    setExporting(true)
    setError('')

    try {
      const loginItems = items.filter(item => item.type === 'login')
      
      const csvHeader = 'name,url,username,password,notes\n'
      const csvRows = loginItems.map(item => {
        const data = item.data as { username: string; password: string; url: string; notes: string }
        return [
          `"${item.name}"`,
          `"${data.url || ''}"`,
          `"${data.username || ''}"`,
          `"${data.password || ''}"`,
          `"${(data.notes || '').replace(/"/g, '""')}"`
        ].join(',')
      }).join('\n')

      const csv = csvHeader + csvRows
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `securevault-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess('CSV 导出成功！')
    } catch (err) {
      setError('导出数据失败')
    } finally {
      setExporting(false)
    }
  }

  const handleExport = async () => {
    if (exportFormat === 'json') {
      await handleExportJSON()
    } else {
      await handleExportCSV()
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
      
      if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(line => line.trim())
        if (lines.length < 2) throw new Error('CSV文件为空')
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        let imported = 0
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
          if (!values) continue
          
          const cleanValues = values.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'))
          
          const name = cleanValues[0] || `导入项目 ${i}`
          const url = cleanValues[1] || ''
          const username = cleanValues[2] || ''
          const password = cleanValues[3] || ''
          const notes = cleanValues[4] || ''
          
          if (!username && !password) continue
          
          const result = await addItem({
            type: 'login',
            name,
            data: { username, password, url, notes },
            folderId: null,
            favorite: false,
          })
          
          if (!result.error) imported++
        }
        
        setSuccess(`成功导入 ${imported} 个项目`)
      } else {
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
      }
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
            将所有保险库项目导出为文件。此文件包含未加密数据，请妥善保管！
          </p>
          
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setExportFormat('json')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                exportFormat === 'json'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primaryLight text-textMuted'
              }`}
            >
              JSON 格式
            </button>
            <button
              type="button"
              onClick={() => setExportFormat('csv')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                exportFormat === 'csv'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primaryLight text-textMuted'
              }`}
            >
              CSV 格式
            </button>
          </div>
          
          <p className="text-xs text-textMuted mb-4">
            {exportFormat === 'json' 
              ? 'JSON 格式：完整数据备份，支持所有类型的项目' 
              : 'CSV 格式：仅导出登录凭证，可导入到浏览器密码管理器'}
          </p>
          
          <Button onClick={handleExport} loading={exporting} className="w-full">
            <Icon name="download" className="w-4 h-4 mr-2" />
            导出为 {exportFormat.toUpperCase()}
          </Button>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-medium text-text mb-2">导入数据</h3>
          <p className="text-sm text-textMuted mb-4">
            从文件导入保险库项目。支持 JSON 和 CSV 格式。这将添加新项目到您的保险库。
          </p>
          <label className="block">
            <div className="w-full bg-surface border border-border border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primaryLight transition-colors">
              <Icon name="upload" className="w-12 h-12 mx-auto text-textMuted mb-2" />
              <span className="text-textMuted">点击选择文件</span>
              <span className="block text-xs text-textMuted mt-1">支持 JSON 和 CSV 格式</span>
            </div>
            <input
              type="file"
              accept=".json,.csv"
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
