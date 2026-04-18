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
    success: 'bg-[#22c55e]',
    error: 'from-danger to-red-600',
    warning: 'from-warning to-amber-600',
    info: 'from-primaryLight to-blue-600',
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none p-4 sm:p-6">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${
            toast.type === 'success' ? 'bg-[#22c55e]' : `bg-gradient-to-r ${typeGradients[toast.type]}`
          } backdrop-blur-xl rounded-2xl shadow-2xl flex items-center gap-4 pointer-events-auto animate-slide-in hover:shadow-glow transition-all duration-300 min-w-[320px] max-w-md px-6 py-4`}
        >
          {toast.type === 'success' ? (
            <div className="text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className={`bg-gradient-to-r ${typeGradients[toast.type]} p-3 rounded-xl`}>
              <span className="text-white text-xl">{typeIcons[toast.type]}</span>
            </div>
          )}
          <span className={`text-base font-semibold ${toast.type === 'success' ? 'text-white' : 'text-text'} flex-1`}>{toast.message}</span>
          <button
            onClick={() => hideToast(toast.id)}
            className={`${toast.type === 'success' ? 'text-white/70 hover:text-white' : 'text-textMuted hover:text-text'} transition-colors p-2 rounded-xl hover:bg-black/10`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
