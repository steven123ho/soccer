'use client'

import { useState, useEffect } from 'react'
import { StatsEntry, StatsSummary } from '../lib/types'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'

const supabase = createClient()

export function StatsTrackerPage({ onNavigateToProfile }: { onNavigateToProfile?: () => void }) {
  const [entries, setEntries] = useState<StatsEntry[]>([])
  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<StatsEntry | null>(null)
  const [formData, setFormData] = useState({
    goals: 0,
    assists: 0,
    date: new Date().toISOString().split('T')[0],
    hours_played: ''
  })
  const [playerId, setPlayerId] = useState<string | null>(null)

  useEffect(() => {
    fetchPlayerAndEntries()
  }, [])

  const fetchPlayerAndEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: player, error } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching player:', error)
      return
    }

    if (player) {
      setPlayerId(player.id)
      await fetchEntries(player.id)
    }
  }

  const fetchEntries = async (pid: string) => {
    const { data } = await supabase
      .from('stats_entries')
      .select('*')
      .eq('player_id', pid)
      .order('date', { ascending: false })

    if (data) {
      setEntries(data)
      calculateSummary(data)
    }
  }

  const calculateSummary = (data: StatsEntry[]) => {
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

    setSummary({
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerId) return

    const entryData = {
      player_id: playerId,
      goals: formData.goals,
      assists: formData.assists,
      date: formData.date,
      hours_played: formData.hours_played ? parseFloat(formData.hours_played) : null
    }

    if (editingEntry) {
      const { error } = await supabase
        .from('stats_entries')
        .update(entryData)
        .eq('id', editingEntry.id)

      if (!error) {
        await fetchEntries(playerId)
        closeModal()
      }
    } else {
      const { error } = await supabase
        .from('stats_entries')
        .insert(entryData)

      if (!error) {
        await fetchEntries(playerId)
        closeModal()
      }
    }
  }

  const handleEdit = (entry: StatsEntry) => {
    setEditingEntry(entry)
    setFormData({
      goals: entry.goals,
      assists: entry.assists,
      date: entry.date,
      hours_played: entry.hours_played?.toString() || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!playerId) return
    const { error } = await supabase
      .from('stats_entries')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchEntries(playerId)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingEntry(null)
    setFormData({
      goals: 0,
      assists: 0,
      date: new Date().toISOString().split('T')[0],
      hours_played: ''
    })
  }

  const chartData = entries
    .slice()
    .reverse()
    .map(e => ({
      date: new Date(e.date).toLocaleDateString(),
      goals: e.goals,
      assists: e.assists
    }))

  if (!playerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
        <p className="text-gray-400 mb-4">Please create a player profile to track stats</p>
        {onNavigateToProfile && (
          <Button onClick={onNavigateToProfile} className="bg-green-600 hover:bg-green-700">
            Go to Profile
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Stats Tracker</h1>
            <p className="text-gray-400 mt-2">
              Add your goals and assists to see your progress over time.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus size={16} className="mr-2" />
            Add Entry
          </Button>
        </div>

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Goals" value={summary.total_goals} color="text-green-400" />
            <StatCard label="Total Assists" value={summary.total_assists} color="text-blue-400" />
            <StatCard label="Games Played" value={summary.total_games} color="text-purple-400" />
            <StatCard label="Total Hours" value={summary.total_hours.toFixed(1)} color="text-yellow-400" />
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="Goals/Game" value={summary.goals_per_game.toFixed(2)} color="text-green-400" />
            <StatCard label="Assists/Game" value={summary.assists_per_game.toFixed(2)} color="text-blue-400" />
            <StatCard label="Goals/Hour" value={summary.goals_per_hour.toFixed(2)} color="text-green-400" />
            <StatCard label="Assists/Hour" value={summary.assists_per_hour.toFixed(2)} color="text-blue-400" />
            <StatCard label="Goals (Week)" value={summary.goals_last_week} color="text-green-400" />
            <StatCard label="Assists (Week)" value={summary.assists_last_week} color="text-blue-400" />
            <StatCard label="Goals (Month)" value={summary.goals_last_month} color="text-green-400" />
            <StatCard label="Assists (Month)" value={summary.assists_last_month} color="text-blue-400" />
            <StatCard label="Goals (Year)" value={summary.goals_last_year} color="text-green-400" />
            <StatCard label="Assists (Year)" value={summary.assists_last_year} color="text-blue-400" />
          </div>
        )}

        {chartData.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Performance Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                <Legend />
                <Line type="monotone" dataKey="goals" stroke="#4ADE80" strokeWidth={2} />
                <Line type="monotone" dataKey="assists" stroke="#60A5FA" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Goals vs Assists</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                <Legend />
                <Bar dataKey="goals" fill="#4ADE80" />
                <Bar dataKey="assists" fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 mb-2">
          <h2 className="text-xl font-bold text-white mb-4">Recent Entries</h2>
          {entries.length === 0 ? (
            <p className="text-gray-400">No entries yet. Add your first game!</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                  <div className="flex-1">
                    <p className="text-white font-semibold">{new Date(entry.date).toLocaleDateString()}</p>
                    <p className="text-gray-400 text-sm">
                      {entry.goals} goals, {entry.assists} assists
                      {entry.hours_played && `, ${entry.hours_played} hrs`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(entry)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingEntry ? 'Edit Entry' : 'Add Entry'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Goals</label>
            <input
              type="number"
              min="0"
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Assists</label>
            <input
              type="number"
              min="0"
              value={formData.assists}
              onChange={(e) => setFormData({ ...formData, assists: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Hours Played (Optional)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={formData.hours_played}
              onChange={(e) => setFormData({ ...formData, hours_played: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {editingEntry ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}