import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const members = await prisma.teamMember.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })
    return NextResponse.json({ members })
  } catch {
    return NextResponse.json({ members: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const hashedPassword = body.password ? await bcrypt.hash(body.password, 10) : undefined

    const member = await prisma.teamMember.create({
      data: {
        name: body.name,
        email: body.email,
        role: body.role,
        password: hashedPassword,
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create team member", details: String(error) }, { status: 500 })
  }
}
