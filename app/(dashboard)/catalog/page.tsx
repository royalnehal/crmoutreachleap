"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { BookOpen, Copy, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"

type SubSheet = {
  id: string
  title: string
  shareToken: string
  viewCount: number
  expiresAt?: string
  passwordProtected: boolean
  createdAt: string
  client?: { name: string }
}

const ALL_COLUMNS = [
  { key: "domain", label: "Domain" },
  { key: "da", label: "DA" },
  { key: "dr", label: "DR" },
  { key: "traffic", label: "Traffic" },
  { key: "niche", label: "Niche" },
  { key: "linkType", label: "Link Type" },
  { key: "generalPrice", label: "Price" },
  { key: "tat", label: "TAT" },
  { key: "country", label: "Country" },
]

const DEFAULT_COLS = ["domain", "da", "dr", "traffic", "niche", "linkType", "generalPrice"]

export default function CatalogPage() {
  const [catalogs, setCatalogs] = useState<SubSheet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const [title, setTitle] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [passwordProtected, setPasswordProtected] = useState(false)
  const [password, setPassword] = useState("")
  const [selectedCols, setSelectedCols] = useState<string[]>(DEFAULT_COLS)
  const [generatedUrl, setGeneratedUrl] = useState("")

  const fetchCatalogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/catalog")
      const data = await res.json()
      setCatalogs(data.catalogs ?? [])
    } catch {
      setCatalogs([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchCatalogs() }, [fetchCatalogs])

  async function generate() {
    if (!title.trim()) { toast.error("Please enter a title"); return }
    setGenerating(true)
    try {
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, visibleColumns: selectedCols,
          filters: {}, sites: [],
          expiresAt: expiresAt || null,
          passwordProtected, password: passwordProtected ? password : null,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const url = `${window.location.origin}/catalog/${data.shareToken}`
      setGeneratedUrl(url)
      toast.success("Catalog link generated!")
      fetchCatalogs()
    } catch {
      toast.error("Failed to generate catalog")
    } finally {
      setGenerating(false)
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard")
  }

  function toggleCol(key: string) {
    setSelectedCols(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Catalog Generator" subtitle="Create shareable site catalogs for clients" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Column Selection</CardTitle>
              <CardDescription>Choose which columns to expose. Cost price, contact details, and internal notes are always hidden.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {ALL_COLUMNS.map(col => (
                  <div key={col.key} className="flex items-center gap-2">
                    <Checkbox
                      id={col.key}
                      checked={selectedCols.includes(col.key)}
                      onCheckedChange={() => toggleCol(col.key)}
                    />
                    <Label htmlFor={col.key} className="text-sm cursor-pointer">{col.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Catalog Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Q1 2025 Guest Post Catalog" className="mt-1" />
              </div>
              <div>
                <Label>Expiry Date (optional)</Label>
                <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="mt-1" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={passwordProtected} onCheckedChange={setPasswordProtected} id="pw-toggle" />
                <Label htmlFor="pw-toggle">Password protect</Label>
              </div>
              {passwordProtected && (
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1" placeholder="Enter password..." />
                </div>
              )}
              <Button onClick={generate} disabled={generating} className="w-full" style={{ backgroundColor: "#6366F1" }}>
                {generating ? "Generating..." : "Generate Shareable Link"}
              </Button>
            </CardContent>
          </Card>

          {generatedUrl && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <p className="text-xs font-medium text-green-700 mb-2">Your catalog link:</p>
                <div className="flex gap-2">
                  <Input value={generatedUrl} readOnly className="text-xs" />
                  <Button variant="outline" size="sm" onClick={() => copyUrl(generatedUrl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* History */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Generated Catalogs</CardTitle>
              <CardDescription>History of all shareable links</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : catalogs.length === 0 ? (
                <EmptyState icon={BookOpen} title="No catalogs yet" description="Generate your first shareable catalog link." />
              ) : (
                <div className="space-y-3">
                  {catalogs.map(cat => {
                    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/catalog/${cat.shareToken}`
                    const expired = cat.expiresAt && new Date(cat.expiresAt) < new Date()
                    return (
                      <div key={cat.id} className="flex items-start justify-between rounded-lg border p-3 gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{cat.title}</p>
                          <p className="text-xs text-muted-foreground">{cat.viewCount} views · {cat.passwordProtected ? "🔒 Password" : "Public"}</p>
                          {cat.expiresAt && (
                            <p className={`text-xs ${expired ? "text-red-500" : "text-muted-foreground"}`}>
                              {expired ? "Expired" : "Expires"}: {new Date(cat.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost"><Eye className="h-3.5 w-3.5" /></Button>
                          </a>
                          <Button size="sm" variant="ghost" onClick={() => copyUrl(url)}><Copy className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
