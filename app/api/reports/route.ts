import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start") ? new Date(searchParams.get("start")!) : new Date(new Date().getFullYear(), 0, 1)
    const end = searchParams.get("end") ? new Date(searchParams.get("end")!) : new Date()

    const where = { createdAt: { gte: start, lte: end } }

    const [orders, liveLinks] = await Promise.all([
      prisma.order.findMany({
        where,
        select: { status: true, agreedPrice: true, costPrice: true },
      }),
      prisma.liveLink.groupBy({ by: ["linkStatus"], _count: true }),
    ])

    const totalRevenue = orders.reduce((s, o) => s + Number(o.agreedPrice), 0)
    const totalCost = orders.reduce((s, o) => s + Number(o.costPrice), 0)
    const grossProfit = totalRevenue - totalCost
    const profitMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    const totalOrders = orders.length
    const completed = orders.filter((o) => o.status === "DELIVERED").length
    const cancelled = orders.filter((o) => o.status === "CANCELLED").length

    const linkStatMap = Object.fromEntries(liveLinks.map((l) => [l.linkStatus, l._count]))
    const totalLinks = liveLinks.reduce((s, l) => s + l._count, 0)
    const brokenLinks = linkStatMap["BROKEN"] ?? 0
    const brokenPct = totalLinks > 0 ? (brokenLinks / totalLinks) * 100 : 0

    return NextResponse.json({
      totalRevenue,
      totalCost,
      grossProfit,
      profitMarginPct: Math.round(profitMarginPct * 10) / 10,
      totalOrders,
      completed,
      cancelled,
      totalLinks,
      brokenLinks,
      brokenPct: Math.round(brokenPct * 10) / 10,
      linkStats: linkStatMap,
    })
  } catch {
    return NextResponse.json({
      totalRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      profitMarginPct: 0,
      totalOrders: 0,
      completed: 0,
      cancelled: 0,
      totalLinks: 0,
      brokenLinks: 0,
      brokenPct: 0,
      linkStats: {},
    })
  }
}
