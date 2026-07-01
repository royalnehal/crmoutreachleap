import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const links = await prisma.liveLink.findMany({
      select: { id: true, liveUrl: true },
    })

    let checked = 0
    let updated = 0
    const errors: string[] = []

    for (const link of links) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)

        const res = await fetch(link.liveUrl, {
          signal: controller.signal,
          redirect: "follow",
          headers: { "User-Agent": "Mozilla/5.0 (compatible; OutreachOS/1.0)" },
        })
        clearTimeout(timeout)

        const httpStatus = res.status
        const isRedirect = res.redirected

        let linkStatus: string
        if (httpStatus >= 200 && httpStatus < 300 && !isRedirect) linkStatus = "LIVE"
        else if (isRedirect) linkStatus = "REDIRECT"
        else if (httpStatus >= 400) linkStatus = "BROKEN"
        else linkStatus = "UNKNOWN"

        await prisma.liveLink.update({
          where: { id: link.id },
          data: {
            linkStatus: linkStatus as never,
            httpStatus,
            lastChecked: new Date(),
          },
        })
        updated++
      } catch (e) {
        errors.push(`${link.liveUrl}: ${String(e)}`)
        try {
          await prisma.liveLink.update({
            where: { id: link.id },
            data: { linkStatus: "BROKEN", lastChecked: new Date() },
          })
        } catch { /* ignore */ }
      }
      checked++
    }

    return NextResponse.json({ checked, updated, errors: errors.slice(0, 20) })
  } catch {
    return NextResponse.json({ checked: 0, updated: 0, errors: ["DB unavailable"] })
  }
}
