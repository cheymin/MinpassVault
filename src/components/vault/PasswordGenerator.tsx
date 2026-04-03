'use client'

import { useState } from 'react'
import { generateRandomPassword, calculatePasswordStrength } from '@/lib/crypto'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface PasswordGeneratorProps {
  onGenerated?: (password: string) => void
  isOpen: boolean
  onClose: () => void
}

export function PasswordGenerator({ onGenerated, isOpen, onClose }: PasswordGeneratorProps) {
  const [password, setPassword] = useState('')
  const [options, setOptions] = useState({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })

  const handleGenerate = () => {
    const newPassword = generateRandomPassword(options.length, options)
    setPassword(newPassword)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password)
  }

  const handleUse = () => {
    if (onGenerated && password) {
      onGenerated(password)
      onClose()
    }
  }

  const strength = password ? calculatePasswordStrength(password) : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="密码生成器">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">生成的密码</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-background border border-border rounded-lg px-4 py-3 font-mono text-text break-all">
              {password || '点击生成按钮创建密码'}
            </div>
          </div>
          {strength && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    strength.score <= 2
                      ? 'bg-danger'
                      : strength.score <= 4
                      ? 'bg-warning'
                      : strength.score <= 5
                      ? 'bg-primaryLight'
                      : 'bg-success'
                  }`}
                  style={{ width: `${(strength.score / 7) * 100}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${strength.color}`}>{strength.label}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">
            长度: {options.length}
          </label>
          <input
            type="range"
            min="8"
            max="64"
            value={options.length}
            onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
            className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-textMuted mt-1">
            <span>8</span>
            <span>64</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-textMuted">字符类型</label>
          
          {[
            { key: 'uppercase', label: '大写字母 (A-Z)', value: options.uppercase },
            { key: 'lowercase', label: '小写字母', value: options.lowercase },
            { key: 'numbers', label: '数字 (0-9)', value: options.numbers },
            { key: 'symbols', label: '符号 (!@#$%^&*)', value: options.symbols },
          ].map((option) => (
            <label key={option.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={option.value}
                onChange={(e) =>
                  setOptions({ ...options, [option.key]: e.target.checked })
                }
                className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
              />
              <span className="text-text">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleCopy} disabled={!password}>
            复制
          </Button>
          <Button variant="secondary" onClick={handleGenerate} className="flex-1">
            生成
          </Button>
          {onGenerated && (
            <Button onClick={handleUse} disabled={!password}>
              使用密码
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
