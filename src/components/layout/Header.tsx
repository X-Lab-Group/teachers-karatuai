import { memo } from 'react'
import { Wifi, WifiOff, Cpu, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { useModelStatus } from '../../hooks/useModel'

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
      <div className="px-4 py-3 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={LOGO_HOVER}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg"
          >
            <Sparkles size={20} className="text-white" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">KaratuAI</h1>
            <p className="text-xs text-slate-500">Teacher's Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ModelStatusBadge />
            <OnlineStatusBadge />
          </div>
        </div>
      </div>
    </motion.header>
  )
}

export default memo(Header)
