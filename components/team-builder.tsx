'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlayerWithStats } from '@/lib/types'
import { Button } from './ui/button'
import { Modal } from './ui/modal'
import { Trash2 } from 'lucide-react'

interface FieldPosition {
  id: string
  name: string
  x: number
  y: number
  player: PlayerWithStats | null
}

export function TeamBuilder() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [fieldPositions, setFieldPositions] = useState<FieldPosition[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFormationModal, setShowFormationModal] = useState(true)
  const [formation, setFormation] = useState({ defenders: 4, midfielders: 3, attackers: 3 })

  const supabase = createClient()

  useEffect(() => {
    fetchPlayers()
    initializeField()
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
    } finally {
      setLoading(false)
    }
  }

  const initializeField = () => {
    const positions: FieldPosition[] = []
    
    // Add GK
    positions.push({ id: 'gk', name: 'GK', x: 50, y: 90, player: null })
    
    // Add defenders in a straight line
    const defenderSpacing = 99.5 / (formation.defenders + 1)
    for (let i = 0; i < formation.defenders; i++) {
      positions.push({
        id: `def-${i}`,
        name: 'DEF',
        x: 0.25 + defenderSpacing * (i + 1),
        y: 70,
        player: null
      })
    }
    
    // Add midfielders in a straight line
    const midfielderSpacing = 99.5 / (formation.midfielders + 1)
    for (let i = 0; i < formation.midfielders; i++) {
      positions.push({
        id: `mid-${i}`,
        name: 'MID',
        x: 0.25 + midfielderSpacing * (i + 1),
        y: 45,
        player: null
      })
    }
    
    // Add attackers in a straight line
    const attackerSpacing = 99.5 / (formation.attackers + 1)
    for (let i = 0; i < formation.attackers; i++) {
      positions.push({
        id: `att-${i}`,
        name: 'ATT',
        x: 0.25 + attackerSpacing * (i + 1),
        y: 20,
        player: null
      })
    }
    
    setFieldPositions(positions)
  }

  const handlePlayerSelect = (player: PlayerWithStats) => {
    setSelectedPlayer(player)
  }

  const handleRemovePlayer = (positionId: string) => {
    setFieldPositions(prev =>
      prev.map(pos =>
        pos.id === positionId
          ? { ...pos, player: null }
          : pos
      )
    )
  }

  const clearField = () => {
    setFieldPositions(prev =>
      prev.map(pos => ({ ...pos, player: null }))
    )
  }

  const resetFormation = () => {
    setShowFormationModal(true)
  }

  const handleFormationSelect = (def: number, mid: number, att: number) => {
    setFormation({ defenders: def, midfielders: mid, attackers: att })
    setShowFormationModal(false)
    initializeField()
  }

  const handleDragStart = (e: React.DragEvent, player: PlayerWithStats) => {
    e.dataTransfer.setData('playerId', player.id)
    setSelectedPlayer(player)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, position: FieldPosition) => {
    e.preventDefault()
    const playerId = e.dataTransfer.getData('playerId')
    const player = players.find(p => p.id === playerId)
    
    if (player) {
      setFieldPositions(prev =>
        prev.map(pos =>
          pos.id === position.id
            ? { ...pos, player }
            : pos
        )
      )
    }
  }

  const handlePositionClick = (position: FieldPosition) => {
    if (selectedPlayer) {
      setFieldPositions(prev =>
        prev.map(pos =>
          pos.id === position.id
            ? { ...pos, player: selectedPlayer }
            : pos
        )
      )
      setSelectedPlayer(null)
    }
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
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Team Builder</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setShowFormationModal(true)} className="flex-1 sm:flex-none text-sm">
            Change Formation
          </Button>
          <Button variant="outline" onClick={clearField} className="flex-1 sm:flex-none text-sm">
            Clear Players
          </Button>
        </div>
      </div>

      {/* Soccer Field */}
      <div 
        className="relative w-full aspect-[3/4] max-w-md mx-auto bg-green-800 rounded-xl border-4 border-white/30 overflow-hidden mb-6"
      >
        {/* Field markings */}
        <div className="absolute inset-0">
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/50 rounded-full" />
          {/* Center line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/50 transform -translate-x-1/2" />
          {/* Penalty areas */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-2 border-white/50 border-t-0" />
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-2 border-white/50 border-b-0" />
        </div>

        {/* Position slots */}
        {fieldPositions.map((position) => (
          <div
            key={position.id}
            onClick={() => handlePositionClick(position)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, position)}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center cursor-pointer transition-all ${
              position.player
                ? 'bg-primary/80 border-2 border-primary'
                : selectedPlayer
                ? 'bg-white/20 border-2 border-dashed border-white/50 hover:bg-white/30'
                : 'bg-white/10 border-2 border-dashed border-white/30'
            }`}
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            {position.player ? (
              <div className="relative">
                {position.player.image_url ? (
                  <img
                    src={position.player.image_url}
                    alt={position.player.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-600 flex items-center justify-center text-xl sm:text-2xl">
                    ⚽
                  </div>
                )}
                <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-white text-xs sm:text-sm font-bold whitespace-nowrap">{position.player.name}</div>
                  <div className="text-gray-300 text-xs sm:text-sm">{position.player.primary_position}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemovePlayer(position.id)
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ) : (
              <span className="text-white/70 text-sm font-bold">{position.name}</span>
            )}
          </div>
        ))}
      </div>

      {/* Formation Selection Modal */}
      <Modal
        isOpen={showFormationModal}
        onClose={() => setShowFormationModal(false)}
        title="Select Formation"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Defenders</label>
            <div className="flex gap-2">
              {[3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setFormation(prev => ({ ...prev, defenders: num }))}
                  className={`flex-1 px-4 py-3 rounded-lg font-bold transition-colors ${
                    formation.defenders === num
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 border-gray-600 hover:border-green-500 text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Midfielders</label>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setFormation(prev => ({ ...prev, midfielders: num }))}
                  className={`flex-1 px-4 py-3 rounded-lg font-bold transition-colors ${
                    formation.midfielders === num
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 border-gray-600 hover:border-green-500 text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-white">Attackers</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setFormation(prev => ({ ...prev, attackers: num }))}
                  className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-bold text-sm sm:text-base transition-colors ${
                    formation.attackers === num
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 border-gray-600 hover:border-green-500 text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={() => handleFormationSelect(formation.defenders, formation.midfielders, formation.attackers)}
            className="w-full text-sm sm:text-base"
          >
            Apply Formation ({formation.defenders}-{formation.midfielders}-{formation.attackers})
          </Button>
        </div>
      </Modal>

      {/* Player selection */}
      <div>
        <h3 className="text-lg font-bold mb-3 text-white">
          {selectedPlayer 
            ? `Selected: ${selectedPlayer.name} - Drag or click a position to place`
            : 'Drag or click a player to select'
          }
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {players.map((player) => (
            <div
              key={player.id}
              draggable
              onDragStart={(e) => handleDragStart(e, player)}
              onClick={() => handlePlayerSelect(player)}
              className={`relative cursor-pointer rounded-lg overflow-hidden transition-all ${
                selectedPlayer?.id === player.id
                  ? 'ring-2 ring-primary scale-105'
                  : 'hover:scale-105'
              }`}
            >
              {player.image_url ? (
                <img
                  src={player.image_url}
                  alt={player.name}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-700 flex items-center justify-center text-3xl">
                  ⚽
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                <div className="text-white text-xs font-bold truncate">{player.name}</div>
                <div className="text-gray-300 text-xs">{player.primary_position}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
