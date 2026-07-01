import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json() as { urls: string[] }
    if (!Array.isArray(urls)) {
      return NextResponse.json({ error: "urls must be an array" }, { status: 400 })
    }

    const results = urls
      .map((raw) => {
        const trimmed = raw.trim()
        if (!trimmed) return null
        try {
          const urlStr = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
          const parsed = new URL(urlStr)
          return { url: trimmed, domain: parsed.hostname.replace(/^www\./, "") }
        } catch {
          return { url: trimmed, domain: null, error: "Invalid URL" }
        }
      })
      .filter(Boolean)

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
