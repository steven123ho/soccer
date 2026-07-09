'use client'

import { cn } from '@/lib/utils'

interface SegmentedBarProps {
  value: number
  onChange: (value: number) => void
  segments: number
  labels?: string[]
  className?: string
  disabled?: boolean
  colors?: string[]
  showLabels?: boolean
}

export function SegmentedBar({ value, onChange, segments, labels, className, disabled = false, colors, showLabels = true }: SegmentedBarProps) {
  const defaultColors = segments === 3 
    ? ['bg-red-500', 'bg-orange-500', 'bg-green-500']
    : ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
  const barColors = colors || defaultColors

  return (
    <div className={cn('w-full', className)}>
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, index) => {
          const segmentValue = index + 1
          const isActive = segmentValue <= value
          const colorIndex = Math.min(index, barColors.length - 1)
          return (
            <button
              key={index}
              type="button"
              onClick={() => !disabled && onChange(segmentValue)}
              disabled={disabled}
              className={cn(
                'flex-1 h-3 rounded-sm transition-all duration-200',
                isActive ? barColors[colorIndex] : 'bg-gray-700',
                !disabled && 'hover:opacity-80 cursor-pointer',
                disabled && 'cursor-not-allowed'
              )}
              aria-label={labels?.[index]}
            />
          )
        })}
      </div>
      {showLabels && labels && (
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          {labels.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
      )}
    </div>
  )
}
