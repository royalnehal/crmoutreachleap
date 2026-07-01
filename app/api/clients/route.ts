import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") ?? ""
    const tier = searchParams.get("tier")

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ]
    }
    if (tier) where.tier = tier

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true, liveLinks: true, proposals: true } },
      },
    })

    return NextResponse.json({ clients })
  } catch {
    return NextResponse.json({ clients: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const client = await prisma.client.create({ data: body })
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create client", details: String(error) }, { status: 500 })
  }
}
