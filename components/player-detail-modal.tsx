'use client'

import { useState, useEffect } from 'react'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { PlayerWithStats, StatsSummary } from '@/lib/types'
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
  const [statsSummary, setStatsSummary] = useState<StatsSummary | null>(null)
  
  const supabase = createClient()
  
  const isOwnPlayer = player?.id === currentUserPlayerId

  useEffect(() => {
    if (player && isOpen) {
      fetchPlayerStats(player.id)
    }
  }, [player, isOpen])

  const fetchPlayerStats = async (playerId: string) => {
    const { data } = await supabase
      .from('stats_entries')
      .select('*')
      .eq('player_id', playerId)
      .order('date', { ascending: false })

    if (data && data.length > 0) {
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

      const totalGoals = data.reduce((sum, e) => sum + e.goals, 0)
      const totalAssists = data.reduce((sum, e) => sum + e.assists, 0)
      const totalGames = data.length
      const totalHours = data.reduce((sum, e) => sum + (e.hours_played || 0), 0)

      const goalsLastWeek = data
        .filter(e => new Date(e.date) >= oneWeekAgo)
        .reduce((sum, e) => sum + e.goals, 0)
      const assistsLastWeek = data
        .filter(e => new Date(e.date) >= oneWeekAgo)
        .reduce((sum, e) => sum + e.assists, 0)

      const goalsLastMonth = data
        .filter(e => new Date(e.date) >= oneMonthAgo)
        .reduce((sum, e) => sum + e.goals, 0)
      const assistsLastMonth = data
        .filter(e => new Date(e.date) >= oneMonthAgo)
        .reduce((sum, e) => sum + e.assists, 0)

      const goalsLastYear = data
        .filter(e => new Date(e.date) >= oneYearAgo)
        .reduce((sum, e) => sum + e.goals, 0)
      const assistsLastYear = data
        .filter(e => new Date(e.date) >= oneYearAgo)
        .reduce((sum, e) => sum + e.assists, 0)

      setStatsSummary({
        total_goals: totalGoals,
        total_assists: totalAssists,
        total_games: totalGames,
        total_hours: totalHours,
        goals_per_game: totalGames > 0 ? totalGoals / totalGames : 0,
        assists_per_game: totalGames > 0 ? totalAssists / totalGames : 0,
        goals_per_hour: totalHours > 0 ? totalGoals / totalHours : 0,
        assists_per_hour: totalHours > 0 ? totalAssists / totalHours : 0,
        goals_last_week: goalsLastWeek,
        assists_last_week: assistsLastWeek,
        goals_last_month: goalsLastMonth,
        assists_last_month: assistsLastMonth,
        goals_last_year: goalsLastYear,
        assists_last_year: assistsLastYear
      })
    } else {
      setStatsSummary(null)
    }
  }
  
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
    vote_count: 0,
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
            {stats.vote_count > 0 && (
              <div className="text-xs sm:text-sm text-gray-500 mt-1">
                {stats.vote_count} rating{stats.vote_count !== 1 ? 's' : ''}
              </div>
            )}
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
        </div>

        {/* Performance Stats */}
        {statsSummary && (
          <div className="space-y-3 border-t border-gray-700 pt-4">
            <h4 className="text-lg font-bold text-white">Performance Stats</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Total Goals</p>
                <p className="text-xl font-bold text-green-400">{statsSummary.total_goals}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Total Assists</p>
                <p className="text-xl font-bold text-blue-400">{statsSummary.total_assists}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Games Played</p>
                <p className="text-xl font-bold text-purple-400">{statsSummary.total_games}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Total Hours</p>
                <p className="text-xl font-bold text-yellow-400">{statsSummary.total_hours.toFixed(1)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Goals/Game</p>
                <p className="text-xl font-bold text-green-400">{statsSummary.goals_per_game.toFixed(2)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Assists/Game</p>
                <p className="text-xl font-bold text-blue-400">{statsSummary.assists_per_game.toFixed(2)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Goals (Week)</p>
                <p className="text-xl font-bold text-green-400">{statsSummary.goals_last_week}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Assists (Week)</p>
                <p className="text-xl font-bold text-blue-400">{statsSummary.assists_last_week}</p>
              </div>
            </div>
          </div>
        )}

        {onVote && (
          <div className="pt-4">
            <Button onClick={onVote} className="w-full">
              Rate This Player
            </Button>
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
    </Modal>
  )
}
