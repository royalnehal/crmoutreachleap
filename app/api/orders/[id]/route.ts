import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        site: true,
        liveLinks: true,
      },
    })
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(order)
  } catch {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    if (body.agreedPrice !== undefined && body.costPrice !== undefined) {
      body.profitMargin = body.agreedPrice - body.costPrice
    }
    const order = await prisma.order.update({
      where: { id },
      data: body,
      include: {
        client: { select: { id: true, name: true } },
        site: { select: { id: true, siteName: true, domain: true } },
      },
    })
    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.order.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete", details: String(error) }, { status: 500 })
  }
}
