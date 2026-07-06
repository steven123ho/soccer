import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bronze' | 'silver' | 'gold' | 'special'
}

export function Card({ className, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 transition-all hover:scale-105',
        {
          'bg-card border-gray-600': variant === 'default',
          'bg-gradient-to-br from-amber-900 to-amber-800 border-amber-600': variant === 'bronze',
          'bg-gradient-to-br from-gray-400 to-gray-300 border-gray-200': variant === 'silver',
          'bg-gradient-to-br from-yellow-500 to-yellow-400 border-yellow-300': variant === 'gold',
          'bg-gradient-to-br from-purple-600 to-pink-500 border-purple-400': variant === 'special',
        },
        className
      )}
      {...props}
    />
  )
}
