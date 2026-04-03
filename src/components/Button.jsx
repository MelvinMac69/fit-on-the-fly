import React from 'react'

export function Button({
  children,
  variant = 'primary', // primary | secondary | ghost | danger
  size = 'md', // sm | md | lg
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-md transition-all duration-150 active:scale-95 select-none'

  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5 min-h-[36px]',
    md: 'text-base px-4 py-3 min-h-[44px]',
    lg: 'text-lg px-6 py-4 min-h-[52px]',
  }

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-hover disabled:bg-zinc-700 disabled:text-zinc-500',
    secondary: 'bg-transparent border border-primary text-primary hover:bg-primary/10 disabled:border-zinc-700 disabled:text-zinc-600',
    ghost: 'bg-transparent text-text-primary hover:bg-surface active:bg-border disabled:text-zinc-600',
    danger: 'bg-danger text-white hover:bg-red-600 disabled:bg-zinc-700',
  }

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabled || loading ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  )
}
