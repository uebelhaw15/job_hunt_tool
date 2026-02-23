import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Briefcase, BookOpen, Brain, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CostBadge } from './CostBadge'

const NAV = [
  { to: '/', label: 'Jobs', icon: Briefcase, end: true },
  { to: '/bank', label: 'Question Bank', icon: BookOpen, end: false },
  { to: '/practice', label: 'Practice', icon: Brain, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200">
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">Job Hunt Tool</h1>
        </div>

        <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Cost display — always visible at bottom of sidebar */}
        <div className="px-3 py-3 border-t border-slate-200">
          <CostBadge />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  )
}
