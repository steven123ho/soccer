'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { GameModal } from './game-modal'
import { TeamPickerModal } from './team-picker-modal'
import { createClient } from '@/lib/supabase/client'
import { Game, GameWithParticipants } from '@/lib/types'
import { Plus, Calendar, Users, Trophy } from 'lucide-react'

export function PlayPage() {
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showGameModal, setShowGameModal] = useState(false)
  const [showTeamPicker, setShowTeamPicker] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [selectedGameForTeams, setSelectedGameForTeams] = useState<Game | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null)
  const [motmVotes, setMotmVotes] = useState<Record<string, any[]>>({})
  const [userVotes, setUserVotes] = useState<Record<string, string | null>>({})
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [selectedMotmCandidate, setSelectedMotmCandidate] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchGames()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: playerData } = await supabase
          .from('players')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (playerData) {
          setCurrentUser(playerData.id)
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchGames = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          game_participants (
            player_id,
            team,
            player:players (*, player_stats(*))
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setGames(data || [])

      // Fetch MOTM votes for all games
      if (data) {
        for (const game of data) {
          await fetchMotmVotesForGame(game.id)
        }
      }
    } catch (error: any) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMotmVotesForGame = async (gameId: string) => {
    try {
      const { data, error } = await supabase
        .from('motm_votes')
        .select('*')
        .eq('game_id', gameId)

      if (error) throw error

      setMotmVotes(prev => ({ ...prev, [gameId]: data || [] }))

      // Find current user's vote for this game
      if (currentUser) {
        const myVote = data?.find(v => v.voter_id === currentUser)
        setUserVotes(prev => ({ ...prev, [gameId]: myVote?.candidate_id || null }))
      }
    } catch (error) {
      console.error('Error fetching MOTM votes:', error)
    }
  }

  const handleCreateGame = () => {
    setEditingGame(null)
    setShowGameModal(true)
  }

  const handleEditGame = (game: Game) => {
    setEditingGame(game)
    setShowGameModal(true)
  }

  const handlePickTeams = (game: Game) => {
    setSelectedGameForTeams(game)
    setShowTeamPicker(true)
  }

  const handleViewGame = (game: Game) => {
    setSelectedGameForTeams(game)
    setShowTeamPicker(true)
  }

  const handleGameSaved = () => {
    fetchGames()
  }

  const handleTeamsSaved = () => {
    fetchGames()
  }

  const handleMotmVote = async (gameId: string) => {
    if (!currentUser) {
      alert('You must be logged in to vote!')
      return
    }

    if (!selectedMotmCandidate) {
      alert('Please select a player to vote for!')
      return
    }

    const game = games.find(g => g.id === gameId)
    if (!game) return

    // Check if user is a participant in this game
    const isParticipant = game.game_participants?.some((p: any) => p.player_id === currentUser)
    if (!isParticipant) {
      alert('Only game participants can vote for MOTM!')
      return
    }

    try {
      const currentVote = userVotes[gameId]
      
      // Update or insert vote
      const { error } = await supabase
        .from('motm_votes')
        .upsert({
          game_id: gameId,
          voter_id: currentUser,
          candidate_id: selectedMotmCandidate,
        }, {
          onConflict: 'game_id,voter_id'
        })

      if (error) throw error
      setUserVotes(prev => ({ ...prev, [gameId]: selectedMotmCandidate }))
      setSelectedMotmCandidate(null)

      // Refresh votes for this game
      await fetchMotmVotesForGame(gameId)
    } catch (error: any) {
      alert(error.message)
    }
  }

  const getVoteCount = (gameId: string, playerId: string) => {
    return motmVotes[gameId]?.filter((v: any) => v.candidate_id === playerId).length || 0
  }

  const toggleExpand = (gameId: string) => {
    setExpandedGameId(expandedGameId === gameId ? null : gameId)
  }

  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase()
    if (['ST', 'CF', 'LW', 'RW'].includes(pos)) return 'bg-red-500'
    if (['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(pos)) return 'bg-green-500'
    if (['CB', 'LB', 'RB'].includes(pos)) return 'bg-purple-500'
    if (pos === 'GK') return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  const isGameExpired = (game: Game) => {
    return new Date(game.expires_at) < new Date()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getOverallRating = (stats: any) => {
    if (!stats) return 0
    return Math.round(
      (stats.pace + stats.shooting + stats.passing + stats.dribbling + stats.defending + stats.physical) / 6
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading games...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Play</h2>
          <p className="text-gray-400 text-sm mt-1">
            Create a new game to pick teams and vote for the MOTM.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowHistory(!showHistory)} variant="outline">
            {showHistory ? 'Active Games' : 'History'}
          </Button>
          <Button onClick={handleCreateGame}>
            <Plus size={16} className="mr-2" />
            New Game
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {games.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚽</div>
            <h3 className="text-xl font-semibold mb-2 text-white">No Games Yet</h3>
            <p className="text-gray-400">Create a new game to get started!</p>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {games.filter(game => showHistory ? game.status === 'completed' : game.status !== 'completed').map((game) => {
            const expired = isGameExpired(game)
            const teamA = game.game_participants?.filter((p: any) => p.team === 'team_a') || []
            const teamB = game.game_participants?.filter((p: any) => p.team === 'team_b') || []
            const teamAAvg = teamA.length > 0 
              ? Math.round(teamA.reduce((sum: number, p: any) => sum + getOverallRating(p.player?.player_stats), 0) / teamA.length)
              : 0
            const teamBAvg = teamB.length > 0 
              ? Math.round(teamB.reduce((sum: number, p: any) => sum + getOverallRating(p.player?.player_stats), 0) / teamB.length)
              : 0

            return (
              <div
                key={game.id}
                className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border ${
                  expired ? 'border-gray-700 opacity-60' : 'border-gray-700'
                } p-4 shadow-sm`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(game.id)}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">{game.title}</h3>
                      {expired && (
                        <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-400 rounded-full">
                          Expired
                        </span>
                      )}
                      {game.status === 'completed' && !expired && (
                        <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(game.game_date)}</span>
                      </div>
                      {game.team_a_score !== null && game.team_b_score !== null && (
                        <div className="flex items-center gap-1">
                          <Trophy size={14} />
                          <span className="text-white font-medium">
                            {game.team_a_score} - {game.team_b_score}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePickTeams(game)}
                      disabled={expired}
                    >
                      Teams
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditGame(game)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      <span className="text-gray-400">Team A</span>
                      <span className="text-gray-400">({teamA.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      <span className="text-gray-400">Team B</span>
                      <span className="text-gray-400">({teamB.length})</span>
                    </div>
                  </div>
                </div>

                {/* Collapsible teams section */}
                {expandedGameId === game.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-800 rounded-lg p-4 border-2 border-green-600">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-bold text-white">Team A</h4>
                          <span className="text-green-500 font-bold text-sm">OVR Avg: {teamAAvg}</span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {teamA.map((p: any) => (
                            <div key={p.player_id} className="flex items-center justify-between p-2 bg-gray-700 rounded text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{p.player?.name}</span>
                                <span className={`text-xs px-2 py-1 rounded text-white font-bold ${getPositionColor(p.player?.primary_position)}`}>
                                  {p.player?.primary_position}
                                </span>
                              </div>
                              <span className="font-bold text-green-500">{getOverallRating(p.player?.player_stats)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-800 rounded-lg p-4 border-2 border-green-700">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-bold text-white">Team B</h4>
                          <span className="text-green-500 font-bold text-sm">OVR Avg: {teamBAvg}</span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {teamB.map((p: any) => (
                            <div key={p.player_id} className="flex items-center justify-between p-2 bg-gray-700 rounded text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{p.player?.name}</span>
                                <span className={`text-xs px-2 py-1 rounded text-white font-bold ${getPositionColor(p.player?.primary_position)}`}>
                                  {p.player?.primary_position}
                                </span>
                              </div>
                              <span className="font-bold text-green-500">{getOverallRating(p.player?.player_stats)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* MOTM Voting Section */}
                    {game.status !== 'completed' && teamA.length > 0 && teamB.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-700">
                        <h4 className="text-lg font-bold text-white">Man of the Match</h4>
                        <p className="text-sm text-gray-400 mb-4">Player with the most votes will be awarded the MOTM award.</p>
                        
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {[...teamA, ...teamB].map((p: any) => {
                            const voteCount = getVoteCount(game.id, p.player_id)
                            const hasVoted = userVotes[game.id] === p.player_id
                            const isSelected = selectedMotmCandidate === p.player_id
                            const canVote = currentUser && [...teamA, ...teamB].some((tp: any) => tp.player_id === currentUser)
                            
                            return (
                              <button
                                key={p.player_id}
                                onClick={() => canVote && setSelectedMotmCandidate(p.player_id)}
                                disabled={!canVote}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                  isSelected 
                                    ? 'border-yellow-500 bg-yellow-500/20' 
                                    : hasVoted
                                    ? 'border-yellow-500/50 bg-yellow-500/10'
                                    : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                                } ${!canVote ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-white text-sm truncate">{p.player?.name}</span>
                                  <div className="flex items-center gap-1">
                                    {voteCount > 0 && (
                                      <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold">
                                        {voteCount}
                                      </span>
                                    )}
                                    {hasVoted && (
                                      <span className="text-yellow-500">★</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className={`px-2 py-0.5 rounded text-white font-bold ${getPositionColor(p.player?.primary_position)}`}>
                                    {p.player?.primary_position}
                                  </span>
                                  <span className="text-green-500 font-bold">{getOverallRating(p.player?.player_stats)}</span>
                                </div>
                              </button>
                            )
                          })}
                        </div>

                        <div className="mt-4 mb-4">
                          <Button 
                            onClick={() => handleMotmVote(game.id)}
                            disabled={!selectedMotmCandidate}
                            className="w-full"
                          >
                            Submit Vote
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      </div>

      <GameModal
        isOpen={showGameModal}
        onClose={() => setShowGameModal(false)}
        game={editingGame}
        onGameSaved={handleGameSaved}
      />

      <TeamPickerModal
        isOpen={showTeamPicker}
        onClose={() => setShowTeamPicker(false)}
        game={selectedGameForTeams}
        onTeamsSaved={handleTeamsSaved}
      />
    </div>
  )
}
