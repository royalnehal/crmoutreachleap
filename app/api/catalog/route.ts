import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import crypto from "crypto"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const catalogs = await prisma.subSheet.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: { select: { name: true } } },
    })

    return NextResponse.json({ catalogs })
  } catch {
    return NextResponse.json({ catalogs: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const shareToken = crypto.randomUUID()

    const catalog = await prisma.subSheet.create({
      data: {
        title: body.title ?? "Untitled Catalog",
        filters: body.filters ?? {},
        visibleColumns: body.visibleColumns ?? [],
        sites: body.sites ?? [],
        shareToken,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        passwordProtected: body.passwordProtected ?? false,
        password: body.password ?? null,
        clientId: body.clientId ?? null,
      },
    })

    return NextResponse.json({ catalog, shareToken, url: `/catalog/${shareToken}` }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create catalog", details: String(error) }, { status: 500 })
  }
}
