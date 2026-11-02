import { MessageSquare, FlaskConical, Settings } from 'lucide-react'
import type { NavTab } from '@/types'

interface BottomNavProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
}

const tabs: { id: NavTab; label: string; icon: typeof MessageSquare }[] = [
  { id: 'chat',     label: 'Chat',    icon: MessageSquare },
  { id: 'studio',   label: 'Studio',  icon: FlaskConical  },
  { id: 'settings', label: 'Settings', icon: Settings     },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="flex border-t border-slate/10 bg-white/90 backdrop-blur-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={[
              'flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors',
              isActive
                ? 'text-botanical'
                : 'text-slate-light hover:text-slate',
            ].join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.8}
              className={isActive ? 'text-botanical' : 'text-slate-light'}
            />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
