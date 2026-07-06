'use client'

import { Home, Users, PlusCircle, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'team-picker', label: 'Pick Teams', icon: PlusCircle },
  { id: 'polls', label: 'Polls', icon: BarChart3 },
]

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-gray-700 px-4 py-2 z-40">
      <div className="flex justify-around max-w-4xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                currentPage === item.id
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
