import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const proposals = await prisma.proposal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, name: true, company: true } } },
    })

    return NextResponse.json({ proposals })
  } catch {
    return NextResponse.json({ proposals: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const count = await prisma.proposal.count()
    const year = new Date().getFullYear()
    const proposalNumber = `PROP-${year}-${String(count + 1).padStart(3, "0")}`

    const proposal = await prisma.proposal.create({
      data: {
        ...body,
        proposalNumber,
        selectedSites: body.selectedSites ?? [],
      },
      include: { client: { select: { id: true, name: true } } },
    })

    return NextResponse.json(proposal, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create proposal", details: String(error) }, { status: 500 })
  }
}
