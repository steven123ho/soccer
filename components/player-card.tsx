import { PlayerWithStats } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PlayerCardProps {
  player: PlayerWithStats
  onClick?: () => void
  motmBoost?: number
}

export function PlayerCard({ player, onClick, motmBoost = 0 }: PlayerCardProps) {
  const overall = Math.round(
    (player.stats.pace +
      player.stats.shooting +
      player.stats.passing +
      player.stats.dribbling +
      player.stats.defending +
      player.stats.physical) / 6
  ) + motmBoost

  const getRarityFromRating = (rating: number) => {
    if (rating >= 90) return 'special'
    if (rating >= 80) return 'gold'
    if (rating >= 70) return 'silver'
    return 'bronze'
  }

  const rarity = player.rarity || getRarityFromRating(overall)

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    }
    return { r: 245, g: 158, b: 11 }
  }

  const getShadowColor = () => {
    if (player.card_color) {
      const rgb = hexToRgb(player.card_color)
      return {
        normal: `8px 8px 0px 0px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
        hover: `12px 12px 0px 0px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`
      }
    }
    
    // Fallback to rarity colors
    if (overall >= 90) return {
      normal: '8px 8px 0px 0px rgba(168,85,247,0.4)',
      hover: '12px 12px 0px 0px rgba(168,85,247,0.5)'
    }
    if (overall >= 80) return {
      normal: '8px 8px 0px 0px rgba(255,223,0,0.6)',
      hover: '12px 12px 0px 0px rgba(255,223,0,0.7)'
    }
    if (overall >= 70) return {
      normal: '8px 8px 0px 0px rgba(156,163,175,0.4)',
      hover: '12px 12px 0px 0px rgba(156,163,175,0.5)'
    }
    return {
      normal: '8px 8px 0px 0px rgba(251,146,60,0.4)',
      hover: '12px 12px 0px 0px rgba(251,146,60,0.5)'
    }
  }

  const shadowColors = getShadowColor()

  const getGlowColor = () => {
    if (player.card_color) {
      const rgb = hexToRgb(player.card_color)
      return {
        normal: `0 0 15px 3px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`,
        hover: `0 0 20px 5px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`
      }
    }
    
    // Fallback to rarity colors
    if (overall >= 90) return {
      normal: '0 0 15px 3px rgba(168,85,247,0.3)',
      hover: '0 0 20px 5px rgba(168,85,247,0.4)'
    }
    if (overall >= 80) return {
      normal: '0 0 15px 3px rgba(255,223,0,0.3)',
      hover: '0 0 20px 5px rgba(255,223,0,0.4)'
    }
    if (overall >= 70) return {
      normal: '0 0 15px 3px rgba(156,163,175,0.3)',
      hover: '0 0 20px 5px rgba(156,163,175,0.4)'
    }
    return {
      normal: '0 0 15px 3px rgba(251,146,60,0.3)',
      hover: '0 0 20px 5px rgba(251,146,60,0.4)'
    }
  }

  const glowColors = getGlowColor()

  const getCardStyles = () => {
    if (motmBoost > 0) {
      return {
        background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff)',
        borderColor: undefined,
        boxShadow: `0 0 20px 5px ${player.card_color ? `${player.card_color}80` : 'rgba(239, 68, 68, 0.5)'}, 0 0 30px 10px ${player.card_color ? `${player.card_color}60` : 'rgba(249, 115, 22, 0.3)'}, 0 0 40px 15px ${player.card_color ? `${player.card_color}40` : 'rgba(234, 179, 8, 0.2)'}`,
        hoverBoxShadow: `0 0 25px 8px ${player.card_color ? `${player.card_color}99` : 'rgba(239, 68, 68, 0.6)'}, 0 0 35px 12px ${player.card_color ? `${player.card_color}80` : 'rgba(249, 115, 22, 0.4)'}, 0 0 45px 18px ${player.card_color ? `${player.card_color}60` : 'rgba(234, 179, 8, 0.3)'}`,
        className: 'p-[3px] animate-float'
      }
    }

    // Default to gradient-border for regular cards
    return {
      background: `linear-gradient(135deg, ${player.card_color || '#3b82f6'}, ${player.card_color ? adjustColor(player.card_color, 30) : '#8b5cf6'}, ${player.card_color ? adjustColor(player.card_color, -30) : '#1e40af'})`,
      borderColor: undefined,
      boxShadow: glowColors.normal,
      hoverBoxShadow: glowColors.hover,
      className: 'p-[2px] hover:scale-105 hover:-translate-y-2'
    }
  }

  const adjustColor = (hex: string, amount: number) => {
    const rgb = hexToRgb(hex)
    const r = Math.max(0, Math.min(255, rgb.r + amount))
    const g = Math.max(0, Math.min(255, rgb.g + amount))
    const b = Math.max(0, Math.min(255, rgb.b + amount))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  const cardStyles = getCardStyles()

  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase()
    if (['ST', 'CF', 'LW', 'RW'].includes(pos)) return 'bg-red-500'
    if (['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(pos)) return 'bg-green-500'
    if (['CB', 'LB', 'RB'].includes(pos)) return 'bg-purple-500'
    if (pos === 'GK') return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  const isLightColor = (hexColor: string) => {
    // Convert hex to RGB
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5
  }

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden transition-all duration-300 cursor-pointer group w-full max-w-[160px] sm:max-w-none rounded-lg ${cardStyles.className}`}
      style={{ 
        background: cardStyles.background,
        borderColor: cardStyles.borderColor,
        boxShadow: cardStyles.boxShadow
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = cardStyles.hoverBoxShadow
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = cardStyles.boxShadow
      }}
    >
      {/* Inner card wrapper */}
      <div 
        className="w-full h-full rounded-lg relative overflow-hidden"
        style={{
          background: player.card_color ? `linear-gradient(135deg, ${player.card_color}dd, ${player.card_color}88)` : 'linear-gradient(135deg, #1f2937, #111827)'
        }}
      >
        {/* MOTM shine effect - Design 2 */}
        {motmBoost > 0 && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent animate-pulse pointer-events-none z-5" />
        )}
        
        {/* MOTM badge - Design 2 */}
        {motmBoost > 0 && (
          <div 
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold shadow-lg z-10"
            style={{
              background: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6)',
              color: '#ffffff'
            }}
          >
            MOTM
          </div>
        )}
      
      {/* Photo background */}
      <div className="aspect-[2/3] relative overflow-hidden">
        {player.image_url ? (
          <img
            src={player.image_url}
            alt={player.name}
            className="w-full h-full object-cover"
            style={{
              transform: `translate(${player.photo_offset_x || 0}px, ${player.photo_offset_y || 0}px)`,
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
            <div className="text-6xl text-white/30">⚽</div>
          </div>
        )}
        
        {/* Gradient overlay - FIFA style */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        
        {/* Overall rating - FIFA style */}
        <div className="absolute top-2 left-2 flex flex-col items-center">
          <div 
            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center backdrop-blur-sm ${
              motmBoost > 0 ? 'bg-black/40' : 'bg-black/30'
            }`}
            style={{
              borderColor: motmBoost > 0 ? 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff)' : (player.card_color || '#3b82f6')
            }}
          >
            <span 
              className="text-2xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              style={{
                color: '#ffffff'
              }}
            >
              {overall}
            </span>
          </div>
        </div>

        {/* Position - Top right */}
        {motmBoost === 0 && (
          <div 
            className="absolute top-2 right-2 px-2 py-0.5 rounded font-semibold text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            style={{ 
              backgroundColor: player.card_color || '#3b82f6',
              color: isLightColor(player.card_color || '#3b82f6') ? '#000000' : '#ffffff'
            }}
          >
            {player.primary_position}
          </div>
        )}

        {/* Player name - FIFA style */}
        <div className="absolute bottom-[5rem] left-0 right-0 px-3">
          <h3 className="text-sm sm:text-base font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] text-center tracking-wide uppercase">{player.name}</h3>
        </div>

        {/* Stats - Overlay on top of image */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2 sm:p-3">
          <div className="grid grid-cols-2 gap-y-1 gap-x-1">
            {[
              { label: 'PAC', value: player.stats.pace },
              { label: 'SHO', value: player.stats.shooting },
              { label: 'PAS', value: player.stats.passing },
              { label: 'DRI', value: player.stats.dribbling },
              { label: 'DEF', value: player.stats.defending },
              { label: 'PHY', value: player.stats.physical },
            ].map((stat, index) => (
              <div key={stat.label} className={`text-center ${index % 2 === 0 ? 'border-r border-white/20' : ''}`}>
                <div className="text-[10px] sm:text-xs font-semibold text-white">{stat.value} <span className="font-medium text-white/70">{stat.label}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
