import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB, Media } from '@/shared/mongodb/models'
import { adminAuth } from '@/features/auth/admin-auth'
import { takeToken } from '@/shared/rate-limit'

/**
 * Admin image upload.
 * Accepts JSON with a base64 data URL and stores the image bytes in the
 * MongoDB `media` collection, served back through /api/media/file/<id>.
 *
 * Only signed-in staff may upload: the route is reachable from the internet,
 * and an open uploader is free storage for anyone who finds it.
 */
export const runtime = 'nodejs'

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const MAX_BASE64_LENGTH = Math.ceil(MAX_UPLOAD_BYTES / 3) * 4 + 1024
const UPLOAD_WINDOW_MS = 10 * 60 * 1000
const UPLOAD_MAX_PER_WINDOW = 60

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/**
 * Detect the real image type from the bytes. The browser-provided mime type is
 * a hint at best: trusting it lets an HTML or SVG payload be stored under an
 * image type and served back from our own origin.
 */
function sniffImageType(bytes: Buffer): string | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return 'image/png'

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }

  if (bytes.subarray(0, 4).toString('ascii') === 'GIF8') return 'image/gif'

  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp'
  }

  if (bytes.length >= 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = bytes.subarray(8, 12).toString('ascii')
    if (brand === 'avif' || brand === 'avis') return 'image/avif'
  }

  return null
}

interface UploadBody {
  base64: string
  filename?: string
  mimeType?: string
}

export async function POST(request: Request) {
  const admin = await adminAuth.currentUser()
  if (!admin) {
    return NextResponse.json({ error: 'Please sign in to the admin dashboard.' }, { status: 401 })
  }

  const quota = takeToken(`media-upload:${admin.id}`, {
    max: UPLOAD_MAX_PER_WINDOW,
    windowMs: UPLOAD_WINDOW_MS,
  })
  if (!quota.ok) {
    return NextResponse.json(
      { error: 'Too many uploads. Please wait a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(quota.retryAfterSeconds) } },
    )
  }

  try {
    await connectDB()

    const body: UploadBody = await request.json()
    const { base64, filename = 'image' } = body

    if (!base64 || typeof base64 !== 'string') {
      return NextResponse.json({ error: 'No image data provided.' }, { status: 400 })
    }
    if (base64.length > MAX_BASE64_LENGTH) {
      return NextResponse.json({ error: 'Images must be 8 MB or smaller.' }, { status: 413 })
    }

    // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
    const base64Data = base64.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '')
    const bytes = Buffer.from(base64Data, 'base64')

    if (bytes.length === 0) {
      return NextResponse.json({ error: 'That file is empty.' }, { status: 400 })
    }
    if (bytes.length > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Images must be 8 MB or smaller.' }, { status: 413 })
    }

    const mimeType = sniffImageType(bytes)
    if (!mimeType) {
      return NextResponse.json(
        { error: 'Only PNG, JPG, WebP, GIF or AVIF images are supported.' },
        { status: 415 },
      )
    }

    const _id = new mongoose.Types.ObjectId()

    const media = await Media.create({
      _id,
      filename: filename.replace(/[^\w.-]+/g, '-').slice(-100) || 'image',
      mimeType,
      filesize: bytes.length,
      url: `/api/media/file/${_id.toString()}`,
      data: bytes,
    })

    return NextResponse.json({
      id: String(media._id),
      url: media.url,
      width: media.width,
      height: media.height,
    })
  } catch (error) {
    console.error('[media/upload] Error:', error)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
