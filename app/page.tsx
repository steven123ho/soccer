'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { HomePage } from '@/components/home-page'
import { PlayersPage } from '@/components/players-page'
import { PlayPage } from '@/components/play-page'
import { BuilderPage } from '@/components/builder-page'
import { StatsTrackerPage } from '@/components/stats-tracker-page'
import { ProfilePage } from '@/components/profile-page'
import { AuthButton } from '@/components/auth-button'
import { MOTMCardPreview } from '@/components/motm-card-preview'

function HomeContent() {
  const [currentPage, setCurrentPage] = useState('players')
  const searchParams = useSearchParams()
  const playerParam = searchParams.get('player')

  useEffect(() => {
    if (playerParam) {
      setCurrentPage('players')
    }
  }, [playerParam])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gradient-to-r from-green-600 to-green-700 border-b border-green-800 px-3 sm:px-4 py-3 sm:py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-2xl sm:text-3xl">⚽</div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">Los N1g@hz</h1>
              <p className="text-[10px] sm:text-xs text-white/90 font-medium">ULTIMATE TEAM</p>
            </div>
          </div>
          <AuthButton onProfileClick={() => setCurrentPage('profile')} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'players' && <PlayersPage initialPlayerId={playerParam || undefined} />}
        {currentPage === 'team-picker' && <PlayPage />}
        {currentPage === 'builder' && <BuilderPage onCardCreated={() => setCurrentPage('players')} />}
        {currentPage === 'stats' && <StatsTrackerPage onNavigateToProfile={() => setCurrentPage('profile')} />}
        {currentPage === 'profile' && <ProfilePage />}
        {currentPage === 'motm-preview' && <MOTMCardPreview />}
      </main>

      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center text-white">Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}
