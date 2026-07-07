import { PlayerWithStats } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PlayerCardProps {
  player: PlayerWithStats
  onClick?: () => void
}

export function PlayerCard({ player, onClick }: PlayerCardProps) {
  const overall = Math.round(
    (player.stats.pace +
      player.stats.shooting +
      player.stats.passing +
      player.stats.dribbling +
      player.stats.defending +
      player.stats.physical) / 6
  )

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

  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase()
    if (['ST', 'CF', 'LW', 'RW'].includes(pos)) return 'bg-red-500'
    if (['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(pos)) return 'bg-green-500'
    if (['CB', 'LB', 'RB'].includes(pos)) return 'bg-purple-500'
    if (pos === 'GK') return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  return (
    <div 
      onClick={onClick}
      className="relative overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-pointer group w-full max-w-[160px] sm:max-w-none rounded-lg"
      style={{ 
        boxShadow: shadowColors.normal,
        background: player.card_color ? `linear-gradient(135deg, ${player.card_color}dd, ${player.card_color}88)` : undefined
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = shadowColors.hover
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = shadowColors.normal
      }}
    >
      {/* Card background gradient */}
      {!player.card_color && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
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
        
        {/* Overall rating and position - FIFA style */}
        <div className="absolute top-2 left-2 flex flex-col items-center">
          <div className={`w-14 h-14 rounded-full border-3 flex items-center justify-center bg-black/30 backdrop-blur-sm ${
            overall >= 90 ? 'border-purple-400' :
            overall >= 80 ? 'border-yellow-400' :
            overall >= 70 ? 'border-gray-300' :
            'border-orange-400'
          }`}>
            <span className="text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{overall}</span>
          </div>
          <div className="mt-1 px-2 py-0.5 rounded text-white font-semibold text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ backgroundColor: player.card_color || '#3b82f6' }}>
            {player.primary_position}
          </div>
        </div>

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
  )
}
