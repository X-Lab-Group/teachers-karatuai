import { motion } from 'framer-motion'
import { Cpu, RefreshCw, Wifi, HardDrive } from 'lucide-react'
import { useModel } from '../hooks/useModel'
import { Button } from './ui'

export default function ModelLoadingScreen() {
  const { status, progress, error, retry } = useModel()

  if (status === 'ready') return null

  const isAnimating = status === 'downloading' || status === 'loading' || status === 'checking'

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Checking for cached model...'
      case 'downloading':
        return 'Downloading AI model for offline use. This only happens once.'
      case 'loading':
        return 'Loading AI model from cache...'
      case 'error':
        return 'Connection Issue'
      default:
        return 'Loading AI Model'
    }
  }

  const getTitle = () => {
    if (status === 'error') return 'Connection Issue'
    if (status === 'loading') return 'Loading from Cache'
    if (status === 'downloading') return 'Downloading AI Model'
    return 'Loading AI Model'
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-6 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm"
      >
        <motion.div
          animate={{ rotate: isAnimating ? 360 : 0 }}
          transition={{ duration: 2, repeat: isAnimating ? Infinity : 0, ease: 'linear' }}
          className="w-20 h-20 rounded-3xl bg-teal-100 flex items-center justify-center mx-auto mb-6"
        >
          {status === 'loading' ? (
            <HardDrive size={40} className="text-teal-600" />
          ) : (
            <Cpu size={40} className="text-teal-600" />
          )}
        </motion.div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {getTitle()}
        </h1>

        {(status === 'downloading' || status === 'loading' || status === 'checking') && (
          <>
            <p className="text-slate-500 mb-6">
              {getStatusText()}
            </p>
            <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
              <motion.div
                className="bg-teal-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(progress, 5)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {status === 'downloading' && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <Wifi size={14} />
                <span>~1.9GB download</span>
              </div>
            )}
            {status === 'loading' && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <HardDrive size={14} />
                <span>Loading from device storage</span>
              </div>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <p className="text-slate-500 mb-4">
              {error || 'Failed to load the AI model. Please check your internet connection.'}
            </p>
            <Button onClick={retry} icon={<RefreshCw size={18} />}>
              Try Again
            </Button>
          </>
        )}
      </motion.div>
    </div>
  )
}
