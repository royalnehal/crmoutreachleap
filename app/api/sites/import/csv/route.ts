import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rows: Record<string, string>[] = body.rows ?? []

    const results = { created: 0, skipped: 0, errors: [] as string[] }

    for (const row of rows) {
      try {
        await prisma.site.upsert({
          where: { domain: row.domain },
          create: {
            siteName: row.siteName ?? row.domain,
            domain: row.domain,
            siteType: (row.siteType as never) ?? "BLOG",
            country: row.country ?? "US",
            niche: row.niche ? [row.niche] : [],
            subNiche: row.subNiche ?? "",
            da: parseInt(row.da ?? "0") || 0,
            dr: parseInt(row.dr ?? "0") || 0,
            traffic: parseInt(row.traffic ?? "0") || 0,
            trafficSource: row.trafficSource ?? "Ahrefs",
            spamScore: parseInt(row.spamScore ?? "0") || 0,
            referringDomains: parseInt(row.referringDomains ?? "0") || 0,
            indexedPages: parseInt(row.indexedPages ?? "0") || 0,
            linkType: (row.linkType as never) ?? "DOFOLLOW",
            acceptedPostTypes: [],
            minWordCount: parseInt(row.minWordCount ?? "500") || 500,
            externalLinksAllowed: parseInt(row.externalLinksAllowed ?? "2") || 2,
            tat: row.tat ?? "5-7 days",
            contentWrittenBy: (row.contentWrittenBy as never) ?? "AGENCY",
            acceptsAiContent: (row.acceptsAiContent as never) ?? "YES",
            generalPrice: parseFloat(row.generalPrice ?? "0") || 0,
            casinoGamblingPrice: parseFloat(row.casinoGamblingPrice ?? "0") || 0,
            adultPrice: parseFloat(row.adultPrice ?? "0") || 0,
            pharmacyPrice: parseFloat(row.pharmacyPrice ?? "0") || 0,
            cryptoFinancePrice: parseFloat(row.cryptoFinancePrice ?? "0") || 0,
            datingPrice: parseFloat(row.datingPrice ?? "0") || 0,
            forexTradingPrice: parseFloat(row.forexTradingPrice ?? "0") || 0,
            costPrice: parseFloat(row.costPrice ?? "0") || 0,
            contactName: row.contactName ?? "",
            contactEmail: row.contactEmail ?? "",
            whatsapp: row.whatsapp ?? "",
            telegram: row.telegram ?? "",
            paymentMethod: [],
            relationshipStatus: (row.relationshipStatus as never) ?? "COLD",
            responseRate: (row.responseRate as never) ?? "MEDIUM",
            siteStatus: (row.siteStatus as never) ?? "ACTIVE",
            googlePenalized: (row.googlePenalized as never) ?? "NO",
            sampleUrls: [],
            editorialStandards: (row.editorialStandards as never) ?? "MODERATE",
          },
          update: {
            da: parseInt(row.da ?? "0") || 0,
            dr: parseInt(row.dr ?? "0") || 0,
            traffic: parseInt(row.traffic ?? "0") || 0,
            generalPrice: parseFloat(row.generalPrice ?? "0") || 0,
          },
        })
        results.created++
      } catch (e) {
        results.skipped++
        results.errors.push(`${row.domain}: ${String(e)}`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: "Import failed", details: String(error) }, { status: 500 })
  }
}
