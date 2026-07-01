"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Upload, Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/PageHeader"

const CSV_HEADERS = [
  "siteName","domain","siteType","country","niche","subNiche","language",
  "da","dr","traffic","trafficSource","spamScore","referringDomains","indexedPages",
  "linkType","minWordCount","externalLinksAllowed","tat","contentWrittenBy","acceptsAiContent",
  "generalPrice","casinoGamblingPrice","adultPrice","pharmacyPrice","cryptoFinancePrice",
  "datingPrice","forexTradingPrice","costPrice","currency",
  "contactName","contactEmail","whatsapp","telegram",
  "relationshipStatus","responseRate","siteStatus","googlePenalized","editorialStandards","internalNotes",
]

type PreviewRow = Record<string, string>

function parseCsv(text: string): { headers: string[]; rows: PreviewRow[] } {
  const lines = text.trim().split("\n").filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""))
  const rows = lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""))
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""]))
  })
  return { headers, rows }
}

export default function SitesImportPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [csvText, setCsvText] = useState("")
  const [preview, setPreview] = useState<{ headers: string[]; rows: PreviewRow[] } | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)

  function downloadTemplate() {
    const sample = [CSV_HEADERS.join(","),
      'My Blog,example.com,BLOG,US,"Technology,SaaS",SaaS,English,45,52,25000,Ahrefs,2,850,1200,DOFOLLOW,800,2,"5-7 days",AGENCY,YES,150,0,0,0,0,0,0,80,USD,John Doe,john@example.com,+11234567890,,ACTIVE,MEDIUM,ACTIVE,NO,MODERATE,Good site',
    ].join("\n")
    const blob = new Blob([sample], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "sites_import_template.csv"; a.click()
    URL.revokeObjectURL(url)
    toast.success("Template downloaded")
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setCsvText(text)
      setPreview(parseCsv(text))
      setResult(null)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!preview || preview.rows.length === 0) return
    setImporting(true)
    try {
      const res = await fetch("/api/sites/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview.rows }),
      })
      const data = await res.json()
      setResult(data)
      toast.success(`Import complete: ${data.created} created, ${data.skipped} skipped`)
    } catch {
      toast.error("Import failed")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/sites")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <PageHeader title="Import Sites" subtitle="Bulk import sites via CSV or Gmail" />
      </div>

      <Tabs defaultValue="csv">
        <TabsList>
          <TabsTrigger value="csv" className="gap-2"><Upload className="h-4 w-4" />CSV Import</TabsTrigger>
          <TabsTrigger value="gmail" className="gap-2"><Mail className="h-4 w-4" />Gmail Import</TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Step 1 — Download Template</CardTitle>
              <CardDescription>Download the CSV template with correct column headers.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                <Download className="h-4 w-4" /> Download Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2 — Upload CSV</CardTitle>
              <CardDescription>Upload your filled CSV file.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </div>
              {csvText && (
                <p className="text-xs text-green-600 mt-2">File loaded — {preview?.rows.length ?? 0} rows detected</p>
              )}
            </CardContent>
          </Card>

          {preview && preview.rows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3 — Preview</CardTitle>
                <CardDescription>First 5 rows of your CSV</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border">
                    <thead>
                      <tr className="bg-muted/40">
                        {preview.headers.map(h => <th key={h} className="px-2 py-1 text-left border">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className={i % 2 === 1 ? "bg-muted/10" : ""}>
                          {preview.headers.map(h => <td key={h} className="px-2 py-1 border">{row[h]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {preview && preview.rows.length > 0 && (
            <div className="flex gap-3 items-center">
              <Button onClick={handleImport} disabled={importing} style={{ backgroundColor: "#6366F1" }}>
                {importing ? "Importing..." : `Import ${preview.rows.length} Sites`}
              </Button>
              {result && (
                <span className="text-sm text-muted-foreground">
                  Done: {result.created} created, {result.skipped} skipped
                </span>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gmail" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gmail Import</CardTitle>
              <CardDescription>Connect your Gmail account to scan for live link notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/30 p-6 text-center">
                <Mail className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">Gmail OAuth Not Configured</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add <code className="bg-muted px-1 rounded">GMAIL_CLIENT_ID</code> and{" "}
                  <code className="bg-muted px-1 rounded">GMAIL_CLIENT_SECRET</code> to your .env file to enable Gmail integration.
                </p>
                <Button disabled onClick={() => toast.info("Gmail OAuth setup required — add GMAIL_CLIENT_ID to .env")}>
                  Connect Gmail
                </Button>
              </div>

              <div className="opacity-40 pointer-events-none space-y-3">
                <h4 className="font-medium text-sm">Scan Settings</h4>
                <p className="text-xs text-muted-foreground">Date range, keywords, inbox/sent toggle — available after Gmail connection.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
