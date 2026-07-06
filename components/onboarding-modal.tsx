'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from './ui/modal'
import { Button } from './ui/button'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [name, setName] = useState('')
  const [position, setPosition] = useState('CM')
  const [playerNumber, setPlayerNumber] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('players').insert({
        user_id: user.id,
        name,
        primary_position: position,
        player_number: parseInt(playerNumber) || null,
        image_url: imageUrl || null,
        rarity: 'gold',
      })

      if (error) throw error

      onComplete()
      onClose()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Your Player Profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Your Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-card border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Jersey Number (1-99)</label>
          <input
            type="number"
            min="1"
            max="99"
            value={playerNumber}
            onChange={(e) => setPlayerNumber(e.target.value)}
            className="w-full px-3 py-2 bg-card border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="10"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Primary Position *</label>
          <select
            value={position}
            disabled={loading}
            onChange={(e) => setPosition(e.target.value)}
            required
            className="w-full px-3 py-2 bg-card border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="GK">GK - Goalkeeper</option>
            <option value="CB">CB - Center Back</option>
            <option value="LB">LB - Left Back</option>
            <option value="RB">RB - Right Back</option>
            <option value="CDM">CDM - Defensive Mid</option>
            <option value="CM">CM - Center Mid</option>
            <option value="CAM">CAM - Attacking Mid</option>
            <option value="LW">LW - Left Wing</option>
            <option value="RW">RW - Right Wing</option>
            <option value="ST">ST - Striker</option>
            <option value="CF">CF - Center Forward</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Photo URL (optional)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 bg-card border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://example.com/photo.jpg"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating Profile...' : 'Create Profile'}
        </Button>
      </form>
    </Modal>
  )
}
