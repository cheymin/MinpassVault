'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success', duration: number = 3000) => {
    const id = Date.now().toString()
    const newToast: Toast = { id, type, message, duration }
    
    setToasts(prev => [...prev, newToast])
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} hideToast={hideToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, hideToast }: { toasts: Toast[]; hideToast: (id: string) => void }) {
  const typeIcons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  const typeGradients: Record<ToastType, string> = {
    success: 'from-success to-green-600',
    error: 'from-danger to-red-600',
    warning: 'from-warning to-amber-600',
    info: 'from-primaryLight to-blue-600',
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none p-2 sm:p-4">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="bg-gradient-to-r from-surface to-surfaceHover border border-border/50 backdrop-blur-xl rounded-xl shadow-lg flex items-center gap-3 pointer-events-auto animate-slide-in hover:shadow-glow transition-all duration-300 min-w-[280px] max-w-sm"
        >
          <div className={`bg-gradient-to-r ${typeGradients[toast.type]} p-2 rounded-lg`}>
            <span className="text-white text-lg">{typeIcons[toast.type]}</span>
          </div>
          <span className="text-sm font-medium text-text flex-1">{toast.message}</span>
          <button
            onClick={() => hideToast(toast.id)}
            className="text-textMuted hover:text-text transition-colors p-1 rounded-lg hover:bg-surface"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
