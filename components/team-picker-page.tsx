'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlayerWithStats } from '@/lib/types'
import { Button } from './ui/button'
import { Shuffle, Crown } from 'lucide-react'

export function TeamPickerPage() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [teams, setTeams] = useState<{ team1: PlayerWithStats[]; team2: PlayerWithStats[] } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          player_stats(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const playersWithStats = data?.map((player: any) => ({
        ...player,
        stats: player.player_stats || {
          pace: 50,
          shooting: 50,
          passing: 50,
          dribbling: 50,
          defending: 50,
          physical: 50,
          vote_count: 0,
        },
      })) || []

      setPlayers(playersWithStats)
    } catch (error) {
      console.error('Error fetching players:', error)
    }
  }

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  const getOverallRating = (stats: any) => {
    return Math.round(
      (stats.pace + stats.shooting + stats.passing + stats.dribbling + stats.defending + stats.physical) / 6
    )
  }

  const randomTeams = () => {
    if (selectedPlayers.length < 2) {
      alert('Please select at least 2 players!')
      return
    }

    const selected = players.filter(p => selectedPlayers.includes(p.id))
    const shuffled = [...selected].sort(() => Math.random() - 0.5)
    const mid = Math.ceil(shuffled.length / 2)

    setTeams({
      team1: shuffled.slice(0, mid),
      team2: shuffled.slice(mid),
    })
  }

  const captainMode = () => {
    if (selectedPlayers.length < 4) {
      alert('Please select at least 4 players for captain mode!')
      return
    }

    const selected = players.filter(p => selectedPlayers.includes(p.id))
    const sorted = [...selected].sort((a, b) => getOverallRating(b.stats) - getOverallRating(a.stats))

    const captain1 = sorted[0]
    const captain2 = sorted[1]
    const remaining = sorted.slice(2)

    const team1 = [captain1]
    const team2 = [captain2]

    remaining.forEach((player, index) => {
      if (index % 2 === 0) {
        team1.push(player)
      } else {
        team2.push(player)
      }
    })

    setTeams({ team1, team2 })
  }

  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase()
    if (['ST', 'CF', 'LW', 'RW'].includes(pos)) return 'bg-red-500'
    if (['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(pos)) return 'bg-green-500'
    if (['CB', 'LB', 'RB'].includes(pos)) return 'bg-blue-500'
    if (pos === 'GK') return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  return (
    <div className="pb-20 space-y-6">
      <h2 className="text-2xl font-bold">Team Selection</h2>

      <div className="bg-card rounded-xl p-6 border border-gray-600">
        <h3 className="text-lg font-semibold mb-4">Select Players for Game</h3>
        
        {players.length === 0 ? (
          <p className="text-gray-400">No players available. Add players first!</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {players.map(player => (
              <label key={player.id} className="flex items-center gap-3 p-2 rounded hover:bg-background cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPlayers.includes(player.id)}
                  onChange={() => togglePlayer(player.id)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="flex-1">{player.name}</span>
                <span className={`text-xs px-2 py-1 rounded text-white font-bold ${getPositionColor(player.primary_position)}`}>
                  {player.primary_position}
                </span>
                <span className="font-bold text-primary">{getOverallRating(player.stats)}</span>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button onClick={randomTeams} className="flex-1">
            <Shuffle size={20} className="mr-2" />
            Random Teams
          </Button>
          <Button onClick={captainMode} variant="secondary" className="flex-1">
            <Crown size={20} className="mr-2" />
            Captain Mode
          </Button>
        </div>
      </div>

      {teams && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl p-6 border-2 border-primary">
            <h3 className="text-xl font-bold mb-2">Team 1</h3>
            <p className="text-sm text-gray-400 mb-4">
              Avg: {Math.round(teams.team1.reduce((sum, p) => sum + getOverallRating(p.stats), 0) / teams.team1.length)}
            </p>
            <div className="space-y-2">
              {teams.team1.map(player => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-background rounded">
                  <span className="font-semibold">{player.name}</span>
                  <span className={`text-xs px-2 py-1 rounded text-white font-bold ${getPositionColor(player.primary_position)}`}>
                    {player.primary_position}
                  </span>
                  <span className="font-bold text-primary">{getOverallRating(player.stats)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border-2 border-secondary">
            <h3 className="text-xl font-bold mb-2">Team 2</h3>
            <p className="text-sm text-gray-400 mb-4">
              Avg: {Math.round(teams.team2.reduce((sum, p) => sum + getOverallRating(p.stats), 0) / teams.team2.length)}
            </p>
            <div className="space-y-2">
              {teams.team2.map(player => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-background rounded">
                  <span className="font-semibold">{player.name}</span>
                  <span className={`text-xs px-2 py-1 rounded text-white font-bold ${getPositionColor(player.primary_position)}`}>
                    {player.primary_position}
                  </span>
                  <span className="font-bold text-secondary">{getOverallRating(player.stats)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
