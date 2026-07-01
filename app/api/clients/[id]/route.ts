import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: "desc" }, include: { site: { select: { siteName: true, domain: true } } } },
        liveLinks: { orderBy: { createdAt: "desc" } },
        proposals: { orderBy: { createdAt: "desc" } },
      },
    })
    if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const client = await prisma.client.update({ where: { id }, data: body })
    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.client.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete", details: String(error) }, { status: 500 })
  }
}
