import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status")
    const linkType = searchParams.get("linkType")
    const page = parseInt(searchParams.get("page") ?? "1")
    const pageSize = parseInt(searchParams.get("pageSize") ?? "25")

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { domain: { contains: search } },
        { siteName: { contains: search } },
      ]
    }
    if (status) where.siteStatus = status
    if (linkType) where.linkType = linkType

    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.site.count({ where }),
    ])

    return NextResponse.json({ sites, total, page, pageSize })
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
