'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from './ui/button'
import { Modal } from './ui/modal'
import { OnboardingModal } from './onboarding-modal'
import { LogIn, User } from 'lucide-react'

interface AuthButtonProps {
  onProfileClick: () => void
}

export function AuthButton({ onProfileClick }: AuthButtonProps) {
  const [user, setUser] = useState<any>(null)
  const [playerProfile, setPlayerProfile] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    getUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await checkPlayerProfile(session.user.id)
      } else {
        setPlayerProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      await checkPlayerProfile(user.id)
    }
  }

  const checkPlayerProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    setPlayerProfile(data)
    
    // Show onboarding if no profile exists (error means not found)
    if (error || !data) {
      setShowOnboarding(true)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        alert('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        setShowAuthModal(false)
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <>
        <button
          onClick={onProfileClick}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white"
        >
          {playerProfile?.image_url ? (
            <img
              src={playerProfile.image_url}
              alt={playerProfile.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User size={16} />
          )}
          <span className="text-sm font-medium">{playerProfile?.name || user.email}</span>
        </button>
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={async () => {
            await checkPlayerProfile(user.id)
            setShowOnboarding(false)
          }}
        />
      </>
    )
  }

  return (
    <>
      <Button onClick={() => setShowAuthModal(true)}>
        <LogIn size={16} className="mr-2" />
        Sign In
      </Button>

      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title={isSignUp ? 'Create Account' : 'Sign In'}
      >
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </form>
      </Modal>
    </>
  )
}
