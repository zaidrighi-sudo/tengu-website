import mongoose from 'mongoose'

const MONGODB_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017/tengu'

if (!MONGODB_URI) {
  throw new Error('Please define the DATABASE_URI environment variable')
}

// Cache connection in global scope for Next.js hot reloading
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongooseCache: MongooseCache | undefined
}

const cached = global.mongooseCache ??= { conn: null, promise: null }

export async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m)
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB