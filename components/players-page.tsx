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
  const [previousVote, setPreviousVote] = useState<any>(null)
  const [showPreviousRating, setShowPreviousRating] = useState(false)
  const [voteStats, setVoteStats] = useState({
    pace: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defending: 50,
    physical: 50,
    skill_moves: 3,
    weak_foot: 3,
    vision: 50,
    work_rate: 50,
    stamina: 50,
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
            skill_moves: 1,
            weak_foot: 1,
            vision: 50,
            work_rate: 50,
            stamina: 50,
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
        skill_moves: voteStats.skill_moves,
        weak_foot: voteStats.weak_foot,
        vision: voteStats.vision,
        work_rate: voteStats.work_rate,
        stamina: voteStats.stamina,
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
            skill_moves: voteStats.skill_moves,
            weak_foot: voteStats.weak_foot,
            vision: voteStats.vision,
            work_rate: voteStats.work_rate,
            stamina: voteStats.stamina,
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

  const openVoteModal = async (player: PlayerWithStats) => {
    setSelectedPlayer(player)
    
    const { data: { user } } = await supabase.auth.getUser()
    let previousVoteData = null
    if (user) {
      const { data } = await supabase
        .from('stat_votes')
        .select('*')
        .eq('voter_id', user.id)
        .eq('player_id', player.id)
        .single()
      previousVoteData = data
    }
    
    setPreviousVote(previousVoteData)
    setVoteStats({
      pace: previousVoteData?.pace ?? 50,
      shooting: previousVoteData?.shooting ?? 50,
      passing: previousVoteData?.passing ?? 50,
      dribbling: previousVoteData?.dribbling ?? 50,
      defending: previousVoteData?.defending ?? 50,
      physical: previousVoteData?.physical ?? 50,
      skill_moves: previousVoteData?.skill_moves ?? 3,
      weak_foot: previousVoteData?.weak_foot ?? 3,
      vision: previousVoteData?.vision ?? 50,
      work_rate: previousVoteData?.work_rate ?? 50,
      stamina: previousVoteData?.stamina ?? 50,
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

  const getWorkRateLabel = (value: number) => {
    if (value <= 33) return 'Low'
    if (value <= 66) return 'Medium'
    return 'High'
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
        case 'vision':
          comparison = a.stats.vision - b.stats.vision
          break
        case 'work_rate':
          comparison = a.stats.work_rate - b.stats.work_rate
          break
        case 'stamina':
          comparison = a.stats.stamina - b.stats.stamina
          break
        case 'skill_moves':
          comparison = a.stats.skill_moves - b.stats.skill_moves
          break
        case 'weak_foot':
          comparison = a.stats.weak_foot - b.stats.weak_foot
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
          <option value="vision">Vision</option>
          <option value="work_rate">Work Rate</option>
          <option value="stamina">Stamina</option>
          <option value="skill_moves">Skill Moves</option>
          <option value="weak_foot">Weak Foot</option>
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
      <Modal isOpen={showVoteModal} onClose={() => setShowVoteModal(false)} title="">
        {selectedPlayer && (
          <form onSubmit={handleVote} className="space-y-4">
            <div className="text-center mb-2">
              <div className="text-lg font-semibold text-white">Rate Player: {selectedPlayer.name}</div>
            </div>

            {/* Your Previous Rating Display - Collapsible */}
            {previousVote && (
              <div className="border-t border-gray-700 pt-3 mt-3">
                <button
                  type="button"
                  onClick={() => setShowPreviousRating(!showPreviousRating)}
                  className="w-full flex items-center justify-between mb-2"
                >
                  <h4 className="text-sm font-semibold text-white">Your Previous Rating</h4>
                  <span className={`text-gray-400 transition-transform duration-200 ${showPreviousRating ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {showPreviousRating && (
                  <div className="bg-gray-800/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center">
                      <div className="text-center px-4">
                        <span className="text-xs text-gray-400">OVR</span>
                        <div className="text-4xl font-bold text-white">
                          {Math.round((previousVote.pace + previousVote.shooting + previousVote.passing + previousVote.dribbling + previousVote.defending + previousVote.physical) / 6)}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-0 text-center flex-1">
                        <div className="pr-0">
                          <span className="text-xs text-gray-400">PAC</span>
                          <div className="text-sm font-bold text-green-400">{previousVote.pace}</div>
                        </div>
                        <div className="pr-0">
                          <span className="text-xs text-gray-400">SHO</span>
                          <div className="text-sm font-bold text-red-400">{previousVote.shooting}</div>
                        </div>
                        <div className="pr-0">
                          <span className="text-xs text-gray-400">PAS</span>
                          <div className="text-sm font-bold text-blue-400">{previousVote.passing}</div>
                        </div>
                        <div className="pr-0">
                          <span className="text-xs text-gray-400">DRI</span>
                          <div className="text-sm font-bold text-yellow-400">{previousVote.dribbling}</div>
                        </div>
                        <div className="pr-0">
                          <span className="text-xs text-gray-400">DEF</span>
                          <div className="text-sm font-bold text-purple-400">{previousVote.defending}</div>
                        </div>
                        <div className="pr-0">
                          <span className="text-xs text-gray-400">PHY</span>
                          <div className="text-sm font-bold text-orange-400">{previousVote.physical}</div>
                        </div>
                        <div className="pr-0">
                          <span className="text-xs text-gray-400">VIS</span>
                          <div className="text-sm font-bold text-cyan-400">{previousVote.vision}</div>
                        </div>
                        <div className="pr-0">
                          <span className="text-xs text-gray-400">STA</span>
                          <div className="text-sm font-bold text-teal-400">{previousVote.stamina}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {([
              { key: 'pace', label: 'Pace' },
              { key: 'shooting', label: 'Shooting' },
              { key: 'passing', label: 'Passing' },
              { key: 'dribbling', label: 'Dribbling' },
              { key: 'defending', label: 'Defending' },
              { key: 'physical', label: 'Physical' },
              { key: 'vision', label: 'Vision' },
              { key: 'work_rate', label: 'Work Rate' },
              { key: 'stamina', label: 'Stamina' },
            ] as const).map((stat) => {
              const delta = previousVote ? voteStats[stat.key] - previousVote[stat.key] : 0
              const showDelta = previousVote && delta !== 0
              return (
                <div key={stat.key}>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium capitalize text-white">{stat.label}</label>
                    <span className="text-sm font-bold flex items-center gap-1 text-white">
                      {voteStats[stat.key]}
                      {showDelta && (
                        <span className={delta > 0 ? 'text-green-400' : 'text-red-400'}>
                          {delta > 0 ? '↑' : '↓'}{Math.abs(delta)}
                        </span>
                      )}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="99"
                    value={voteStats[stat.key]}
                    onChange={(e) => setVoteStats({ ...voteStats, [stat.key]: parseInt(e.target.value) })}
                    className="w-full accent-primary"
                  />
                </div>
              )
            })}

            <div className="grid grid-cols-2 gap-4">
              {([
                { key: 'skill_moves' as const, label: 'Skill Moves', color: 'text-yellow-400' },
                { key: 'weak_foot' as const, label: 'Weak Foot', color: 'text-yellow-400' },
              ]).map((stat) => (
                <div key={stat.key}>
                  <label className="text-sm font-medium block mb-2 text-center text-white">{stat.label}</label>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const currentValue = voteStats[stat.key]
                      const filled = star <= Math.floor(currentValue)
                      const half = !filled && star === Math.ceil(currentValue) && currentValue % 1 >= 0.5
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setVoteStats({ ...voteStats, [stat.key]: star })}
                          onDoubleClick={() => setVoteStats({ ...voteStats, [stat.key]: star - 0.5 })}
                          className={`text-3xl transition-colors duration-150 ${
                            filled || half ? stat.color : 'text-gray-600'
                          } hover:scale-110 hover:opacity-80`}
                          title={`${star} star${star > 1 ? 's' : ''}${star > 1 ? ' (double-click for half)' : ''}`}
                        >
                          {filled ? '★' : half ? '★' : '☆'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

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
