import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg"
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  if (!isOpen) return null

  const sizeClasses: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div className={`relative w-full ${sizeClasses[size]} bg-amber-100 border-4 border-stone-900 rounded-lg shadow-[8px_8px_0_rgba(0,0,0,1)] overflow-hidden`}>
        <div className="bg-stone-800 px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-amber-100 tracking-wide">
            {title}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="p-1 hover:bg-stone-700 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-amber-400" />
          </button>
        </div>
        <div className="h-2 bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-600" />
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
