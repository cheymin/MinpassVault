'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-textMuted mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textMuted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-surface/50 backdrop-blur-sm border border-border rounded-lg px-4 py-2.5 text-text
              placeholder:text-textMuted/50
              focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface
              transition-all duration-200
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-danger animate-fade-in">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
