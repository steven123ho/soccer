'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlayerWithStats } from '@/lib/types'
import { PlayerCard } from './player-card'
import { PlayerDetailModal } from './player-detail-modal'
import { Button } from './ui/button'
import { Modal } from './ui/modal'
import { SegmentedBar } from './ui/segmented-bar'

export function PlayersPage({ initialPlayerId }: { initialPlayerId?: string }) {
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [generatedCards, setGeneratedCards] = useState<any[]>([])
  const [motmBoosts, setMotmBoosts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithStats | null>(null)
  const [selectedGeneratedCard, setSelectedGeneratedCard] = useState<any | null>(null)
  const [previousVote, setPreviousVote] = useState<any>(null)
  const [showPreviousRating, setShowPreviousRating] = useState(true)
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
    work_rate: 2,
    stamina: 50,
    touch: 50,
    mindset: 2,
  })
  const [currentUserPlayerId, setCurrentUserPlayerId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('overall')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  const fetchMotmBoosts = async () => {
    try {
      const { data, error } = await supabase
        .from('motm_boosts')
        .select('player_id, boost_amount')
        .gt('expires_at', new Date().toISOString())

      if (error) throw error

      // Aggregate boosts by player
      const boostsMap: Record<string, number> = {}
      data?.forEach(boost => {
        boostsMap[boost.player_id] = (boostsMap[boost.player_id] || 0) + boost.boost_amount
      })

      setMotmBoosts(boostsMap)
    } catch (error) {
      console.error('Error fetching MOTM boosts:', error)
    }
  }

  useEffect(() => {
    fetchPlayers()
    fetchGeneratedCards()
  }, [])

  useEffect(() => {
    if (initialPlayerId && players.length > 0) {
      const player = players.find(p => p.id === initialPlayerId)
      if (player) {
        setSelectedPlayer(player)
        setShowDetailModal(true)
      }
    }
  }, [initialPlayerId, players])

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
            touch: 50,
            mindset: 2,
            vote_count: 0,
          },
        }
      }) || []

      console.log('Players with stats:', playersWithStats)

      setPlayers(playersWithStats)
      
      // Fetch MOTM boosts
      await fetchMotmBoosts()
      
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

  const fetchGeneratedCards = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_cards')
        .select(`
          *,
          generated_stats(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('Fetched generated cards:', data)

      const cardsWithStats = data?.map((card: any) => ({
        ...card,
        stats: card.generated_stats || {
          pace: 50,
          shooting: 50,
          passing: 50,
          dribbling: 50,
          defending: 50,
          physical: 50,
          touch: 50,
          mindset: 2,
          vote_count: 0,
        },
        creator_name: card.creator_name || 'Unknown',
      })) || []

      console.log('Cards with stats:', cardsWithStats)
      setGeneratedCards(cardsWithStats)
    } catch (error) {
      console.error('Error fetching generated cards:', error)
    }
  }

  const handleVote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      if (!selectedPlayer && !selectedGeneratedCard) throw new Error('No player/card selected')

      const isGeneratedCard = !!selectedGeneratedCard
      const target = isGeneratedCard ? selectedGeneratedCard : selectedPlayer

      // Validate all stats are within valid ranges and ensure integers
      const validatedVoteStats = {
        pace: Number(Math.max(1, Math.min(99, voteStats.pace || 50))),
        shooting: Number(Math.max(1, Math.min(99, voteStats.shooting || 50))),
        passing: Number(Math.max(1, Math.min(99, voteStats.passing || 50))),
        dribbling: Number(Math.max(1, Math.min(99, voteStats.dribbling || 50))),
        defending: Number(Math.max(1, Math.min(99, voteStats.defending || 50))),
        physical: Number(Math.max(1, Math.min(99, voteStats.physical || 50))),
        skill_moves: Number(Math.max(1, Math.min(5, voteStats.skill_moves || 3))),
        weak_foot: Number(Math.max(1, Math.min(5, voteStats.weak_foot || 3))),
        vision: Number(Math.max(1, Math.min(99, voteStats.vision || 50))),
        work_rate: Number(Math.max(1, Math.min(4, voteStats.work_rate || 2))),
        stamina: Number(Math.max(1, Math.min(99, voteStats.stamina || 50))),
        touch: Number(Math.max(1, Math.min(99, voteStats.touch || 50))),
        mindset: Number(Math.max(1, Math.min(3, voteStats.mindset || 2))),
      }

      const tableName = isGeneratedCard ? 'generated_stat_votes' : 'stat_votes'
      const cardIdField = isGeneratedCard ? 'generated_card_id' : 'player_id'

      // Try insert first
      const { error: insertError } = await supabase.from(tableName).insert({
        voter_id: user.id,
        [cardIdField]: target.id,
        pace: validatedVoteStats.pace,
        shooting: validatedVoteStats.shooting,
        passing: validatedVoteStats.passing,
        dribbling: validatedVoteStats.dribbling,
        defending: validatedVoteStats.defending,
        physical: validatedVoteStats.physical,
        skill_moves: validatedVoteStats.skill_moves,
        weak_foot: validatedVoteStats.weak_foot,
        vision: validatedVoteStats.vision,
        work_rate: validatedVoteStats.work_rate,
        stamina: validatedVoteStats.stamina,
        touch: validatedVoteStats.touch,
        mindset: validatedVoteStats.mindset,
      })

      // If insert fails due to unique constraint, update instead
      if (insertError) {
        console.log('Insert failed, trying update:', insertError.code)
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            pace: validatedVoteStats.pace,
            shooting: validatedVoteStats.shooting,
            passing: validatedVoteStats.passing,
            dribbling: validatedVoteStats.dribbling,
            defending: validatedVoteStats.defending,
            physical: validatedVoteStats.physical,
            skill_moves: validatedVoteStats.skill_moves,
            weak_foot: validatedVoteStats.weak_foot,
            vision: validatedVoteStats.vision,
            work_rate: validatedVoteStats.work_rate,
            stamina: validatedVoteStats.stamina,
            touch: validatedVoteStats.touch,
            mindset: validatedVoteStats.mindset,
          })
          .eq('voter_id', user.id)
          .eq(cardIdField, target.id)

        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }
      }

      setShowVoteModal(false)
      
      console.log('Vote submitted, updating stats for:', isGeneratedCard ? 'generated card' : 'player', target.id)
      
      // Use RPC function to calculate and update stats based on all votes
      const rpcFunction = isGeneratedCard ? 'update_single_generated_card_stats' : 'update_single_player_stats'
      const rpcParam = isGeneratedCard ? 'card_id' : 'player_id_param'
      console.log('Calling RPC:', rpcFunction, 'with param:', rpcParam, '=', target.id)
      
      const { data: rpcData, error: rpcError } = await supabase.rpc(rpcFunction, { [rpcParam]: target.id })
      
      console.log('RPC result:', rpcError || 'success', 'data:', rpcData)
      
      if (rpcError) {
        console.error('RPC error:', rpcError)
        // Fallback: manually calculate average if RPC fails
        console.log('Using fallback manual calculation')
        const { data: votes } = await supabase
          .from(tableName)
          .select('*')
          .eq(cardIdField, target.id)
        
        console.log('Votes for calculation:', votes?.length)
        
        if (votes && votes.length > 0) {
          const avgStats = votes.reduce((acc: any, vote: any) => ({
            pace: acc.pace + vote.pace,
            shooting: acc.shooting + vote.shooting,
            passing: acc.passing + vote.passing,
            dribbling: acc.dribbling + vote.dribbling,
            defending: acc.defending + vote.defending,
            physical: acc.physical + vote.physical,
            skill_moves: acc.skill_moves + vote.skill_moves,
            weak_foot: acc.weak_foot + vote.weak_foot,
            vision: acc.vision + vote.vision,
            work_rate: acc.work_rate + vote.work_rate,
            stamina: acc.stamina + vote.stamina,
            touch: acc.touch + vote.touch,
            mindset: acc.mindset + vote.mindset,
          }), {
            pace: 0, shooting: 0, passing: 0, dribbling: 0, defending: 0, physical: 0,
            skill_moves: 0, weak_foot: 0, vision: 0, work_rate: 0, stamina: 0, touch: 0, mindset: 0
          })
          
          const count = votes.length
          const statsTableName = isGeneratedCard ? 'generated_stats' : 'player_stats'
          const statsIdField = isGeneratedCard ? 'generated_card_id' : 'player_id'
          
          await supabase
            .from(statsTableName)
            .upsert({
              [statsIdField]: target.id,
              pace: Math.round(avgStats.pace / count),
              shooting: Math.round(avgStats.shooting / count),
              passing: Math.round(avgStats.passing / count),
              dribbling: Math.round(avgStats.dribbling / count),
              defending: Math.round(avgStats.defending / count),
              physical: Math.round(avgStats.physical / count),
              skill_moves: Math.round((avgStats.skill_moves / count) * 10) / 10,
              weak_foot: Math.round((avgStats.weak_foot / count) * 10) / 10,
              vision: Math.round(avgStats.vision / count),
              work_rate: Math.round(avgStats.work_rate / count),
              stamina: Math.round(avgStats.stamina / count),
              touch: Math.round(avgStats.touch / count),
              mindset: Math.round(avgStats.mindset / count),
              vote_count: count,
              updated_at: new Date().toISOString(),
            })
        }
      }
      
      // Wait a moment for the database to update
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Refresh data
      if (isGeneratedCard) {
        await fetchGeneratedCards()
      } else {
        await fetchPlayers()
      }

      setSelectedPlayer(null)
      setSelectedGeneratedCard(null)
    } catch (error: any) {
      console.error('Error submitting vote:', error)
      alert(`Failed to submit vote: ${error.message}`)
    }
  }

  const openDetailModal = (player: PlayerWithStats) => {
    setSelectedPlayer(player)
    setShowDetailModal(true)
  }

  const openGeneratedCardDetailModal = (card: any) => {
    setSelectedGeneratedCard(card)
    setShowDetailModal(true)
  }

  const openGeneratedCardVoteModal = async (card: any) => {
    setSelectedGeneratedCard(card)
    
    const { data: { user } } = await supabase.auth.getUser()
    let previousVoteData = null
    if (user) {
      const { data } = await supabase
        .from('generated_stat_votes')
        .select('*')
        .eq('voter_id', user.id)
        .eq('generated_card_id', card.id)
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
      work_rate: previousVoteData?.work_rate ?? 2,
      stamina: previousVoteData?.stamina ?? 50,
      touch: previousVoteData?.touch ?? 50,
      mindset: previousVoteData?.mindset ?? 2,
    })
    setShowVoteModal(true)
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
      work_rate: previousVoteData?.work_rate ?? 2,
      stamina: previousVoteData?.stamina ?? 50,
      touch: previousVoteData?.touch ?? 50,
      mindset: previousVoteData?.mindset ?? 2,
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
              motmBoost={motmBoosts[player.id] || 0}
            />
          ))}
        </div>
      )}

      {/* Generated Cards Section */}
      <div className="mt-12">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white">Community Cards</h2>
          <p className="text-gray-400 text-sm">Cards created by other users.</p>
        </div>

        {generatedCards.length === 0 ? (
          <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-4xl mb-2">🎴</div>
            <p className="text-gray-400">No community cards yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-6 lg:gap-8">
            {generatedCards.map((card) => (
              <div
                key={card.id}
                className="relative cursor-pointer"
                onClick={() => openGeneratedCardDetailModal(card)}
              >
                <PlayerCard
                  player={card}
                  motmBoost={0}
                />
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-400">Created by {card.creator_name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player Detail Modal */}
      <PlayerDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedPlayer(null)
          setSelectedGeneratedCard(null)
        }}
        player={selectedPlayer || selectedGeneratedCard}
        onVote={() => {
          setShowDetailModal(false)
          if (selectedPlayer) {
            openVoteModal(selectedPlayer)
          } else if (selectedGeneratedCard) {
            openGeneratedCardVoteModal(selectedGeneratedCard)
          }
        }}
        currentUserPlayerId={currentUserPlayerId}
        isGeneratedCard={!!selectedGeneratedCard}
        creatorName={selectedGeneratedCard?.creator_name}
        onColorChange={() => {
          if (selectedPlayer) {
            fetchPlayers()
          } else if (selectedGeneratedCard) {
            fetchGeneratedCards()
          }
        }}
      />

      {/* Vote Modal */}
      <Modal isOpen={showVoteModal} onClose={() => setShowVoteModal(false)} title="">
        {(selectedPlayer || selectedGeneratedCard) && (
          <form onSubmit={handleVote} className="space-y-4">
            <div className="text-center mb-2">
              <div className="text-lg font-semibold text-white">
                Rate {selectedGeneratedCard ? 'Card' : 'Player'}: {selectedPlayer?.name || selectedGeneratedCard?.name}
              </div>
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
                          <span className="text-xs text-gray-400">VIS</span>
                          <div className="text-sm font-bold text-yellow-400">{previousVote.vision}</div>
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
                          <span className="text-xs text-gray-400">DRI</span>
                          <div className="text-sm font-bold text-cyan-400">{previousVote.dribbling}</div>
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
              { key: 'stamina', label: 'Stamina' },
              { key: 'touch', label: 'Touch' },
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

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2 text-white">Work Rate</label>
                <SegmentedBar
                  value={voteStats.work_rate}
                  onChange={(value) => setVoteStats({ ...voteStats, work_rate: value })}
                  segments={4}
                  showLabels={false}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2 text-white">Mindset</label>
                <SegmentedBar
                  value={voteStats.mindset}
                  onChange={(value) => setVoteStats({ ...voteStats, mindset: value })}
                  segments={3}
                  showLabels={false}
                />
              </div>
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
