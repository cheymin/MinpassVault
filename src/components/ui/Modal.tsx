'use client'

import { useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/Icon'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        className={`relative bg-gradient-to-br from-surface to-surfaceHover backdrop-blur-xl border border-border rounded-2xl shadow-2xl w-full ${sizes[size]} mx-auto max-h-[90vh] overflow-hidden animate-fade-in`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50 bg-gradient-to-r from-surface/50 to-surfaceHover/50">
          <h2 className="text-base sm:text-lg font-semibold text-text bg-gradient-to-r from-text to-textMuted bg-clip-text text-transparent">{title}</h2>
          <button
            onClick={onClose}
            className="text-textMuted hover:text-danger transition-colors p-1 rounded-lg hover:bg-surface/50"
          >
            <Icon name="times" className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-4 overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}
