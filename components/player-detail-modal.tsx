'use client'

import { useState } from 'react'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { PlayerWithStats } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface PlayerDetailModalProps {
  isOpen: boolean
  onClose: () => void
  player: PlayerWithStats | null
  onVote?: () => void
  currentUserPlayerId?: string | null
  onColorChange?: () => void
}

export function PlayerDetailModal({ isOpen, onClose, player, onVote, currentUserPlayerId, onColorChange }: PlayerDetailModalProps) {
  const [editingColor, setEditingColor] = useState(false)
  const [newColor, setNewColor] = useState(player?.card_color || '#f59e0b')
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()
  
  const isOwnPlayer = player?.id === currentUserPlayerId
  
  const handleSaveColor = async () => {
    if (!player) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('players')
        .update({ card_color: newColor })
        .eq('id', player.id)
      
      if (error) throw error
      
      setEditingColor(false)
      if (onColorChange) onColorChange()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }
  
  if (!player) return null

  const stats = player.stats || {
    pace: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defending: 50,
    physical: 50,
  }

  const overall = Math.round(
    (stats.pace + stats.shooting + stats.passing + stats.dribbling + stats.defending + stats.physical) / 6
  )

  const statBars = [
    { label: 'PAC', value: stats.pace, color: 'bg-green-500', textColor: 'text-green-500' },
    { label: 'SHO', value: stats.shooting, color: 'bg-red-500', textColor: 'text-red-500' },
    { label: 'PAS', value: stats.passing, color: 'bg-blue-500', textColor: 'text-blue-500' },
    { label: 'DRI', value: stats.dribbling, color: 'bg-yellow-500', textColor: 'text-yellow-500' },
    { label: 'DEF', value: stats.defending, color: 'bg-purple-500', textColor: 'text-purple-500' },
    { label: 'PHY', value: stats.physical, color: 'bg-orange-500', textColor: 'text-orange-500' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="flex flex-col gap-6">
        {/* Photo and basic info */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {player.image_url ? (
              <img
                src={player.image_url}
                alt={player.name}
                className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-2xl border-4 border-green-600"
              />
            ) : (
              <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-2xl bg-gray-700 flex items-center justify-center text-5xl sm:text-6xl border-4 border-green-600">
                ⚽
              </div>
            )}
          </div>
          
          <div className="mt-4 sm:mt-6 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-white">{player.name}</h3>
            <div className="flex items-center justify-center gap-2 text-gray-400 mt-2">
              <span className="text-base sm:text-lg font-bold text-green-500">#{player.player_number || '?'}</span>
              <span>•</span>
              <span className="font-medium">{player.primary_position}</span>
            </div>
            {player.secondary_positions && player.secondary_positions.length > 0 && (
              <div className="text-xs sm:text-sm text-gray-400 mt-1">
                Secondary: {player.secondary_positions.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Stats visualization */}
        <div className="space-y-3 sm:space-y-4">
          <h4 className="text-lg font-bold mb-4 text-white">Player Stats</h4>
          {statBars.map((stat) => (
            <div key={stat.label}>
              <div className="flex justify-between mb-1">
                <span className={`font-bold text-sm ${stat.textColor}`}>{stat.label}</span>
                <span className={`font-bold text-sm ${stat.textColor}`}>{stat.value}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className={`${stat.color} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${stat.value}%` }}
                />
              </div>
            </div>
          ))}

          {onVote && (
            <div className="pt-4">
              {player.id === currentUserPlayerId ? (
                <div className="text-center text-sm text-gray-400">
                  You cannot rate your own player
                </div>
              ) : (
                <Button onClick={onVote} className="w-full">
                  Rate This Player
                </Button>
              )}
            </div>
          )}

          {isOwnPlayer && (
            <div className="pt-4 border-t border-gray-700">
              {editingColor ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Card Shadow Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer border-2 border-gray-600"
                    />
                    <input
                      type="text"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                      placeholder="#f59e0b"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveColor} className="flex-1" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Color'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingColor(false)
                        setNewColor(player.card_color || '#f59e0b')
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setEditingColor(true)} variant="outline" className="w-full">
                  Change Card Color
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
