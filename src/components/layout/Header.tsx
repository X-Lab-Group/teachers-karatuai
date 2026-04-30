import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import { Wifi, WifiOff, Cpu, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { useModelStatus } from '../../hooks/useModel'
import Logo from '../Logo'

const HEADER_INITIAL = { opacity: 0, y: -20 }
const HEADER_ANIMATE = { opacity: 1, y: 0 }
const LOGO_HOVER = { scale: 1.1, rotate: 5 }
const ICON_HOVER = { scale: 1.1 }

function ModelStatusBadge() {
  const { status, progress, isReady } = useModelStatus()
  const isDownloading = status === 'downloading'

  if (isDownloading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full">
        <span className="loading loading-spinner loading-xs text-amber-500" />
        <span className="text-xs font-medium text-amber-600">{Math.round(progress)}%</span>
      </div>
    )
  }

  return (
    <motion.div
      whileHover={ICON_HOVER}
      className={`p-2 rounded-full ${
        isReady ? 'bg-teal-50 text-teal-500' : 'bg-slate-100 text-slate-400'
      }`}
      title={isReady ? 'AI Ready' : 'AI Not Ready'}
    >
      <Cpu size={18} />
    </motion.div>
  )
}

const OnlineStatusBadge = memo(function OnlineStatusBadge() {
  const isOnline = useOnlineStatus()
  return (
    <motion.div
      whileHover={ICON_HOVER}
      className={`p-2 rounded-full ${
        isOnline ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'
      }`}
      title={isOnline ? 'Online' : 'Offline'}
    >
      {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
    </motion.div>
  )
})

function Header() {
  return (
    <motion.header
      initial={HEADER_INITIAL}
      animate={HEADER_ANIMATE}
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200"
    >
      <div className="px-4 py-3 flex items-center justify-between gap-3 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          <motion.div
            whileHover={LOGO_HOVER}
            className="w-10 h-10 shrink-0 flex items-center justify-center"
          >
            <Logo size={40} />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-800 truncate">KaratuAI</h1>
            <p className="hidden sm:block text-xs text-slate-500 truncate">Teacher's Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ModelStatusBadge />
          <OnlineStatusBadge />
          <NavLink to="/settings" aria-label="Settings">
            {({ isActive }) => (
              <motion.div
                whileHover={ICON_HOVER}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-full transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-500'
                    : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-500'
                }`}
              >
                <Settings size={18} />
              </motion.div>
            )}
          </NavLink>
        </div>
      </div>
    </motion.header>
  )
}

export default memo(Header)
