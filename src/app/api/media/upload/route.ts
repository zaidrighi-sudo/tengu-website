import { POST as uploadHandler } from "@/features/media/upload"

export const runtime = "nodejs"

export async function POST(request: Request) {
  return uploadHandler(request)
}
