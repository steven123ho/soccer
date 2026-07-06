import { PlayerWithStats } from '@/lib/types'
import { Card } from './ui/card'
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

  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase()
    if (['ST', 'CF', 'LW', 'RW'].includes(pos)) return 'bg-red-500'
    if (['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(pos)) return 'bg-green-500'
    if (['CB', 'LB', 'RB'].includes(pos)) return 'bg-blue-500'
    if (pos === 'GK') return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  return (
    <Card variant={rarity as any} onClick={onClick} className="cursor-pointer min-h-[300px] flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div className="text-center">
          <div className="text-4xl font-bold">{overall}</div>
          <div className={cn('text-xs px-2 py-1 rounded text-white font-bold', getPositionColor(player.primary_position))}>
            {player.primary_position}
          </div>
        </div>
        {player.player_number && (
          <div className="text-2xl font-bold text-yellow-400">#{player.player_number}</div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center mb-3">
        {player.image_url ? (
          <img
            src={player.image_url}
            alt={player.name}
            className="w-24 h-24 object-cover rounded-full border-2 border-white/30"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : (
          <div className="text-6xl">⚽</div>
        )}
      </div>

      <div className="text-center font-bold text-lg mb-3">{player.name}</div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-center">
          <div className="text-xs text-gray-400">PAC</div>
          <div className="font-bold">{player.stats.pace}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400">SHO</div>
          <div className="font-bold">{player.stats.shooting}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400">PAS</div>
          <div className="font-bold">{player.stats.passing}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400">DRI</div>
          <div className="font-bold">{player.stats.dribbling}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400">DEF</div>
          <div className="font-bold">{player.stats.defending}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400">PHY</div>
          <div className="font-bold">{player.stats.physical}</div>
        </div>
      </div>

      {player.stats.vote_count > 0 && (
        <div className="text-center mt-3 text-sm text-yellow-400">
          ⭐ {player.stats.vote_count} {player.stats.vote_count === 1 ? 'vote' : 'votes'}
        </div>
      )}
    </Card>
  )
}
