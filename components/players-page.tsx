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

      {players.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚽</div>
          <h3 className="text-xl font-semibold mb-2">No Players Yet</h3>
          <p className="text-gray-400">Sign in and create your player profile to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {players.map((player) => (
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
