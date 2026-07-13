'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from './ui/button'
import { Modal } from './ui/modal'
import { Upload, Save, Sparkles, Trash2 } from 'lucide-react'
import { ImageCropModal } from './image-crop-modal'
import { PlayerCard } from './player-card'

interface CardBuilderProps {
  onCardCreated?: () => void
  embedded?: boolean
}

export function CardBuilder({ onCardCreated, embedded = false }: CardBuilderProps) {
  const [showCardModal, setShowCardModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [canCreateCard, setCanCreateCard] = useState(true)
  const [nextCardTime, setNextCardTime] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [cardName, setCardName] = useState('')
  const [cardPosition, setCardPosition] = useState('CM')
  const [cardSecondaryPositions, setCardSecondaryPositions] = useState<string[]>([])
  const [cardPlayerNumber, setCardPlayerNumber] = useState('')
  const [cardNationality, setCardNationality] = useState('')
  const [cardColor, setCardColor] = useState('#f59e0b')
  const [cardPhotoFile, setCardPhotoFile] = useState<File | null>(null)
  const [cardPhotoPreview, setCardPhotoPreview] = useState<string | null>(null)
  const [cardPhotoOffsetX, setCardPhotoOffsetX] = useState(0)
  const [cardPhotoOffsetY, setCardPhotoOffsetY] = useState(0)
  const [showCropModal, setShowCropModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [myCards, setMyCards] = useState<any[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<string | null>(null)

  const supabase = createClient()

  const POSITION_OPTIONS = [
    'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'
  ]

  const COUNTRIES = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Algeria' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BR', name: 'Brazil' },
    { code: 'CA', name: 'Canada' },
    { code: 'CL', name: 'Chile' },
    { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'DK', name: 'Denmark' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' },
    { code: 'EE', name: 'Estonia' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GR', name: 'Greece' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MX', name: 'Mexico' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'NO', name: 'Norway' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SN', name: 'Senegal' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SG', name: 'Singapore' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'KR', name: 'South Korea' },
    { code: 'ES', name: 'Spain' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'TR', name: 'Turkey' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'VE', name: 'Venezuela' },
  ]

  const toggleSecondaryPosition = (pos: string) => {
    setCardSecondaryPositions(prev =>
      prev.includes(pos)
        ? prev.filter(p => p !== pos)
        : [...prev, pos]
    )
  }

  useEffect(() => {
    checkDailyLimit()
    fetchMyCards()
  }, [])

  const checkDailyLimit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: tracking } = await supabase
        .from('daily_card_creation_tracking')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (tracking) {
        const today = new Date().toISOString().split('T')[0]
        if (tracking.last_card_date === today && tracking.cards_created_today >= 1) {
          setCanCreateCard(false)
          // Calculate next available time
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          tomorrow.setHours(0, 0, 0, 0)
          setNextCardTime(tomorrow.toLocaleString())
        } else if (tracking.last_card_date !== today) {
          // Reset for new day
          await supabase
            .from('daily_card_creation_tracking')
            .update({ last_card_date: today, cards_created_today: 0 })
            .eq('user_id', user.id)
          setCanCreateCard(true)
        }
      } else {
        // First time user
        const today = new Date().toISOString().split('T')[0]
        await supabase
          .from('daily_card_creation_tracking')
          .insert({ user_id: user.id, last_card_date: today, cards_created_today: 0 })
        setCanCreateCard(true)
      }
    } catch (error) {
      console.error('Error checking daily limit:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('generated_cards')
        .select(`
          *,
          generated_stats(*)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      const cardsWithStats = data?.map((card: any) => ({
        ...card,
        stats: card.generated_stats || {
          pace: 50,
          shooting: 50,
          passing: 50,
          dribbling: 50,
          defending: 50,
          physical: 50,
          vote_count: 0,
        },
      })) || []

      setMyCards(cardsWithStats)
    } catch (error) {
      console.error('Error fetching my cards:', error)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCardPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCardPhotoPreview(reader.result as string)
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], 'cropped-photo.jpg', { type: 'image/jpeg' })
    setCardPhotoFile(croppedFile)
    const reader = new FileReader()
    reader.onloadend = () => {
      setCardPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(croppedFile)
  }

  const handleSkipCrop = (originalFile: File) => {
    setCardPhotoFile(originalFile)
    setShowCropModal(false)
  }

  const uploadPhoto = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `generated-${userId}-${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('player-photos')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('player-photos')
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error('Error uploading photo:', error)
      return null
    }
  }

  const getNationalityName = (code: string) => {
    const country = COUNTRIES.find(c => c.code === code);
    return country ? country.name : code;
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (!canCreateCard) throw new Error('Daily limit reached')

      let imageUrl: string | null = null
      if (cardPhotoFile) {
        imageUrl = await uploadPhoto(cardPhotoFile, user.id)
      }

      // Get the player's chosen name
      const { data: playerData } = await supabase
        .from('players')
        .select('name')
        .eq('user_id', user.id)
        .single()

      const creatorName = playerData?.name || user.email?.split('@')[0] || 'Unknown'

      const { error: cardError } = await supabase
        .from('generated_cards')
        .insert({
          creator_id: user.id,
          creator_name: creatorName,
          name: cardName,
          primary_position: cardPosition,
          secondary_positions: cardSecondaryPositions,
          player_number: parseInt(cardPlayerNumber) || null,
          nationality: cardNationality || null,
          image_url: imageUrl,
          card_color: cardColor,
          photo_offset_x: cardPhotoOffsetX,
          photo_offset_y: cardPhotoOffsetY,
        })

      if (cardError) throw cardError

      // Update daily limit
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('daily_card_creation_tracking')
        .update({ last_card_date: today, cards_created_today: 1 })
        .eq('user_id', user.id)

      setCanCreateCard(false)
      await fetchMyCards()
      closeCardModal()
      
      if (onCardCreated) onCardCreated()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCardId) return

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let imageUrl = existingImageUrl
      if (cardPhotoFile) {
        imageUrl = await uploadPhoto(cardPhotoFile, user.id)
      }

      const { error: cardError } = await supabase
        .from('generated_cards')
        .update({
          name: cardName,
          primary_position: cardPosition,
          secondary_positions: cardSecondaryPositions,
          player_number: parseInt(cardPlayerNumber) || null,
          nationality: cardNationality || null,
          image_url: imageUrl,
          card_color: cardColor,
          photo_offset_x: cardPhotoOffsetX,
          photo_offset_y: cardPhotoOffsetY,
        })
        .eq('id', editingCardId)
        .eq('creator_id', user.id)

      if (cardError) throw cardError

      await fetchMyCards()
      closeCardModal()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitCard = modalMode === 'create' ? handleCreateCard : handleUpdateCard

  const handleDeleteCard = async (cardId: string) => {
    setCardToDelete(cardId)
    setShowDeleteConfirm(true)
    setShowCardModal(false)
  }

  const confirmDeleteCard = async () => {
    if (!cardToDelete) return

    try {
      const { error } = await supabase
        .from('generated_cards')
        .delete()
        .eq('id', cardToDelete)

      if (error) throw error

      setShowDeleteConfirm(false)
      setCardToDelete(null)
      await fetchMyCards()
      if (onCardCreated) onCardCreated()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const resetForm = () => {
    setCardName('')
    setCardPosition('CM')
    setCardSecondaryPositions([])
    setCardPlayerNumber('')
    setCardNationality('')
    setCardColor('#f59e0b')
    setCardPhotoFile(null)
    setCardPhotoPreview(null)
    setCardPhotoOffsetX(0)
    setCardPhotoOffsetY(0)
    setEditingCardId(null)
    setExistingImageUrl(null)
    setModalMode('create')
  }

  const openCreateModal = () => {
    resetForm()
    setModalMode('create')
    setShowCardModal(true)
  }

  const openEditModal = (card: any) => {
    setCardName(card.name)
    setCardPosition(card.primary_position)
    setCardSecondaryPositions(card.secondary_positions || [])
    setCardPlayerNumber(card.player_number?.toString() || '')
    setCardNationality(card.nationality || '')
    setCardColor(card.card_color || '#f59e0b')
    setCardPhotoFile(null)
    setCardPhotoPreview(card.image_url || null)
    setExistingImageUrl(card.image_url || null)
    setCardPhotoOffsetX(card.photo_offset_x || 0)
    setCardPhotoOffsetY(card.photo_offset_y || 0)
    setEditingCardId(card.id)
    setModalMode('edit')
    setShowCardModal(true)
  }

  const closeCardModal = () => {
    setShowCardModal(false)
    resetForm()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className={embedded ? '' : 'pb-20'}>
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className={`font-bold text-white ${embedded ? 'text-lg' : 'text-xl sm:text-2xl'}`}>Card Builder</h3>
        <Button 
          onClick={openCreateModal} 
          disabled={!canCreateCard}
          className="flex-1 sm:flex-none text-sm"
        >
          <Sparkles size={16} className="mr-2" />
          {canCreateCard ? 'Create New Card' : 'Daily Limit Reached'}
        </Button>
      </div>

      {!canCreateCard && nextCardTime && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 mb-4">
          <p className="text-yellow-400 text-sm">
            You've reached your daily limit. You can create another card at {nextCardTime}.
          </p>
        </div>
      )}

      {/* My Created Cards */}
      <div>
        <h3 className="text-lg font-bold mb-3 text-white">My Created Cards</h3>
        {myCards.length === 0 ? (
          <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-4xl mb-2">🎴</div>
            <p className="text-gray-400">No cards created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {myCards.map((card) => (
              <div
                key={card.id}
                className="relative cursor-pointer"
                onClick={() => openEditModal(card)}
              >
                <PlayerCard
                  player={card}
                  motmBoost={0}
                />
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-400">{card.stats.vote_count} votes</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCardModal}
        onClose={closeCardModal}
        title={modalMode === 'create' ? 'Create New Card' : 'Edit Card'}
      >
        <form onSubmit={handleSubmitCard} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Card Name</label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Jersey Number (1-99)</label>
            <input
              type="number"
              min="1"
              max="99"
              value={cardPlayerNumber}
              onChange={(e) => setCardPlayerNumber(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Nationality (optional)</label>
            <select
              value={cardNationality}
              onChange={(e) => setCardNationality(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            >
              <option value="">Select country...</option>
              {COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>{country.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Position</label>
            <select
              value={cardPosition}
              onChange={(e) => setCardPosition(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            >
              <option value="GK">GK - Goalkeeper</option>
              <option value="CB">CB - Center Back</option>
              <option value="LB">LB - Left Back</option>
              <option value="RB">RB - Right Back</option>
              <option value="CDM">CDM - Defensive Mid</option>
              <option value="CM">CM - Center Mid</option>
              <option value="CAM">CAM - Attacking Mid</option>
              <option value="LW">LW - Left Wing</option>
              <option value="RW">RW - Right Wing</option>
              <option value="ST">ST - Striker</option>
              <option value="CF">CF - Center Forward</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Secondary Positions (optional)</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {POSITION_OPTIONS.filter(pos => pos !== cardPosition).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => toggleSecondaryPosition(pos)}
                  className={`px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                    cardSecondaryPositions.includes(pos)
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'bg-gray-700 border-gray-600 hover:border-green-500 text-white'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Card Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={cardColor}
                onChange={(e) => setCardColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-600"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={cardColor}
                  onChange={(e) => setCardColor(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  placeholder="#f59e0b"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Photo (optional)</label>
            <div className="flex items-center gap-3">
              {cardPhotoPreview && (
                <img
                  src={cardPhotoPreview}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-full border-2 border-gray-600"
                />
              )}
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg hover:border-green-500 transition-colors">
                  <Upload size={14} className="text-white" />
                  <span className="text-sm text-white">
                    {cardPhotoFile ? cardPhotoFile.name : cardPhotoPreview ? 'Change photo...' : 'Upload photo...'}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Photo Position</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Horizontal Offset (X)</label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={cardPhotoOffsetX}
                  onChange={(e) => setCardPhotoOffsetX(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">{cardPhotoOffsetX}px</div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Vertical Offset (Y)</label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={cardPhotoOffsetY}
                  onChange={(e) => setCardPhotoOffsetY(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">{cardPhotoOffsetY}px</div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <Button type="submit" className="w-full text-sm" disabled={saving}>
              <Save size={14} className="mr-2" />
              {saving
                ? modalMode === 'create' ? 'Creating...' : 'Saving...'
                : modalMode === 'create' ? 'Create Card' : 'Save Changes'}
            </Button>
            {modalMode === 'edit' && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDeleteCard(editingCardId!)}
                  className="flex-1 text-sm border-red-600 text-red-400 hover:bg-red-900/30"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeCardModal}
                  className="flex-1 text-sm"
                >
                  Cancel
                </Button>
              </div>
            )}
            {modalMode === 'create' && (
              <Button
                type="button"
                variant="outline"
                onClick={closeCardModal}
                className="w-full text-sm"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        <ImageCropModal
          isOpen={showCropModal}
          onClose={() => setShowCropModal(false)}
          imageSrc={cardPhotoPreview || ''}
          onCropComplete={handleCropComplete}
          onSkipCrop={handleSkipCrop}
          originalFile={cardPhotoFile!}
        />
      </Modal>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Card"
      >
        <div className="space-y-4">
          <p className="text-white">Are you sure you want to delete this card? This action cannot be undone.</p>
          <div className="flex gap-2">
            <Button
              onClick={confirmDeleteCard}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
