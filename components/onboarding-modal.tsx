'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { Upload, LogOut } from 'lucide-react'
import { ImageCropModal } from './image-crop-modal'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [name, setName] = useState('')
  const [position, setPosition] = useState('CM')
  const [secondaryPositions, setSecondaryPositions] = useState<string[]>([])
  const [playerNumber, setPlayerNumber] = useState('')
  const [nationality, setNationality] = useState('')
  const [cardColor, setCardColor] = useState('#f59e0b')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const POSITION_OPTIONS = [
    'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'
  ]

  const COUNTRIES = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Algeria' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BA', name: 'Bosnia' },
    { code: 'BR', name: 'Brazil' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CA', name: 'Canada' },
    { code: 'CL', name: 'Chile' },
    { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'DK', name: 'Denmark' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' },
    { code: 'EE', name: 'Estonia' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GR', name: 'Greece' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'LA', name: 'Laos' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MT', name: 'Malta' },
    { code: 'MX', name: 'Mexico' },
    { code: 'MK', name: 'North Macedonia' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'KP', name: 'North Korea' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
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
    { code: 'SY', name: 'Syria' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'TR', name: 'Turkey' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VA', name: 'Vatican City' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'YE', name: 'Yemen' },
  ]

  const toggleSecondaryPosition = (pos: string) => {
    setSecondaryPositions(prev =>
      prev.includes(pos)
        ? prev.filter(p => p !== pos)
        : [...prev, pos]
    )
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], 'cropped-photo.jpg', { type: 'image/jpeg' })
    setPhotoFile(croppedFile)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(croppedFile)
  }

  const handleSkipCrop = (originalFile: File) => {
    setPhotoFile(originalFile)
    setShowCropModal(false)
  }

  const uploadPhoto = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let imageUrl: string | null = null
      if (photoFile) {
        imageUrl = await uploadPhoto(photoFile, user.id)
      }

      const { error } = await supabase.from('players').insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        name,
        primary_position: position,
        secondary_positions: secondaryPositions,
        player_number: parseInt(playerNumber) || null,
        nationality: nationality || null,
        image_url: imageUrl,
        rarity: 'gold',
        card_color: cardColor,
      })

      if (error) throw error

      onComplete()
      onClose()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Your Player Profile">
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Your Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-sm"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Jersey Number (1-99)</label>
          <input
            type="number"
            min="1"
            max="99"
            value={playerNumber}
            onChange={(e) => setPlayerNumber(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-sm"
            placeholder="10"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Nationality (optional)</label>
          <select
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-sm"
          >
            <option value="">Select country...</option>
            {COUNTRIES.map(country => (
              <option key={country.code} value={country.code}>{country.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Primary Position *</label>
          <select
            value={position}
            disabled={loading}
            onChange={(e) => setPosition(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-sm"
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
          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Secondary Positions (optional)</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {POSITION_OPTIONS.filter(pos => pos !== position).map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => toggleSecondaryPosition(pos)}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                  secondaryPositions.includes(pos)
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
          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Card Shadow Color</label>
          <div className="flex items-center gap-3 sm:gap-4">
            <input
              type="color"
              value={cardColor}
              onChange={(e) => setCardColor(e.target.value)}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg cursor-pointer border-2 border-gray-600"
            />
            <div className="flex-1">
              <input
                type="text"
                value={cardColor}
                onChange={(e) => setCardColor(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-sm"
                placeholder="#f59e0b"
              />
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Choose the color for your player card shadow</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Photo (optional)</label>
          <div className="flex items-center gap-3 sm:gap-4">
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Preview"
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full border-2 border-gray-600"
              />
            )}
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-card border border-gray-600 rounded-lg hover:border-primary transition-colors">
                <Upload size={14} className="sm:size-16" />
                <span className="text-xs sm:text-sm">{photoFile ? photoFile.name : 'Choose photo...'}</span>
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

        <Button type="submit" className="w-full text-sm sm:text-base" disabled={loading}>
          {loading ? 'Creating Profile...' : 'Create Profile'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          className="w-full text-sm sm:text-base"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </Button>
      </form>

      <ImageCropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        imageSrc={photoPreview || ''}
        onCropComplete={handleCropComplete}
        onSkipCrop={handleSkipCrop}
        originalFile={photoFile!}
      />
    </Modal>
  )
}
