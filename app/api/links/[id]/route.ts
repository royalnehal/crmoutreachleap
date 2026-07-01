import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const link = await prisma.liveLink.findUnique({ where: { id } })
    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(link)
  } catch {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const link = await prisma.liveLink.update({ where: { id }, data: body })
    return NextResponse.json(link)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.liveLink.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete", details: String(error) }, { status: 500 })
  }
}
