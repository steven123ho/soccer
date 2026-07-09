'use client'

import { useState, useEffect } from 'react'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { createClient } from '@/lib/supabase/client'

interface GameModalProps {
  isOpen: boolean
  onClose: () => void
  game?: any // Game object for editing, undefined for creating
  onGameSaved?: () => void
}

export function GameModal({ isOpen, onClose, game, onGameSaved }: GameModalProps) {
  const [title, setTitle] = useState('')
  const [gameDate, setGameDate] = useState('')
  const [teamAScore, setTeamAScore] = useState('')
  const [teamBScore, setTeamBScore] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      if (game) {
        // Editing existing game
        setTitle(game.title || '')
        setGameDate(new Date(game.game_date).toISOString().slice(0, 16))
        setTeamAScore(game.team_a_score?.toString() || '')
        setTeamBScore(game.team_b_score?.toString() || '')
      } else {
        // Creating new game
        const now = new Date()
        const dateStr = now.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
        setTitle(dateStr)
        setGameDate(now.toISOString().slice(0, 16))
        setTeamAScore('')
        setTeamBScore('')
      }
    }
  }, [isOpen, game])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const gameData = {
        title: title,
        game_date: new Date(gameDate).toISOString(),
        team_a_score: teamAScore ? parseInt(teamAScore) : null,
        team_b_score: teamBScore ? parseInt(teamBScore) : null,
      }

      if (game) {
        // Update existing game
        const { error } = await supabase
          .from('games')
          .update(gameData)
          .eq('id', game.id)

        if (error) throw error
      } else {
        // Create new game
        const { error } = await supabase
          .from('games')
          .insert({
            ...gameData,
            created_by: user.id,
          })

        if (error) throw error
      }

      if (onGameSaved) onGameSaved()
      onClose()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!game || !confirm('Are you sure you want to delete this game?')) return

    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', game.id)

      if (error) throw error

      if (onGameSaved) onGameSaved()
      onClose()
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={game ? 'Edit Game' : 'New Game'}>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-white">Game Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            placeholder="Game title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-white">Game Date</label>
          <input
            type="datetime-local"
            value={gameDate}
            onChange={(e) => setGameDate(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Team A Score</label>
            <input
              type="number"
              min="0"
              value={teamAScore}
              onChange={(e) => setTeamAScore(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Team B Score</label>
            <input
              type="number"
              min="0"
              value={teamBScore}
              onChange={(e) => setTeamBScore(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          {game && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              className="flex-1 text-red-400 hover:text-red-300 border-red-600 hover:border-red-500"
            >
              Delete
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
