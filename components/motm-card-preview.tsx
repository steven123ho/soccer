'use client'

import { PlayerWithStats } from '@/lib/types'

interface MOTMCardPreviewProps {
  player?: PlayerWithStats
  motmBoost?: number
}

const samplePlayer: PlayerWithStats = {
  id: 'sample',
  name: 'Sample Player',
  primary_position: 'ST',
  secondary_positions: ['CF', 'LW'],
  player_number: 10,
  nationality: null,
  image_url: null,
  rarity: 'gold',
  card_color: null,
  photo_offset_x: 0,
  photo_offset_y: 0,
  user_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  stats: {
    player_id: 'sample',
    updated_at: new Date().toISOString(),
    pace: 85,
    shooting: 90,
    passing: 82,
    dribbling: 88,
    defending: 45,
    physical: 75,
    skill_moves: 4,
    weak_foot: 4,
    vision: 84,
    work_rate: 75,
    stamina: 80,
    touch: 85,
    mindset: 3,
    vote_count: 10,
  }
}

export function MOTMCardPreview({ player = samplePlayer, motmBoost = 10 }: MOTMCardPreviewProps) {
  const overall = Math.round(
    (player.stats.pace +
      player.stats.shooting +
      player.stats.passing +
      player.stats.dribbling +
      player.stats.defending +
      player.stats.physical) / 6
  ) + motmBoost

  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase()
    if (['ST', 'CF', 'LW', 'RW'].includes(pos)) return 'bg-red-500'
    if (['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(pos)) return 'bg-green-500'
    if (['CB', 'LB', 'RB'].includes(pos)) return 'bg-purple-500'
    if (pos === 'GK') return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  // Design 1: Gold border with glow
  const Design1 = () => (
    <div className="relative overflow-hidden rounded-lg cursor-pointer w-full max-w-[160px]">
      <div 
        className="aspect-[2/3] relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-4 border-yellow-400 shadow-[0_0_20px_5px_rgba(250,204,21,0.6)]"
      >
        {/* Gold shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 via-transparent to-transparent animate-pulse pointer-events-none" />
        
        {/* MOTM badge */}
        <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-0.5 rounded-full text-xs font-bold shadow-lg z-10">
          MOTM
        </div>

        {/* Overall rating */}
        <div className="absolute top-2 left-2 w-14 h-14 rounded-full border-4 border-yellow-400 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <span className="text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{overall}</span>
        </div>

        {/* Position */}
        <div className="absolute top-16 left-2 px-2 py-0.5 rounded text-white font-semibold text-xs bg-yellow-500">
          {player.primary_position}
        </div>

        {/* Player name */}
        <div className="absolute bottom-[5rem] left-0 right-0 px-3">
          <h3 className="text-sm font-bold text-white text-center tracking-wide uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{player.name}</h3>
        </div>

        {/* Stats */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2">
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
                <div className="text-[10px] font-semibold text-white">{stat.value} <span className="font-medium text-white/70">{stat.label}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // Design 2: Rainbow gradient border
  const Design2 = () => (
    <div className="relative overflow-hidden rounded-lg cursor-pointer w-full max-w-[160px]">
      <div 
        className="aspect-[2/3] relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-[3px]"
        style={{
          background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff)',
        }}
      >
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg relative overflow-hidden">
          {/* Rainbow shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent animate-pulse pointer-events-none" />
          
          {/* MOTM badge */}
          <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg z-10">
            MOTM
          </div>

          {/* Overall rating */}
          <div className="absolute top-2 left-2 w-14 h-14 rounded-full border-4 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            style={{
              borderColor: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00)',
            }}
          >
            <span className="text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{overall}</span>
          </div>

          {/* Position */}
          <div className="absolute top-16 left-2 px-2 py-0.5 rounded text-white font-semibold text-xs bg-gradient-to-r from-red-500 to-yellow-500">
            {player.primary_position}
          </div>

          {/* Player name */}
          <div className="absolute bottom-[5rem] left-0 right-0 px-3">
            <h3 className="text-sm font-bold text-white text-center tracking-wide uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{player.name}</h3>
          </div>

          {/* Stats */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2">
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
                  <div className="text-[10px] font-semibold text-white">{stat.value} <span className="font-medium text-white/70">{stat.label}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Design 3: Starburst background
  const Design3 = () => (
    <div className="relative overflow-hidden rounded-lg cursor-pointer w-full max-w-[160px]">
      <div className="aspect-[2/3] relative bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg border-4 border-yellow-300 shadow-[0_0_30px_10px_rgba(234,179,8,0.5)]">
        {/* Starburst pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-yellow-300 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        {/* MOTM badge */}
        <div className="absolute top-2 right-2 bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold shadow-lg z-10">
          ⭐ MOTM ⭐
        </div>

        {/* Overall rating */}
        <div className="absolute top-2 left-2 w-14 h-14 rounded-full border-4 border-yellow-300 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <span className="text-2xl font-bold text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{overall}</span>
        </div>

        {/* Position */}
        <div className="absolute top-16 left-2 px-2 py-0.5 rounded text-yellow-900 font-semibold text-xs bg-yellow-300">
          {player.primary_position}
        </div>

        {/* Player name */}
        <div className="absolute bottom-[5rem] left-0 right-0 px-3">
          <h3 className="text-sm font-bold text-yellow-100 text-center tracking-wide uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{player.name}</h3>
        </div>

        {/* Stats */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2">
          <div className="grid grid-cols-2 gap-y-1 gap-x-1">
            {[
              { label: 'PAC', value: player.stats.pace },
              { label: 'SHO', value: player.stats.shooting },
              { label: 'PAS', value: player.stats.passing },
              { label: 'DRI', value: player.stats.dribbling },
              { label: 'DEF', value: player.stats.defending },
              { label: 'PHY', value: player.stats.physical },
            ].map((stat, index) => (
              <div key={stat.label} className={`text-center ${index % 2 === 0 ? 'border-r border-yellow-300/30' : ''}`}>
                <div className="text-[10px] font-semibold text-yellow-100">{stat.value} <span className="font-medium text-yellow-100/70">{stat.label}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">MOTM Card Designs</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-yellow-400">Design 1: Gold Glow</h3>
          <Design1 />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-purple-400">Design 2: Rainbow Border</h3>
          <Design2 />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-orange-400">Design 3: Starburst</h3>
          <Design3 />
        </div>
      </div>
    </div>
  )
}
