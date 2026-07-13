'use client'

import { useState, useEffect } from 'react'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { createClient } from '@/lib/supabase/client'
import { PlayerWithStats, Game } from '@/lib/types'
import { Shuffle, Crown } from 'lucide-react'

interface TeamPickerModalProps {
  isOpen: boolean
  onClose: () => void
  game: Game | null
  onTeamsSaved?: () => void
}

export function TeamPickerModal({ isOpen, onClose, game, onTeamsSaved }: TeamPickerModalProps) {
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [teams, setTeams] = useState<{ teamA: PlayerWithStats[]; teamB: PlayerWithStats[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchPlayers()
      if (game) {
        fetchExistingParticipants()
      } else {
        setSelectedPlayers([])
        setTeams(null)
      }
    }
  }, [isOpen, game])

  const fetchPlayers = async () => {
    setLoading(true)
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
          skill_moves: 1,
          weak_foot: 1,
          vision: 50,
          work_rate: 50,
          stamina: 50,
          touch: 50,
          mindset: 2,
          vote_count: 0,
        },
      })) || []

      setPlayers(playersWithStats)
    } catch (error) {
      console.error('Error fetching players:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingParticipants = async () => {
    if (!game) return

    try {
      const { data, error } = await supabase
        .from('game_participants')
        .select('player_id, team')
        .eq('game_id', game.id)

      if (error) throw error

      if (data && data.length > 0) {
        const participantIds = data.map(p => p.player_id)
        setSelectedPlayers(participantIds)

        // Build teams from existing participants
        const teamA = data.filter(p => p.team === 'team_a').map(p => p.player_id)
        const teamB = data.filter(p => p.team === 'team_b').map(p => p.player_id)

        if (teamA.length > 0 || teamB.length > 0) {
          const allPlayers = await fetchAllPlayers()
          const teamAPlayers = allPlayers.filter(p => teamA.includes(p.id))
          const teamBPlayers = allPlayers.filter(p => teamB.includes(p.id))
          setTeams({ teamA: teamAPlayers, teamB: teamBPlayers })
        }
      }
    } catch (error) {
      console.error('Error fetching participants:', error)
    }
  }

  const fetchAllPlayers = async () => {
    const { data } = await supabase
      .from('players')
      .select('*, player_stats(*)')
    
    return data?.map((player: any) => ({
      ...player,
      stats: player.player_stats || {
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
        touch: 50,
        mindset: 2,
        vote_count: 0,
      },
    })) || []
  }

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  const selectAllPlayers = () => {
    setSelectedPlayers(players.map(p => p.id))
  }

  const deselectAllPlayers = () => {
    setSelectedPlayers([])
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
      teamA: shuffled.slice(0, mid),
      teamB: shuffled.slice(mid),
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

    const teamA = [captain1]
    const teamB = [captain2]

    remaining.forEach((player, index) => {
      if (index % 2 === 0) {
        teamA.push(player)
      } else {
        teamB.push(player)
      }
    })

    setTeams({ teamA, teamB })
  }

  const saveTeams = async () => {
    if (!game || !teams) {
      alert('Please generate teams first!')
      return
    }

    setSaving(true)
    try {
      // Delete existing participants for this game
      await supabase
        .from('game_participants')
        .delete()
        .eq('game_id', game.id)

      // Insert new participants
      const teamAParticipants = teams.teamA.map(p => ({
        game_id: game.id,
        player_id: p.id,
        team: 'team_a' as const,
      }))

      const teamBParticipants = teams.teamB.map(p => ({
        game_id: game.id,
        player_id: p.id,
        team: 'team_b' as const,
      }))

      const { error } = await supabase
        .from('game_participants')
        .insert([...teamAParticipants, ...teamBParticipants])

      if (error) throw error

      if (onTeamsSaved) onTeamsSaved()
      onClose()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const awardMotmBoosts = async () => {
    if (!game || !teams) return

    try {
      // Get all votes for this game
      const { data: votes, error: voteError } = await supabase
        .from('motm_votes')
        .select('*')
        .eq('game_id', game.id)

      if (voteError) throw voteError

      if (!votes || votes.length === 0) {
        alert('No votes cast yet!')
        return
      }

      // Count votes per player
      const voteCounts: Record<string, number> = {}
      votes.forEach((vote: any) => {
        voteCounts[vote.candidate_id] = (voteCounts[vote.candidate_id] || 0) + 1
      })

      // Find max votes
      const maxVotes = Math.max(...Object.values(voteCounts))
      
      // Find all players with max votes (handle ties)
      const winners = Object.entries(voteCounts)
        .filter(([_, count]) => count === maxVotes)
        .map(([playerId, _]) => playerId)

      // Award boosts to winners
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 3)

      for (const winnerId of winners) {
        // Check if player already has an active boost from this game
        const { data: existingBoost } = await supabase
          .from('motm_boosts')
          .select('*')
          .eq('player_id', winnerId)
          .eq('game_id', game.id)
          .single()

        if (existingBoost) {
          // Extend existing boost
          const newExpiresAt = new Date(existingBoost.expires_at)
          newExpiresAt.setDate(newExpiresAt.getDate() + 3)
          
          await supabase
            .from('motm_boosts')
            .update({ expires_at: newExpiresAt.toISOString() })
            .eq('id', existingBoost.id)
        } else {
          // Create new boost
          await supabase
            .from('motm_boosts')
            .insert({
              player_id: winnerId,
              game_id: game.id,
              boost_amount: 10,
              expires_at: expiresAt.toISOString(),
            })
        }
      }

      // Mark game as completed
      await supabase
        .from('games')
        .update({ status: 'completed' })
        .eq('id', game.id)

      alert(`MOTM awarded to ${winners.length} player(s)!`)
      if (onTeamsSaved) onTeamsSaved()
      onClose()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase()
    if (['ST', 'CF', 'LW', 'RW'].includes(pos)) return 'bg-red-500'
    if (['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(pos)) return 'bg-green-500'
    if (['CB', 'LB', 'RB'].includes(pos)) return 'bg-purple-500'
    if (pos === 'GK') return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={game ? `Pick Teams: ${game.title}` : 'Pick Teams'}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-white">Select Players</h3>
          
          {loading ? (
            <p className="text-gray-400">Loading players...</p>
          ) : players.length === 0 ? (
            <p className="text-gray-400">No players available. Add players first!</p>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <Button onClick={selectAllPlayers} variant="outline" size="sm" className="flex-1">
                  Select All
                </Button>
                <Button onClick={deselectAllPlayers} variant="outline" size="sm" className="flex-1">
                  Deselect All
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {players.map(player => (
                  <label key={player.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(player.id)}
                      onChange={() => togglePlayer(player.id)}
                      className="w-4 h-4 accent-green-600"
                    />
                    <span className="flex-1 text-white">{player.name}</span>
                    <span className={`text-xs px-2 py-1 rounded text-white font-bold ${getPositionColor(player.primary_position)}`}>
                      {player.primary_position}
                    </span>
                    <span className="font-bold text-green-500">{getOverallRating(player.stats)}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          <div className="flex gap-2 mt-4">
            <Button onClick={randomTeams} className="flex-1" disabled={selectedPlayers.length < 2}>
              <Shuffle size={16} className="mr-2" />
              Random
            </Button>
            <Button onClick={captainMode} variant="secondary" className="flex-1" disabled={selectedPlayers.length < 4}>
              <Crown size={16} className="mr-2" />
              Captain
            </Button>
          </div>
        </div>

        {teams && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 border-2 border-green-600">
                <h4 className="text-lg font-bold mb-2 text-white">Team A</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {teams.teamA.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-gray-700 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{player.name}</span>
                        <span className={`text-xs px-2 py-1 rounded text-white font-bold ${getPositionColor(player.primary_position)}`}>
                          {player.primary_position}
                        </span>
                      </div>
                      <span className="font-bold text-green-500">{getOverallRating(player.stats)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border-2 border-green-700">
                <h4 className="text-lg font-bold mb-2 text-white">Team B</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {teams.teamB.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-gray-700 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{player.name}</span>
                        <span className={`text-xs px-2 py-1 rounded text-white font-bold ${getPositionColor(player.primary_position)}`}>
                          {player.primary_position}
                        </span>
                      </div>
                      <span className="font-bold text-green-500">{getOverallRating(player.stats)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-700">
              <Button onClick={saveTeams} className="flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save Teams'}
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
