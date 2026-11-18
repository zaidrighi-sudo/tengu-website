import Image from 'next/image'
import type { CSSProperties } from 'react'

/** Image for the storefront. CMS uploads at /api/media/file/<id> are served
 * directly as plain  tags; everything else uses next/image without optimization. */
export function StoreImage({
  src,
  alt,
  className,
  width = 900,
  height = 1125,
  sizes,
  priority,
  style,
}: {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  style?: CSSProperties
}) {
  // Orders saved before photos existed can carry an empty source.
  if (!src) return <span className={className} role="img" aria-label={alt} />

  // Admin uploads live at /api/media/file/<id> — serve as plain  to avoid any
  // Next.js image optimization or loader interference.
  if (src.startsWith('/api/media/file/')) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        style={{
          ...style,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      sizes={sizes ?? '(min-width: 64rem) 25vw, 50vw'}
      priority={priority}
      style={style}
      unoptimized={true}
    />
  )
}
