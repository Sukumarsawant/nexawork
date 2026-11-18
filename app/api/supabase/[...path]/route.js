import { proxyPreviewRequest } from '@/lib/server/preview-proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function handle(request, { params }) {
  return proxyPreviewRequest(request, (await params).path)
}

export { handle as GET, handle as HEAD, handle as POST, handle as PUT, handle as PATCH, handle as DELETE }
