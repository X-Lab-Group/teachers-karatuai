import { memo, type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  variant?: 'default' | '3d'
  hover?: boolean
  delay?: number
  className?: string
}

const INITIAL = { opacity: 0, y: 20 }
const ANIMATE = { opacity: 1, y: 0 }
const HOVER = { scale: 1.02, y: -8 }
const NO_HOVER = {}
const MAX_STAGGER_DELAY = 0.4

function Card({
  title,
  subtitle,
  actions,
  children,
  variant = 'default',
  hover = true,
  delay = 0,
  className = '',
}: CardProps) {
  const baseClasses =
    'bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden'
  const variantClasses = variant === '3d' ? 'card-3d' : ''
  const transition = {
    duration: 0.4,
    delay: Math.min(delay * 0.05, MAX_STAGGER_DELAY),
    ease: 'easeOut' as const,
  }

  return (
    <motion.div
      initial={INITIAL}
      animate={ANIMATE}
      transition={transition}
      whileHover={hover ? HOVER : NO_HOVER}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      <div className="p-6 md:p-8">
        {(title || subtitle) && (
          <div className="mb-4">
            {title && (
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-slate-500 text-sm md:text-base mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
        {actions && <div className="flex justify-end gap-3 mt-6">{actions}</div>}
      </div>
    </motion.div>
  )
}

export default memo(Card)
