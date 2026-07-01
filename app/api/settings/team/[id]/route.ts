import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.role !== undefined) data.role = body.role
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.password) data.password = await bcrypt.hash(body.password, 10)

    const member = await prisma.teamMember.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    })

    return NextResponse.json(member)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.teamMember.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete", details: String(error) }, { status: 500 })
  }
}
