export type DeviceKind = 'ios' | 'android' | 'desktop'

// iOS forces every browser (Safari, Chrome, Edge…) onto WebKit, which caps each
// tab at ~1.5–2 GB. MediaPipe's converted-model loader peaks at roughly 3× the
// model size during the JS-side concat → WASM copy, so a 1.87 GB model can't
// initialize on iOS without crashing the tab. We detect iOS up front and show
// a helpful message instead of letting users burn 1.87 GB of bandwidth before
// the crash.
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  // iPadOS 13+ reports as Mac in the UA string but exposes touch points.
  if (ua.includes('Mac') && navigator.maxTouchPoints > 1) return true
  return false
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

export function detectDevice(): DeviceKind {
  if (isIOS()) return 'ios'
  if (isAndroid()) return 'android'
  return 'desktop'
}

// True when the bundle is running inside the Capacitor native shell (the
// installed APK / future iOS app). Capacitor injects window.Capacitor at
// runtime; checking for it avoids pulling @capacitor/core into the web
// bundle just to read this flag.
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return typeof cap?.isNativePlatform === 'function' && cap.isNativePlatform()
}
