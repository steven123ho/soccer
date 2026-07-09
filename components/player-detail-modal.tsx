'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { PlayerWithStats, StatsSummary } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { SegmentedBar } from './ui/segmented-bar'
import { PlayerCard } from './player-card'
import { toPng } from 'html-to-image'
import { Share2, Copy, Palette, Star } from 'lucide-react'

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
  const [extraStatsOpen, setExtraStatsOpen] = useState(false)
  const [performanceStatsOpen, setPerformanceStatsOpen] = useState(true)
  const [sharing, setSharing] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClient()
  
  const isOwnPlayer = player?.id === currentUserPlayerId

  useEffect(() => {
    if (isOpen) {
      setExtraStatsOpen(false)
      setPerformanceStatsOpen(true)
      if (player) {
        fetchPlayerStats(player.id)
      }
    }
  }, [player?.id, isOpen])

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

  const handleShare = async () => {
    if (!player) return
    setSharing(true)

    try {
      // Generate the share URL
      const baseUrl = window.location.origin
      const shareUrl = `${baseUrl}?player=${player.id}`

      // Try to capture the card as an image
      let file = null
      if (cardRef.current) {
        try {
          const dataUrl = await toPng(cardRef.current, {
            width: 300,
            height: 400,
            quality: 1,
          })
          const response = await fetch(dataUrl)
          const blob = await response.blob()
          file = new File([blob], `${player.name}-card.png`, { type: 'image/png' })
        } catch (imageError) {
          console.error('Image capture failed:', imageError)
          // Continue without image
        }
      }

      // Check if Web Share API is available
      if (navigator.share) {
        const shareData: any = {
          title: `${player.name} - Soccer Stats`,
          text: `Check out ${player.name}'s player card!`,
          url: shareUrl,
        }
        if (file) {
          shareData.files = [file]
        }
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareUrl)
          alert('Link copied to clipboard!')
        } else {
          // Fallback for non-secure contexts
          const textArea = document.createElement('textarea')
          textArea.value = shareUrl
          textArea.style.position = 'fixed'
          textArea.style.left = '-9999px'
          document.body.appendChild(textArea)
          textArea.select()
          try {
            document.execCommand('copy')
            alert('Link copied to clipboard!')
          } catch (err) {
            console.error('Fallback copy failed:', err)
            alert('Failed to copy link. Please copy manually: ' + shareUrl)
          }
          document.body.removeChild(textArea)
        }
      }
    } catch (error: any) {
      console.error('Share error:', error)
      if (error.name !== 'AbortError') {
        alert('Failed to share. Link copied to clipboard instead.')
        const baseUrl = window.location.origin
        const shareUrl = `${baseUrl}?player=${player.id}`
        await navigator.clipboard.writeText(shareUrl)
      }
    } finally {
      setSharing(false)
    }
  }

  const handleCopyLink = async () => {
    if (!player) return
    const baseUrl = window.location.origin
    const shareUrl = `${baseUrl}?player=${player.id}`
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied to clipboard!')
      } else {
        // Fallback for non-secure contexts or older browsers
        const textArea = document.createElement('textarea')
        textArea.value = shareUrl
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          alert('Link copied to clipboard!')
        } catch (err) {
          console.error('Fallback copy failed:', err)
          alert('Failed to copy link. Please copy manually: ' + shareUrl)
        }
        document.body.removeChild(textArea)
      }
    } catch (error: any) {
      console.error('Copy error:', error)
      alert('Failed to copy link. Please copy manually: ' + shareUrl)
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
    skill_moves: 1,
    weak_foot: 1,
    vision: 50,
    work_rate: 50,
    stamina: 50,
    vote_count: 0,
  }

  const overall = Math.round(
    (stats.pace + stats.shooting + stats.passing + stats.dribbling + stats.defending + stats.physical) / 6
  )

  const mainStatBars = [
    { label: 'PAC', value: stats.pace, color: 'bg-green-500', textColor: 'text-green-500' },
    { label: 'SHO', value: stats.shooting, color: 'bg-red-500', textColor: 'text-red-500' },
    { label: 'PAS', value: stats.passing, color: 'bg-blue-500', textColor: 'text-blue-500' },
    { label: 'DRI', value: stats.dribbling, color: 'bg-yellow-500', textColor: 'text-yellow-500' },
    { label: 'DEF', value: stats.defending, color: 'bg-purple-500', textColor: 'text-purple-500' },
    { label: 'PHY', value: stats.physical, color: 'bg-orange-500', textColor: 'text-orange-500' },
  ]

  const extraStatBars = [
    { label: 'Vision', value: stats.vision, max: 99, color: 'bg-cyan-500', textColor: 'text-cyan-500' },
    { label: 'Stamina', value: stats.stamina, max: 99, color: 'bg-teal-500', textColor: 'text-teal-500' },
    { label: 'Touch', value: stats.touch, max: 99, color: 'bg-purple-500', textColor: 'text-purple-500' },
  ]

  const workRateLabels = ['Gio', 'Low', 'Medium', 'High']
  const mindsetLabels = ['Poor', 'Average', 'Elite']

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" accentColor={player.card_color || undefined}>
      <div className="flex flex-col gap-6">
        {/* Photo and basic info - side by side */}
        <div className="flex flex-row items-start gap-4">
          <div className="relative flex-shrink-0">
            {player.image_url ? (
              <img
                src={player.image_url}
                alt={player.name}
                className="w-36 h-36 sm:w-40 sm:h-40 object-cover rounded-2xl"
                style={{ border: `4px solid ${player.card_color || '#16a34a'}` }}
              />
            ) : (
              <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-gray-700 flex items-center justify-center text-5xl sm:text-6xl"
                   style={{ border: `4px solid ${player.card_color || '#16a34a'}` }}>
                ⚽
              </div>
            )}
          </div>
          
          <div className="flex flex-col justify-center pt-1 sm:pt-2 text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-2xl font-bold text-white">{player.name}</h3>
              {player.nationality && (
                <img
                  src={`https://flagcdn.com/24x18/${player.nationality.toLowerCase()}.png`}
                  alt={player.nationality}
                  className="w-5 h-3.5 sm:w-6 sm:h-4 object-cover rounded-sm"
                />
              )}
            </div>
            <div className="flex flex-wrap items-center text-gray-400 mt-1">
              <span className="text-base sm:text-lg font-bold text-green-500">#{player.player_number || '?'}</span>
              <span className="text-gray-500 mx-1">|</span>
              <span className="font-medium text-white">{player.primary_position}</span>
              {player.secondary_positions && player.secondary_positions.filter(p => p !== player.primary_position).length > 0 && (
                <>
                  <span className="text-gray-500 mx-1">/</span>
                  <span className="text-gray-400">{player.secondary_positions.filter(p => p !== player.primary_position).join(' / ')}</span>
                </>
              )}
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-300 w-16 sm:w-20">Skill Move</span>
                <span className="flex gap-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`text-sm sm:text-xl ${star <= Math.floor(Number(stats.skill_moves)) ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                  ))}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-300 w-16 sm:w-20">Weak Foot</span>
                <span className="flex gap-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`text-sm sm:text-xl ${star <= Math.floor(Number(stats.weak_foot)) ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats visualization */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold text-white">Core Stats</h4>
              <p className="text-xs text-gray-400">These stats determine the overall rating.</p>
            </div>
            <div className="text-right">
              {stats.vote_count > 0 && (
                <div className="text-xs sm:text-sm text-gray-500">
                  {stats.vote_count} rating{stats.vote_count !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          {mainStatBars.map((stat) => (
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

          <div className="border-t border-gray-700 pt-4 mt-4">
            <button
              onClick={() => setExtraStatsOpen(!extraStatsOpen)}
              className="w-full flex items-center justify-between mb-2"
            >
              <h4 className="text-lg font-bold text-white">Extra Stats</h4>
              <span className={`text-gray-400 transition-transform duration-200 ${extraStatsOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            <p className="text-xs text-gray-400 mb-4">These do not affect the overall rating.</p>
            {extraStatsOpen && (
              <>
                {extraStatBars.map((stat) => {
                  const max = stat.max || 99
                  const displayValue = Number(stat.value)
                  return (
                    <div key={stat.label} className="mb-3 last:mb-0">
                      <div className="flex justify-between mb-1">
                        <span className={`font-bold text-sm ${stat.textColor}`}>{stat.label}</span>
                        <span className={`font-bold text-sm ${stat.textColor}`}>{stat.value}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className={`${stat.color} h-3 rounded-full transition-all duration-500`}
                          style={{ width: `${(displayValue / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-sm text-white">Work Rate</span>
                  </div>
                  <SegmentedBar
                    value={stats.work_rate}
                    onChange={() => {}}
                    segments={4}
                    labels={workRateLabels}
                    disabled
                    showLabels={false}
                  />
                </div>
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-sm text-white">Mindset</span>
                  </div>
                  <SegmentedBar
                    value={stats.mindset}
                    onChange={() => {}}
                    segments={3}
                    labels={mindsetLabels}
                    disabled
                    showLabels={false}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Performance Stats */}
        <div className="space-y-3 border-t border-gray-700 pt-4">
          <button
            onClick={() => setPerformanceStatsOpen(!performanceStatsOpen)}
            className="w-full flex items-center justify-between"
          >
            <h4 className="text-lg font-bold text-white">Performance Stats</h4>
            <span className={`text-gray-400 transition-transform duration-200 ${performanceStatsOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          {performanceStatsOpen && (
            <>
              {statsSummary ? (
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
                    <p className="text-gray-400 text-xs">Goals (Week)</p>
                    <p className="text-xl font-bold text-green-400">{statsSummary.goals_last_week}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Assists (Week)</p>
                    <p className="text-xl font-bold text-blue-400">{statsSummary.assists_last_week}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Goals (Month)</p>
                    <p className="text-xl font-bold text-green-400">{statsSummary.goals_last_month}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Assists (Month)</p>
                    <p className="text-xl font-bold text-blue-400">{statsSummary.assists_last_month}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">Please add goals and assists to the stats tracker to see analytics</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-700 space-y-2">
          {onVote && (
            <Button
              onClick={onVote}
              className="w-full"
              title="Rate Player"
            >
              <Star size={16} className="mr-2" />
              Rate Player
            </Button>
          )}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={handleShare}
              disabled={sharing}
              variant="outline"
              className="flex-1"
              title="Share Player Card"
            >
              <Share2 size={16} className="mr-2" />
              Share
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="flex-1"
              title="Copy Link"
            >
              <Copy size={16} className="mr-2" />
              Copy
            </Button>
            {isOwnPlayer && (
              <Button
                onClick={() => setEditingColor(!editingColor)}
                variant="outline"
                className="flex-1"
                title="Change Card Color"
              >
                <Palette size={16} className="mr-2" />
                Color
              </Button>
            )}
          </div>

          {editingColor && isOwnPlayer && (
            <div className="mt-3 space-y-3">
              <label className="block text-sm font-medium text-white">Card Shadow Color</label>
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
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveColor} disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button onClick={() => setEditingColor(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden card for image capture */}
        <div className="fixed -left-[9999px] top-0">
          <div ref={cardRef} className="w-[300px]">
            <PlayerCard player={player} />
          </div>
        </div>
      </div>
    </Modal>
  )
}
