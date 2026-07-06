'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PollWithOptions } from '@/lib/types'
import { Button } from './ui/button'
import { Modal } from './ui/modal'
import { Plus } from 'lucide-react'

export function PollsPage() {
  const [polls, setPolls] = useState<PollWithOptions[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchPolls()
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
  }

  const fetchPolls = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPolls(data || [])
    } catch (error) {
      console.error('Error fetching polls:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePoll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const optionsText = formData.get('options') as string
      const options = optionsText.split('\n').filter(line => line.trim()).map(text => text.trim())

      if (options.length < 2) {
        alert('Please provide at least 2 options!')
        return
      }

      const { data: poll } = await supabase
        .from('polls')
        .insert({ title, description: description || null })
        .select()
        .single()

      if (!poll) throw new Error('Failed to create poll')

      for (const optionText of options) {
        await supabase.from('poll_options').insert({
          poll_id: poll.id,
          option_text: optionText,
        })
      }

      setShowCreateModal(false)
      fetchPolls()
      e.currentTarget.reset()
    } catch (error) {
      console.error('Error creating poll:', error)
      alert('Failed to create poll')
    }
  }

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please sign in to vote')
        return
      }

      // Remove previous vote for this poll
      await supabase
        .from('poll_votes')
        .delete()
        .eq('poll_id', pollId)
        .eq('voter_id', user.id)

      // Add new vote
      await supabase.from('poll_votes').insert({
        poll_id: pollId,
        option_id: optionId,
        voter_id: user.id,
      })

      fetchPolls()
    } catch (error) {
      console.error('Error voting:', error)
      alert('Failed to vote')
    }
  }

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll?')) return

    try {
      await supabase.from('polls').delete().eq('id', pollId)
      fetchPolls()
    } catch (error) {
      console.error('Error deleting poll:', error)
      alert('Failed to delete poll')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading polls...</div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Polls & Voting</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={20} className="mr-2" />
          Create Poll
        </Button>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">No Polls Yet</h3>
          <p className="text-gray-400">Create your first poll!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map(poll => {
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0)

            return (
              <div key={poll.id} className="bg-card rounded-xl p-6 border border-gray-600">
                <h3 className="text-xl font-bold mb-2">{poll.title}</h3>
                {poll.description && <p className="text-gray-400 mb-4">{poll.description}</p>}
                <p className="text-sm text-gray-500 mb-4">Total votes: {totalVotes}</p>

                <div className="space-y-2">
                  {poll.options.map(option => {
                    const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
                    const hasVoted = userId && poll.options.some(opt => 
                      opt.id === option.id && opt.votes > 0 // Simplified check
                    )

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleVote(poll.id, option.id)}
                        className="w-full text-left p-3 rounded-lg bg-background hover:bg-card-light transition-colors relative overflow-hidden"
                      >
                        <div
                          className="absolute inset-0 bg-primary/20 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="relative flex justify-between items-center">
                          <span className="font-medium">{option.option_text}</span>
                          <span className="text-sm text-gray-400">{option.votes} votes ({percentage}%)</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handleDeletePoll(poll.id)}
                  className="mt-4 w-full"
                >
                  Delete Poll
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Poll Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Poll">
        <form onSubmit={handleCreatePoll} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Poll Title *</label>
            <input
              name="title"
              type="text"
              required
              className="w-full px-3 py-2 bg-card border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., When should we play?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              name="description"
              rows={2}
              className="w-full px-3 py-2 bg-card border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Add details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Options (one per line) *</label>
            <textarea
              name="options"
              rows={5}
              required
              className="w-full px-3 py-2 bg-card border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Saturday 3pm&#10;Sunday 10am&#10;Sunday 2pm"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">Create Poll</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
