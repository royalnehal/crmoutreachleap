"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

type CatalogData = {
  id: string
  title: string
  visibleColumns: string[]
  sites: Record<string, unknown>[]
  passwordProtected: boolean
  requiresPassword: boolean
  expired?: boolean
  expiresAt?: string
  viewCount: number
}

const COL_LABELS: Record<string, string> = {
  domain: "Domain", da: "DA", dr: "DR", traffic: "Traffic",
  niche: "Niche", linkType: "Link Type", generalPrice: "Price",
  tat: "TAT", country: "Country",
}

export default function PublicCatalogPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [catalog, setCatalog] = useState<CatalogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expired, setExpired] = useState(false)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [pwError, setPwError] = useState("")
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    fetch(`/api/catalog/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.expired) { setExpired(true); return }
        if (data.error) { setError(data.error); return }
        if (data.requiresPassword) { setNeedsPassword(true); setCatalog(data); return }
        setCatalog(data)
      })
      .catch(() => setError("Failed to load catalog"))
      .finally(() => setLoading(false))
  }, [token])

  async function verifyPassword() {
    setVerifying(true)
    setPwError("")
    try {
      const res = await fetch(`/api/catalog/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setNeedsPassword(false)
      } else {
        setPwError("Incorrect password")
      }
    } catch {
      setPwError("Verification failed")
    } finally {
      setVerifying(false)
    }
  }

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || "+1234567890"

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading catalog...</p>
        </div>
      </div>
    )
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold mb-2">Catalog Expired</h1>
          <p className="text-muted-foreground">This catalog link has expired. Please contact the agency for a fresh link.</p>
          <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
            <Button className="mt-4" style={{ backgroundColor: "#25D366" }}>Contact on WhatsApp</Button>
          </a>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="bg-white rounded-xl border shadow-sm p-8 max-w-sm w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔒</div>
            <h1 className="text-xl font-bold">{catalog?.title ?? "Protected Catalog"}</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter the password to view this catalog</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && verifyPassword()}
                className="mt-1"
                placeholder="Enter password..."
              />
              {pwError && <p className="text-xs text-red-500 mt-1">{pwError}</p>}
            </div>
            <Button onClick={verifyPassword} disabled={verifying} className="w-full" style={{ backgroundColor: "#6366F1" }}>
              {verifying ? "Verifying..." : "Access Catalog"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!catalog) return null

  const cols = Array.isArray(catalog.visibleColumns) ? catalog.visibleColumns as string[] : []
  const sites = Array.isArray(catalog.sites) ? catalog.sites as Record<string, unknown>[] : []

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#1E1B4B" }} className="py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">OutreachLeap</h1>
            <p className="text-indigo-300 text-sm">Premium Guest Post Services</p>
          </div>
          <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
            <Button style={{ backgroundColor: "#25D366" }} className="text-white">
              Contact Us
            </Button>
          </a>
        </div>
      </header>

      {/* Catalog title */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <h2 className="text-xl font-semibold mb-1">{catalog.title}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {sites.length} site{sites.length !== 1 ? "s" : ""} available
        </p>

        {/* Table */}
        <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#1E1B4B" }}>
                  {cols.map(col => (
                    <th key={col} className="text-left px-4 py-3 font-medium text-white">
                      {COL_LABELS[col] ?? col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sites.length === 0 ? (
                  <tr>
                    <td colSpan={cols.length} className="text-center py-12 text-muted-foreground">
                      No sites available in this catalog.
                    </td>
                  </tr>
                ) : (
                  sites.map((site, i) => (
                    <tr key={i} className={`border-b last:border-0 ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                      {cols.map(col => (
                        <td key={col} className="px-4 py-3">
                          {col === "domain" ? (
                            <span className="font-medium text-indigo-600">{String(site[col] ?? "")}</span>
                          ) : col === "niche" ? (
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(site[col])
                                ? (site[col] as string[]).slice(0, 2).map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)
                                : <span>{String(site[col] ?? "")}</span>}
                            </div>
                          ) : col === "linkType" ? (
                            <Badge variant={site[col] === "DOFOLLOW" ? "default" : "secondary"} className="text-xs">
                              {String(site[col] ?? "")}
                            </Badge>
                          ) : col === "generalPrice" ? (
                            <span className="font-medium">${Number(site[col] ?? 0)}</span>
                          ) : col === "traffic" ? (
                            <span>{Number(site[col] ?? 0).toLocaleString()}</span>
                          ) : (
                            <span>{String(site[col] ?? "")}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 px-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} OutreachLeap · Premium Guest Posting Agency</p>
        <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
          <Button size="sm" style={{ backgroundColor: "#25D366" }} className="text-white">Contact Us on WhatsApp</Button>
        </a>
      </footer>
    </div>
  )
}
