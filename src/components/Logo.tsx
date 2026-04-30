interface LogoProps {
  size?: number
  className?: string
  alt?: string
}

export default function Logo({ size = 32, className = '', alt = 'KaratuAI' }: LogoProps) {
  return (
    <img
      src="/karatuai-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}
