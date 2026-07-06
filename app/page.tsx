'use client'

import { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { HomePage } from '@/components/home-page'
import { PlayersPage } from '@/components/players-page'
import { TeamPickerPage } from '@/components/team-picker-page'
import { PollsPage } from '@/components/polls-page'
import { AuthButton } from '@/components/auth-button'

export default function Home() {
  const [currentPage, setCurrentPage] = useState('home')

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-gray-700 px-4 py-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">⚽ SOCCER PICKUP</h1>
            <p className="text-sm text-gray-400">FIFA Ultimate Team Style</p>
          </div>
          <AuthButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'players' && <PlayersPage />}
        {currentPage === 'team-picker' && <TeamPickerPage />}
        {currentPage === 'polls' && <PollsPage />}
      </main>

      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  )
}
