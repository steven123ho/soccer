'use client'

import { CardBuilder } from './card-builder'
import { TeamBuilder } from './team-builder'

interface BuilderPageProps {
  onCardCreated?: () => void
}

export function BuilderPage({ onCardCreated }: BuilderPageProps) {
  return (
    <div className="pb-20 space-y-8">
      <h2 className="text-xl sm:text-2xl font-bold text-white">Builder</h2>

      <CardBuilder embedded onCardCreated={onCardCreated} />

      <div className="border-t border-gray-700 pt-8">
        <TeamBuilder embedded />
      </div>
    </div>
  )
}
