import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const clientId = searchParams.get("clientId")
    const assignedTo = searchParams.get("assignedTo")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (assignedTo) where.assignedTo = assignedTo

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, company: true } },
        site: { select: { id: true, siteName: true, domain: true } },
      },
    })

    return NextResponse.json({ orders })
  } catch {
    return NextResponse.json({ orders: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Auto-generate order number
    const count = await prisma.order.count()
    const year = new Date().getFullYear()
    const orderNumber = `ORD-${year}-${String(count + 1).padStart(4, "0")}`

    const order = await prisma.order.create({
      data: {
        ...body,
        orderNumber,
        profitMargin: (body.agreedPrice ?? 0) - (body.costPrice ?? 0),
      },
      include: {
        client: { select: { id: true, name: true } },
        site: { select: { id: true, siteName: true, domain: true } },
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order", details: String(error) }, { status: 500 })
  }
}
