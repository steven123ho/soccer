'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from './ui/button'
import { Modal } from './ui/modal'
import { Upload, LogOut, Newspaper } from 'lucide-react'
import { ImageCropModal } from './image-crop-modal'

export function ProfilePage() {
  const [player, setPlayer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showNews, setShowNews] = useState(false)
  const [newsItems, setNewsItems] = useState<any[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPosition, setEditPosition] = useState('CM')
  const [editSecondaryPositions, setEditSecondaryPositions] = useState<string[]>([])
  const [editPlayerNumber, setEditPlayerNumber] = useState('')
  const [editNationality, setEditNationality] = useState('')
  const [editCardColor, setEditCardColor] = useState('#f59e0b')
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)
  const [editPhotoOffsetX, setEditPhotoOffsetX] = useState(0)
  const [editPhotoOffsetY, setEditPhotoOffsetY] = useState(0)
  const [showCropModal, setShowCropModal] = useState(false)
  const [saving, setSaving] = useState(false)

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
    setEditSecondaryPositions(prev =>
      prev.includes(pos)
        ? prev.filter(p => p !== pos)
        : [...prev, pos]
    )
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (showNews) {
      fetchNews()
    }
  }, [showNews])

  const fetchNews = async () => {
    setNewsLoading(true)
    try {
      const response = await fetch('/news.json')
      const data = await response.json()
      setNewsItems(data)
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setNewsLoading(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setPlayer(data)
      if (data) {
        setEditName(data.name)
        setEditPosition(data.primary_position)
        setEditSecondaryPositions(data.secondary_positions || [])
        setEditPlayerNumber(data.player_number?.toString() || '')
        setEditNationality(data.nationality || '')
        setEditCardColor(data.card_color || '#f59e0b')
        setEditPhotoOffsetX(data.photo_offset_x || 0)
        setEditPhotoOffsetY(data.photo_offset_y || 0)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditPhotoPreview(reader.result as string)
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], 'cropped-photo.jpg', { type: 'image/jpeg' })
    setEditPhotoFile(croppedFile)
    const reader = new FileReader()
    reader.onloadend = () => {
      setEditPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(croppedFile)
  }

  const handleSkipCrop = (originalFile: File) => {
    setEditPhotoFile(originalFile)
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !player) throw new Error('Not authenticated')

      let imageUrl = player.image_url
      if (editPhotoFile) {
        imageUrl = await uploadPhoto(editPhotoFile, user.id)
      }

      const { error } = await supabase
        .from('players')
        .update({
          name: editName,
          primary_position: editPosition,
          secondary_positions: editSecondaryPositions,
          player_number: parseInt(editPlayerNumber) || null,
          nationality: editNationality || null,
          image_url: imageUrl,
          card_color: editCardColor,
          photo_offset_x: editPhotoOffsetX,
          photo_offset_y: editPhotoOffsetY,
        })
        .eq('id', player.id)

      if (error) throw error

      await fetchProfile()
      setShowEditModal(false)
      setEditPhotoFile(null)
      setEditPhotoPreview(null)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const NewsContent = () => {
    if (newsLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-400">Loading news...</div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="space-y-4">
          {newsItems.map((item) => (
            <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{item.date}</span>
                    {item.version && (
                      <>
                        <span className="text-gray-600">•</span>
                        <span className="text-xs text-green-400 font-medium">{item.version}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>

        {/* 
          To add a new news item, edit public/news.json:
          {
            "id": "unique-id",
            "date": "YYYY-MM-DD",
            "title": "Your Title",
            "content": "Your content here...",
            "version": "v1.x" // optional
          }
        */}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading profile...</div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚽</div>
        <h3 className="text-xl font-semibold mb-2">No Profile Found</h3>
        <p className="text-gray-400">Create your player profile to get started!</p>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="max-w-md mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">My Profile</h2>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col items-center mb-4 sm:mb-6">
            {player.image_url ? (
              <img
                src={player.image_url}
                alt={player.name}
                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-full border-4 border-green-600 mb-3 sm:mb-4"
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-700 flex items-center justify-center mb-3 sm:mb-4 text-4xl sm:text-5xl">
                ⚽
              </div>
            )}
            <h3 className="text-xl sm:text-2xl font-bold text-white">{player.name}</h3>
            <div className="flex items-center gap-2 text-gray-400 text-sm sm:text-base">
              <span className="text-base sm:text-lg text-white">#{player.player_number || '?'}</span>
              <span>•</span>
              <span className="text-white">{player.primary_position}</span>
              {player.secondary_positions && player.secondary_positions.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-white">{player.secondary_positions.join(', ')}</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Name</label>
              <div className="text-lg font-medium text-white">{player.name}</div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Jersey Number</label>
              <div className="text-lg font-medium text-white">{player.player_number || 'Not set'}</div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Nationality</label>
              <div className="text-lg font-medium text-white">{player.nationality || 'Not set'}</div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Position</label>
              <div className="text-lg font-medium text-white">{player.primary_position}</div>
              {player.secondary_positions && player.secondary_positions.length > 0 && (
                <div className="text-sm text-gray-400 mt-1">
                  Secondary: {player.secondary_positions.join(', ')}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button onClick={() => setShowEditModal(true)} className="w-full">
              Edit Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowNews(true)}
              className="w-full"
            >
              <Newspaper size={16} className="mr-2" />
              News & Updates
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <Modal isOpen={showNews} onClose={() => setShowNews(false)} title="News & Updates">
        <NewsContent />
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Profile">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
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
              value={editPlayerNumber}
              onChange={(e) => setEditPlayerNumber(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Nationality (optional)</label>
            <select
              value={editNationality}
              onChange={(e) => setEditNationality(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            >
              <option value="">Select country...</option>
              {COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>{country.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-white">Position</label>
            <select
              value={editPosition}
              onChange={(e) => setEditPosition(e.target.value)}
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
            <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-white">Secondary Positions (optional)</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {POSITION_OPTIONS.filter(pos => pos !== editPosition).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => toggleSecondaryPosition(pos)}
                  className={`px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                    editSecondaryPositions.includes(pos)
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
            <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-white">Card Shadow Color</label>
            <div className="flex items-center gap-3 sm:gap-4">
              <input
                type="color"
                value={editCardColor}
                onChange={(e) => setEditCardColor(e.target.value)}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg cursor-pointer border-2 border-gray-600"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={editCardColor}
                  onChange={(e) => setEditCardColor(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-sm"
                  placeholder="#f59e0b"
                />
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Choose the color for your player card shadow</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-white">Photo</label>
            <div className="flex items-center gap-3 sm:gap-4">
              {(editPhotoPreview || player.image_url) && (
                <img
                  src={editPhotoPreview || player.image_url}
                  alt="Preview"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full border-2 border-gray-600"
                />
              )}
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg hover:border-green-500 transition-colors">
                  <Upload size={14} className="sm:size-16 text-white" />
                  <span className="text-xs sm:text-sm text-white">{editPhotoFile ? editPhotoFile.name : 'Change photo...'}</span>
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
            <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-white">Photo Position</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Horizontal Offset (X)</label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={editPhotoOffsetX}
                  onChange={(e) => setEditPhotoOffsetX(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">{editPhotoOffsetX}px</div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Vertical Offset (Y)</label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={editPhotoOffsetY}
                  onChange={(e) => setEditPhotoOffsetY(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">{editPhotoOffsetY}px</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1 text-sm sm:text-base" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false)
                setEditPhotoFile(null)
                setEditPhotoPreview(null)
              }}
              className="flex-1 text-sm sm:text-base"
            >
              Cancel
            </Button>
          </div>
        </form>

        <ImageCropModal
          isOpen={showCropModal}
          onClose={() => setShowCropModal(false)}
          imageSrc={editPhotoPreview || ''}
          onCropComplete={handleCropComplete}
          onSkipCrop={handleSkipCrop}
          originalFile={editPhotoFile!}
        />
      </Modal>
    </div>
  )
}
