import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 to-green-700 rounded-t-xl"></div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">{title}</h2>
        {children}
      </div>
    </div>
  )
}
