'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

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
  const ref = useRef<HTMLImageElement | null>(null)
  // Photos are hidden only after hydration and only while their pixels are
  // still missing, then faded in. Anything already cached stays on screen, so
  // the page never flashes; priority images are left alone for LCP.
  const [phase, setPhase] = useState<'idle' | 'pending' | 'in'>('idle')

  useEffect(() => {
    if (priority) return
    const node = ref.current
    if (node?.complete && node.naturalWidth > 0) return
    setPhase('pending')
  }, [src, priority])

  const motion = !priority
  const cls = [
    className,
    motion && 'store-img',
    motion && phase === 'pending' && 'is-pending',
    motion && phase === 'in' && 'is-in',
  ]
    .filter(Boolean)
    .join(' ')

  const onLoad = () => setPhase((current) => (current === 'pending' ? 'in' : current))
  const onError = () => setPhase((current) => (current === 'pending' ? 'idle' : current))

  // Orders saved before photos existed can carry an empty source.
  if (!src) return <span className={className} role="img" aria-label={alt} />

  // Admin uploads live at /api/media/file/<id> — serve as plain  to avoid any
  // Next.js image optimization or loader interference.
  if (src.startsWith('/api/media/file/')) {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cls}
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
        onLoad={onLoad}
        onError={onError}
      />
    )
  }

  return (
    <Image
      ref={ref}
      src={src}
      alt={alt}
      className={cls}
      width={width}
      height={height}
      sizes={sizes ?? '(min-width: 64rem) 25vw, 50vw'}
      priority={priority}
      style={style}
      unoptimized={true}
      onLoad={onLoad}
      onError={onError}
    />
  )
}
