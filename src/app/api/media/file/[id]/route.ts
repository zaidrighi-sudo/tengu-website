import { GET as serveFileHandler } from "@/features/media/serve-file"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return serveFileHandler(request, ctx)
}
