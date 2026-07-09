import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status")
    const linkType = searchParams.get("linkType")
    const country = searchParams.get("country")
    const niche = searchParams.get("niche")
    const daMin = searchParams.get("daMin")
    const daMax = searchParams.get("daMax")
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")
    const page = parseInt(searchParams.get("page") ?? "1")
    const pageSize = parseInt(searchParams.get("pageSize") ?? "25")

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { domain: { contains: search, mode: "insensitive" } },
        { siteName: { contains: search, mode: "insensitive" } },
      ]
    }
    if (status) where.siteStatus = status
    if (linkType) where.linkType = linkType
    if (country) where.country = { contains: country, mode: "insensitive" }
    if (daMin || daMax) {
      where.da = {
        ...(daMin ? { gte: parseInt(daMin) } : {}),
        ...(daMax ? { lte: parseInt(daMax) } : {}),
      }
    }
    if (priceMin || priceMax) {
      where.generalPrice = {
        ...(priceMin ? { gte: parseFloat(priceMin) } : {}),
        ...(priceMax ? { lte: parseFloat(priceMax) } : {}),
      }
    }

    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { da: "desc" },
      }),
      prisma.site.count({ where }),
    ])

    // Filter by niche in JS (JSON field)
    const filtered = niche
      ? sites.filter(s => {
          const n = Array.isArray(s.niche) ? (s.niche as string[]) : []
          return n.some(v => v.toLowerCase().includes(niche.toLowerCase()))
        })
      : sites

    return NextResponse.json({ sites: filtered, total, page, pageSize })
  } catch {
    return NextResponse.json({ sites: [], total: 0, page: 1, pageSize: 25 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const site = await prisma.site.create({ data: body })
    return NextResponse.json(site, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create site", details: String(error) }, { status: 500 })
  }
}
