import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const catalog = await prisma.subSheet.findUnique({ where: { shareToken: token } })
    if (!catalog) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (catalog.expiresAt && catalog.expiresAt < new Date()) {
      return NextResponse.json({ error: "Expired", expired: true }, { status: 410 })
    }

    // Increment view count
    await prisma.subSheet.update({
      where: { shareToken: token },
      data: { viewCount: { increment: 1 } },
    }).catch(() => { /* ignore */ })

    // Don't expose password in response
    const { password: _pw, ...safe } = catalog
    return NextResponse.json({ ...safe, requiresPassword: catalog.passwordProtected })
  } catch {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const { password } = await request.json()
    const catalog = await prisma.subSheet.findUnique({ where: { shareToken: token } })
    if (!catalog) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (!catalog.passwordProtected) return NextResponse.json({ success: true })

    if (catalog.password === password) {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  } catch {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 })
  }
}
