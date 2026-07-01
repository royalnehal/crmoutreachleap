"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Pencil, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/shared/StatusBadge"

type Site = Record<string, unknown>

function Field({ label, value }: { label: string; value?: unknown }) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{String(value)}</dd>
    </div>
  )
}

export default function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [site, setSite] = useState<Site | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/sites/${id}`)
      .then(r => r.json())
      .then(d => setSite(d))
      .catch(() => setSite(null))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!site || site.error) {
    return (
      <div className="text-center py-16">
        <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Site not found or database unavailable.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/sites")}>Back to Sites</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/sites")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{site.siteName as string}</h1>
          <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
            {site.domain as string}
          </a>
        </div>
        <StatusBadge status={site.siteStatus as string} />
        <Button onClick={() => router.push(`/sites?edit=${id}`)} className="gap-2" style={{ backgroundColor: "#6366F1" }}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">SEO Metrics</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Domain Authority (DA)" value={site.da} />
                  <Field label="Domain Rating (DR)" value={site.dr} />
                  <Field label="Monthly Traffic" value={Number(site.traffic).toLocaleString()} />
                  <Field label="Traffic Source" value={site.trafficSource} />
                  <Field label="Spam Score" value={site.spamScore} />
                  <Field label="Referring Domains" value={site.referringDomains} />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Site Details</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Country" value={site.country} />
                  <Field label="Language" value={site.language} />
                  <Field label="Site Type" value={site.siteType} />
                  <Field label="Link Type" value={site.linkType} />
                  <Field label="TAT" value={site.tat} />
                  <div className="col-span-2">
                    <dt className="text-xs font-medium text-muted-foreground">Niche</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {Array.isArray(site.niche)
                        ? (site.niche as string[]).map(n => <Badge key={n} variant="secondary">{n}</Badge>)
                        : <span className="text-sm">{site.niche as string}</span>}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Content Rules</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Min Word Count" value={site.minWordCount} />
                  <Field label="External Links Allowed" value={site.externalLinksAllowed} />
                  <Field label="Content Written By" value={site.contentWrittenBy} />
                  <Field label="Accepts AI Content" value={site.acceptsAiContent} />
                  <Field label="Author Bio Allowed" value={site.authorBioAllowed ? "Yes" : "No"} />
                  <Field label="Images Required" value={site.imagesRequired ? "Yes" : "No"} />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Contact & Relationship</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Contact Name" value={site.contactName} />
                  <Field label="Contact Email" value={site.contactEmail} />
                  <Field label="WhatsApp" value={site.whatsapp} />
                  <Field label="Telegram" value={site.telegram} />
                  <Field label="Relationship Status" value={site.relationshipStatus} />
                  <Field label="Response Rate" value={site.responseRate} />
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Price Table</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Niche Category</th>
                    <th className="text-right py-2 font-medium">Price (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["General", "generalPrice"],
                    ["Casino / Gambling", "casinoGamblingPrice"],
                    ["Adult", "adultPrice"],
                    ["Pharmacy", "pharmacyPrice"],
                    ["Crypto / Finance", "cryptoFinancePrice"],
                    ["Dating", "datingPrice"],
                    ["Forex / Trading", "forexTradingPrice"],
                  ].map(([label, key]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="py-2">{label}</td>
                      <td className="py-2 text-right font-medium">
                        {Number(site[key]) > 0 ? `$${Number(site[key]).toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No orders yet for this site.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Internal Notes</CardTitle></CardHeader>
            <CardContent>
              {site.internalNotes
                ? <p className="text-sm whitespace-pre-wrap">{site.internalNotes as string}</p>
                : <p className="text-sm text-muted-foreground">No internal notes.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
