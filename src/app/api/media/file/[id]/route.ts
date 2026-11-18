import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB, Media } from '@/lib/mongodb/models'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!mongoose.isValidObjectId(id)) {
    return new NextResponse('Not found', { status: 404 })
  }

  await connectDB()
  const doc: any = await Media.findById(id).select('+data filename mimeType url filesize').lean()

  if (!doc) {
    return new NextResponse('Not found', { status: 404 })
  }

  const rawData = doc.data
  let data: Buffer | null = null

  if (rawData) {
    try {
      if (Buffer.isBuffer(rawData)) {
        data = rawData
      } else if (rawData.constructor?.name === 'Binary') {
        // BSON Binary wraps the real bytes in `buffer`; passing the Binary
        // itself to Buffer.from() yields an empty buffer and a 404.
        const buf = rawData.buffer
        if (buf instanceof ArrayBuffer) {
          data = Buffer.from(buf)
        } else if (Array.isArray(buf)) {
          data = Buffer.from(buf)
        } else if (buf instanceof Uint8Array) {
          data = Buffer.from(buf)
        } else {
          data = Buffer.from(buf as any)
        }
      } else if (Array.isArray(rawData) && rawData.length > 0 && typeof rawData[0] === 'number') {
        data = Buffer.from(rawData as number[])
      } else if (typeof rawData === 'object' && rawData.type === 'Buffer' && Array.isArray(rawData.data)) {
        data = Buffer.from(rawData.data as number[])
      } else {
        data = Buffer.from(rawData as any)
      }
    } catch {
      data = null
    }
  }

  if (data && data.length > 0) {
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Length': String(data.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }

  const fallback = doc.url
  if (fallback && !fallback.startsWith(`/api/media/file/${id}`)) {
    return NextResponse.redirect(new URL(fallback, request.url), 307)
  }

  return new NextResponse('Not found', { status: 404 })
}
