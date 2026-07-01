"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Mail, Link2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/shared/PageHeader"

type ParsedUrl = { url: string; domain: string | null; error?: string }

export default function ImportPage() {
  const [urlInput, setUrlInput] = useState("")
  const [parsed, setParsed] = useState<ParsedUrl[]>([])
  const [parsing, setParsing] = useState(false)

  async function parseUrls() {
    const urls = urlInput.split("\n").map(u => u.trim()).filter(Boolean)
    if (urls.length === 0) { toast.error("Enter at least one URL"); return }
    setParsing(true)
    try {
      const res = await fetch("/api/import/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      })
      const data = await res.json()
      setParsed(data.results ?? [])
      toast.success(`Parsed ${data.results?.length ?? 0} URLs`)
    } catch {
      toast.error("Parse failed")
    } finally {
      setParsing(false)
    }
  }

  function removeRow(i: number) {
    setParsed(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Import" subtitle="Import data from Gmail or URL lists" />

      <Tabs defaultValue="gmail">
        <TabsList>
          <TabsTrigger value="gmail" className="gap-2"><Mail className="h-4 w-4" />Gmail Integration</TabsTrigger>
          <TabsTrigger value="urls" className="gap-2"><Link2 className="h-4 w-4" />URL Import</TabsTrigger>
        </TabsList>

        <TabsContent value="gmail" className="space-y-4 mt-4">
          {/* Step 1 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Step 1</Badge>
                <CardTitle className="text-sm">Connect Gmail</CardTitle>
              </div>
              <CardDescription>Link your Gmail account to scan for live link notifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-4">
                <p className="text-sm text-amber-800">
                  Gmail OAuth requires <code className="bg-amber-100 px-1 rounded">GMAIL_CLIENT_ID</code> and{" "}
                  <code className="bg-amber-100 px-1 rounded">GMAIL_CLIENT_SECRET</code> in your .env file.
                </p>
              </div>
              <Button
                disabled
                onClick={() => toast.info("Gmail OAuth setup required — add GMAIL_CLIENT_ID to .env")}
                className="gap-2"
              >
                <Mail className="h-4 w-4" /> Connect Gmail Account
              </Button>
            </CardContent>
          </Card>

          {/* Step 2 — greyed out */}
          <div className="opacity-40 pointer-events-none">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Step 2</Badge>
                  <CardTitle className="text-sm">Scan Settings</CardTitle>
                </div>
                <CardDescription>Configure what to scan for.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Date Range</label>
                    <input type="date" className="w-full rounded border px-3 py-2 text-sm mt-1" disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Keywords</label>
                    <input type="text" placeholder="live, published, went live..." className="w-full rounded border px-3 py-2 text-sm mt-1" disabled />
                  </div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Inbox</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Sent</label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step 3 — greyed out */}
          <div className="opacity-40 pointer-events-none">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Step 3</Badge>
                  <CardTitle className="text-sm">Review Queue</CardTitle>
                </div>
                <CardDescription>Review and approve imported emails.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Connect Gmail first to see the email queue here.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="urls" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Paste URLs</CardTitle>
              <CardDescription>One URL per line. The tool will extract domains for you to review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-36 font-mono"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder={"https://example.com/guest-post-title\nhttps://blog.site.com/article\nhttps://news.domain.com/post"}
              />
              <Button onClick={parseUrls} disabled={parsing} className="gap-2" style={{ backgroundColor: "#6366F1" }}>
                <Plus className="h-4 w-4" /> {parsing ? "Parsing..." : "Parse URLs"}
              </Button>
            </CardContent>
          </Card>

          {parsed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Review — {parsed.length} URLs</CardTitle>
                <CardDescription>Review extracted domains before importing to Sites.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 border-b">
                        <th className="text-left px-4 py-2 font-medium">URL</th>
                        <th className="text-left px-4 py-2 font-medium">Domain</th>
                        <th className="text-left px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.map((row, i) => (
                        <tr key={i} className={`border-b last:border-0 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                          <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-64">{row.url}</td>
                          <td className="px-4 py-2 font-medium">{row.domain ?? "—"}</td>
                          <td className="px-4 py-2">
                            {row.error
                              ? <Badge variant="destructive" className="text-xs">Error</Badge>
                              : <Badge className="text-xs bg-green-100 text-green-700">Valid</Badge>}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button size="sm" variant="ghost" onClick={() => removeRow(i)}>
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button style={{ backgroundColor: "#6366F1" }} onClick={() => toast.info("Navigate to Sites → Import to bulk import these domains")}>
                    Import to Sites
                  </Button>
                  <Button variant="outline" onClick={() => setParsed([])}>Clear</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
