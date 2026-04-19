import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Lightbulb, ClipboardCheck, CalendarRange, Library, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: BookOpen, label: 'Lessons', color: 'teal' },
  { to: '/scheme', icon: CalendarRange, label: 'Scheme', color: 'indigo' },
  { to: '/curriculum', icon: Library, label: 'Library', color: 'emerald' },
  { to: '/activities', icon: Lightbulb, label: 'Activities', color: 'amber' },
  { to: '/assessments', icon: ClipboardCheck, label: 'Tests', color: 'pink' },
  { to: '/settings', icon: Settings, label: 'Settings', color: 'blue' },
] as const

const colorClasses = {
  teal: 'text-teal-500 bg-teal-50',
  amber: 'text-amber-500 bg-amber-50',
  pink: 'text-pink-500 bg-pink-50',
  blue: 'text-blue-500 bg-blue-50',
  indigo: 'text-indigo-500 bg-indigo-50',
  emerald: 'text-emerald-500 bg-emerald-50',
}

const TAP = { scale: 0.95 }
const ACTIVE_Y = { y: -2 }
const INACTIVE_Y = { y: 0 }
const SPRING = { type: 'spring' as const, stiffness: 500 }

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-slate-200 safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-2">
        {navItems.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1"
          >
            {({ isActive }) => (
              <motion.div
                whileTap={TAP}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all ${
                  isActive ? colorClasses[color] : 'text-slate-400'
                }`}
              >
                <motion.div
                  animate={isActive ? ACTIVE_Y : INACTIVE_Y}
                  transition={SPRING}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                </motion.div>
                <span className={`text-xs mt-1 font-medium ${isActive ? '' : 'text-slate-500'}`}>
                  {label}
                </span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default memo(BottomNav)
