import React from 'react'

export function Card({ children, className = '', onClick }) {
  return (
    <div
      className={`bg-surface border border-border rounded-lg ${onClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function StatBlock({ value, label, className = '' }) {
  return (
    <div className={`text-center ${className}`}>
      <div className="text-3xl font-bold font-mono text-text-primary">{value}</div>
      <div className="text-xs text-text-muted uppercase tracking-wider mt-1">{label}</div>
    </div>
  )
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-surface text-text-secondary border-border',
    primary: 'bg-primary/15 text-primary border-primary/30',
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    danger: 'bg-danger/15 text-danger border-danger/30',
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
