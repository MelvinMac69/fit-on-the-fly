import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, BarChart3, Settings } from 'lucide-react'

const navItems = [
  { to: '/home', label: 'Home', Icon: Home },
  { to: '/progress', label: 'Progress', Icon: BarChart3 },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg border-t border-border z-40">
      <div className="max-w-lg mx-auto flex">
        {navItems.map(({ to, label, Icon }) => {
          const isActive = location.pathname === to || (to === '/home' && location.pathname === '/')
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center py-2 pt-3 transition-colors ${
                isActive ? 'text-primary' : 'text-text-muted'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium mt-1">{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
