import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    let httpCode = 0
    let finalUrl = url
    let isRedirect = false

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; OutreachOS/1.0)" },
      })
      clearTimeout(timeout)
      httpCode = res.status
      finalUrl = res.url
      isRedirect = res.redirected

      // Check dofollow: scan HTML for links pointing to the target URL
      let isDofollow = true
      try {
        const html = await res.text()
        const linkRegex = /<a[^>]*href=["'][^"']*["'][^>]*>/gi
        const matches = html.match(linkRegex) ?? []
        for (const tag of matches) {
          if (tag.toLowerCase().includes(url.split("/")[2] ?? "")) {
            if (/rel=["'][^"']*nofollow[^"']*["']/i.test(tag)) {
              isDofollow = false
            }
          }
        }
      } catch {
        // Ignore HTML parse errors
      }

      let status: string
      if (httpCode >= 200 && httpCode < 300 && !isRedirect) status = "LIVE"
      else if (isRedirect) status = "REDIRECT"
      else if (httpCode === 404) status = "BROKEN"
      else if (httpCode >= 400) status = "BROKEN"
      else status = "UNKNOWN"

      return NextResponse.json({ status, httpCode, isDofollow, finalUrl, isRedirect })
    } catch (fetchError) {
      clearTimeout(timeout)
      return NextResponse.json({
        status: "BROKEN",
        httpCode: 0,
        isDofollow: false,
        error: String(fetchError),
      })
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
