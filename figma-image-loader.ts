'use client'

/**
 * Custom image loader for next/image
 * Uses URLSearchParams for sizing parameters
 */
export default function figmaImageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  // If the src is already an absolute URL or starts with / (local), use it as-is
  if (src.startsWith('http') || src.startsWith('//') || src.startsWith('/')) {
    const params = new URLSearchParams()
    params.set('w', width.toString())
    if (quality) params.set('q', quality.toString())
    return `${src}?${params.toString()}`
  }
  // For relative paths, prepend with a slash
  return `/${src}?w=${width}${quality ? `&q=${quality}` : ''}`
}