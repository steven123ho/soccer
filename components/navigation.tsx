'use client'

import { Home, Users, PlusCircle, BarChart3, User, Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
}

const navItems = [
  { id: 'players', label: 'Players', icon: Users },
  { id: 'team-builder', label: 'Builder', icon: PlusCircle },
  { id: 'team-picker', label: 'Pick Teams', icon: Shuffle },
  { id: 'polls', label: 'Polls', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User },
]

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-green-600 to-green-700 border-t border-green-800 px-2 py-2 z-40 shadow-lg">
      <div className="flex justify-around max-w-4xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300',
                currentPage === item.id
                  ? 'text-white bg-white/20 scale-105'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon size={18} strokeWidth={2.5} />
              <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
