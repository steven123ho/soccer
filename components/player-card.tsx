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
      className="relative overflow-hidden bg-black rounded-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group w-full"
      style={{ boxShadow: shadowColors.normal }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = shadowColors.hover
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = shadowColors.normal
      }}
    >
      {/* Photo background */}
      <div className="aspect-[2/3] relative overflow-hidden bg-gradient-to-br from-gray-900 to-black">
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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-6xl text-white/50">⚽</div>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        
        {/* Overall rating badge */}
        <div className="absolute top-3 left-3">
          <div className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{overall}</span>
          </div>
        </div>

        {/* Position badge */}
        <div className="absolute top-3 right-3">
          <div className="px-3 py-1.5 rounded-full border-2 border-white text-white font-bold text-sm drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {player.primary_position}
          </div>
        </div>

        {/* Player name above stats */}
        <div className="absolute bottom-32 sm:bottom-36 left-0 right-0 px-3 sm:px-4">
          <h3 className="text-base sm:text-lg font-black text-white drop-shadow-lg text-center leading-tight">{player.name}</h3>
        </div>

        {/* Stats */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'PAC', value: player.stats.pace },
              { label: 'SHO', value: player.stats.shooting },
              { label: 'PAS', value: player.stats.passing },
              { label: 'DRI', value: player.stats.dribbling },
              { label: 'DEF', value: player.stats.defending },
              { label: 'PHY', value: player.stats.physical },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xs font-semibold text-white/80">{stat.label}</div>
                <div className="text-lg font-bold text-white">{stat.value}</div>
              </div>
            ))}
          </div>
          
          {player.stats.vote_count > 0 && (
            <div className="text-center mt-2 text-xs text-white/80 font-medium">
              ⭐ {player.stats.vote_count} {player.stats.vote_count === 1 ? 'vote' : 'votes'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
