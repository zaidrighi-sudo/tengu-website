const MAX_DIMENSION = 1600
const KEEP_ORIGINAL_TYPES = new Set(['image/gif', 'image/svg+xml'])

export type PreparedImage = { file: File; width?: number; height?: number }

/**
 * Shrinks a phone or camera photo before upload so the stored file stays small.
 * Animated GIFs and SVGs are passed through untouched.
 */
export async function prepareImageUpload(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/') || KEEP_ORIGINAL_TYPES.has(file.type)) {
    return { file }
  }

  const url = URL.createObjectURL(file)
  const image = new Image()

  try {
    image.src = url
    await image.decode()

    const longest = Math.max(image.naturalWidth, image.naturalHeight)
    if (!longest) return { file }

    const scale = Math.min(1, MAX_DIMENSION / longest)
    const width = Math.round(image.naturalWidth * scale)
    const height = Math.round(image.naturalHeight * scale)

    // Small pictures are already fine; avoid re-encoding them.
    if (scale === 1 && file.size <= 350 * 1024) {
      return { file, width, height }
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return { file, width, height }

    context.drawImage(image, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
    if (!blob || blob.size >= file.size) return { file, width, height }

    const name = `${file.name.replace(/\.[^.]+$/, '') || 'image'}.webp`
    return { file: new File([blob], name, { type: 'image/webp' }), width, height }
  } catch {
    // Unsupported format (e.g. HEIC). Upload the original and let the server decide.
    return { file }
  } finally {
    URL.revokeObjectURL(url)
  }
}
