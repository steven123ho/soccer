'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlayerWithStats } from '@/lib/types'
import { PlayerCard } from './player-card'
import { PlayerDetailModal } from './player-detail-modal'
import { Button } from './ui/button'
import { Modal } from './ui/modal'

export function PlayersPage() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithStats | null>(null)
  const [voteStats, setVoteStats] = useState({
    pace: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defending: 50,
    physical: 50,
  })
  const [currentUserPlayerId, setCurrentUserPlayerId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('overall')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          player_stats(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('Fetched players data:', data)

      const playersWithStats = data?.map((player: any) => {
        console.log('Player stats for', player.name, ':', player.player_stats)
        return {
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
        }
      }) || []

      console.log('Players with stats:', playersWithStats)

      setPlayers(playersWithStats)
      
      // Set current user's player ID
      if (user) {
        const currentUserPlayer = playersWithStats.find((p: any) => p.user_id === user.id)
        setCurrentUserPlayerId(currentUserPlayer?.id || null)
      }
    } catch (error) {
      console.error('Error fetching players:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      if (!selectedPlayer) throw new Error('No player selected')

      // Try insert first
      const { error: insertError } = await supabase.from('stat_votes').insert({
        id: crypto.randomUUID(),
        voter_id: user.id,
        player_id: selectedPlayer.id,
        pace: voteStats.pace,
        shooting: voteStats.shooting,
        passing: voteStats.passing,
        dribbling: voteStats.dribbling,
        defending: voteStats.defending,
        physical: voteStats.physical,
      })

      // If insert fails due to unique constraint, update instead
      if (insertError && insertError.code === '23505') {
        const { error: updateError } = await supabase
          .from('stat_votes')
          .update({
            pace: voteStats.pace,
            shooting: voteStats.shooting,
            passing: voteStats.passing,
            dribbling: voteStats.dribbling,
            defending: voteStats.defending,
            physical: voteStats.physical,
          })
          .eq('voter_id', user.id)
          .eq('player_id', selectedPlayer.id)

        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }
      } else if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }

      setShowVoteModal(false)
      
      // Wait a moment for the trigger to update stats
      await new Promise(resolve => setTimeout(resolve, 500))
      
      fetchPlayers()
    } catch (error: any) {
      console.error('Error submitting vote:', error)
      alert(`Failed to submit vote: ${error.message}`)
    }
  }

  const openDetailModal = (player: PlayerWithStats) => {
    setSelectedPlayer(player)
    setShowDetailModal(true)
  }

  const openVoteModal = (player: PlayerWithStats) => {
    setSelectedPlayer(player)
    setVoteStats({
      pace: player.stats.pace,
      shooting: player.stats.shooting,
      passing: player.stats.passing,
      dribbling: player.stats.dribbling,
      defending: player.stats.defending,
      physical: player.stats.physical,
    })
    setShowVoteModal(true)
  }

  const getPositionCategory = (position: string) => {
    const pos = position.toUpperCase()
    if (['GK'].includes(pos)) return 'goalkeeper'
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return 'defender'
    if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'midfielder'
    if (['ST', 'CF', 'LW', 'RW'].includes(pos)) return 'attacker'
    return 'midfielder'
  }

  const sortPlayers = (players: PlayerWithStats[]) => {
    const sorted = [...players].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'overall':
          const overallA = Math.round((a.stats.pace + a.stats.shooting + a.stats.passing + a.stats.dribbling + a.stats.defending + a.stats.physical) / 6)
          const overallB = Math.round((b.stats.pace + b.stats.shooting + b.stats.passing + b.stats.dribbling + b.stats.defending + b.stats.physical) / 6)
          comparison = overallA - overallB
          break
        case 'pace':
          comparison = a.stats.pace - b.stats.pace
          break
        case 'shooting':
          comparison = a.stats.shooting - b.stats.shooting
          break
        case 'passing':
          comparison = a.stats.passing - b.stats.passing
          break
        case 'dribbling':
          comparison = a.stats.dribbling - b.stats.dribbling
          break
        case 'defending':
          comparison = a.stats.defending - b.stats.defending
          break
        case 'physical':
          comparison = a.stats.physical - b.stats.physical
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'position':
          const positionOrder = { goalkeeper: 0, defender: 1, midfielder: 2, attacker: 3 }
          const posA = getPositionCategory(a.primary_position)
          const posB = getPositionCategory(b.primary_position)
          comparison = positionOrder[posA as keyof typeof positionOrder] - positionOrder[posB as keyof typeof positionOrder]
          break
        default:
          comparison = 0
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return sorted
  }

  const sortedPlayers = sortPlayers(players)

  const filteredPlayers = sortedPlayers.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading players...</div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">My Squad</h2>
      </div>

      {/* Sort Controls */}
      <div className="mb-6 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-green-500 flex-1 min-w-[200px]"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-green-500"
        >
          <option value="overall">Overall</option>
          <option value="pace">Pace</option>
          <option value="shooting">Shooting</option>
          <option value="passing">Passing</option>
          <option value="dribbling">Dribbling</option>
          <option value="defending">Defending</option>
          <option value="physical">Physical</option>
          <option value="name">Name</option>
          <option value="position">Position</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
        >
          {sortOrder === 'desc' ? '↓ High to Low' : '↑ Low to High'}
        </button>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚽</div>
          <h3 className="text-xl font-semibold mb-2">No Players Yet</h3>
          <p className="text-gray-400">Sign in and create your player profile to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-6 lg:gap-8">
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onClick={() => openDetailModal(player)}
            />
          ))}
        </div>
      )}

      {/* Player Detail Modal */}
      <PlayerDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        player={selectedPlayer}
        onVote={() => {
          setShowDetailModal(false)
          openVoteModal(selectedPlayer!)
        }}
        currentUserPlayerId={currentUserPlayerId}
        onColorChange={() => fetchPlayers()}
      />

      {/* Vote Modal */}
      <Modal isOpen={showVoteModal} onClose={() => setShowVoteModal(false)} title="Rate Player Stats">
        {selectedPlayer && (
          <form onSubmit={handleVote} className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-lg font-semibold">Rating {selectedPlayer.name}</div>
            </div>

            {(['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const).map((stat) => (
              <div key={stat}>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium capitalize">{stat}</label>
                  <span className="text-sm font-bold">{voteStats[stat]}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="99"
                  value={voteStats[stat]}
                  onChange={(e) => setVoteStats({ ...voteStats, [stat]: parseInt(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
            ))}

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">Submit Vote</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVoteModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
