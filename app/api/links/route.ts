import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (status && status !== "ALL") where.linkStatus = status

    const links = await prisma.liveLink.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        site: { select: { domain: true, siteName: true } },
        client: { select: { name: true } },
        order: { select: { orderNumber: true } },
      },
    })

    const stats = await prisma.liveLink.groupBy({
      by: ["linkStatus"],
      _count: true,
    })

    return NextResponse.json({ links, stats })
  } catch {
    return NextResponse.json({ links: [], stats: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const link = await prisma.liveLink.create({ data: body })
    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create link", details: String(error) }, { status: 500 })
  }
}
