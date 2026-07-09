"use client"

import { useState, useEffect, use, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, FileText, Download, FileSpreadsheet, FileDown, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/shared/StatusBadge"

type Site = {
  domain: string
  siteName: string
  da: number
  dr: number
  traffic: number
  niche: unknown
  linkType: string
  generalPrice: number
  country: string
  tat: string
}

type Proposal = {
  id: string
  proposalNumber: string
  title: string
  niche: unknown
  daRange?: string
  budget?: number
  numberOfLinks?: number
  targetCountry?: string
  status: string
  sentAt?: string
  notes?: string
  createdAt: string
  selectedSites: unknown
  client: { id: string; name: string; company?: string; email: string }
}

const PROP_STATUSES = ["DRAFT","SENT","APPROVED","REJECTED","CONVERTED"]

function exportCSV(proposal: Proposal, sites: Site[]) {
  const headers = ["Domain","Site Name","DA","DR","Traffic","Niche","Link Type","Price","Country","TAT"]
  const rows = sites.map(s => [
    s.domain, s.siteName, s.da, s.dr, s.traffic?.toLocaleString(),
    Array.isArray(s.niche) ? (s.niche as string[]).join("; ") : "",
    s.linkType, `$${s.generalPrice}`, s.country, s.tat,
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${proposal.proposalNumber}-sites.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success("CSV downloaded")
}

async function exportExcel(proposal: Proposal, sites: Site[]) {
  const { utils, writeFile } = await import("xlsx")
  const ws = utils.json_to_sheet(sites.map(s => ({
    Domain: s.domain,
    "Site Name": s.siteName,
    DA: s.da,
    DR: s.dr,
    Traffic: s.traffic,
    Niche: Array.isArray(s.niche) ? (s.niche as string[]).join("; ") : "",
    "Link Type": s.linkType,
    "Price (USD)": s.generalPrice,
    Country: s.country,
    TAT: s.tat,
  }))
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, "Sites")
  writeFile(wb, `${proposal.proposalNumber}-sites.xlsx`)
  toast.success("Excel downloaded")
}

function exportPDF(proposal: Proposal, sites: Site[]) {
  const niches = Array.isArray(proposal.niche) ? (proposal.niche as string[]).join(", ") : ""
  const rows = sites.map(s => `
    <tr>
      <td>${s.domain}</td>
      <td>${s.da}</td>
      <td>${s.dr}</td>
      <td>${s.traffic?.toLocaleString?.() ?? s.traffic}</td>
      <td>${Array.isArray(s.niche) ? (s.niche as string[]).join(", ") : ""}</td>
      <td>${s.linkType}</td>
      <td>$${s.generalPrice}</td>
      <td>${s.country}</td>
      <td>${s.tat}</td>
    </tr>`).join("")

  const html = `<!DOCTYPE html>
<html>
<head>
<title>${proposal.proposalNumber} – ${proposal.title}</title>
<style>
  body { font-family: Arial, sans-serif; color: #1a1a1a; padding: 32px; }
  h1 { color: #4f46e5; margin: 0 0 4px 0; font-size: 22px; }
  .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
  .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; background: #f8f7ff; padding: 16px; border-radius: 8px; }
  .info-item label { font-size: 11px; color: #888; text-transform: uppercase; }
  .info-item p { font-size: 14px; font-weight: 600; margin: 2px 0 0; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #4f46e5; color: white; padding: 8px 10px; text-align: left; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .footer { margin-top: 32px; font-size: 11px; color: #aaa; text-align: center; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
<h1>${proposal.title}</h1>
<div class="meta">${proposal.proposalNumber} &nbsp;·&nbsp; ${proposal.client.name}${proposal.client.company ? ` (${proposal.client.company})` : ""} &nbsp;·&nbsp; ${new Date(proposal.createdAt).toLocaleDateString()}</div>
<div class="info-grid">
  <div class="info-item"><label>Budget</label><p>${proposal.budget ? `$${proposal.budget}` : "—"}</p></div>
  <div class="info-item"><label>Links</label><p>${proposal.numberOfLinks ?? "—"}</p></div>
  <div class="info-item"><label>DA Range</label><p>${proposal.daRange || "—"}</p></div>
  <div class="info-item"><label>Niche</label><p>${niches || "—"}</p></div>
  <div class="info-item"><label>Target Country</label><p>${proposal.targetCountry || "—"}</p></div>
  <div class="info-item"><label>Status</label><p>${proposal.status}</p></div>
</div>
<table>
<thead><tr><th>Domain</th><th>DA</th><th>DR</th><th>Traffic</th><th>Niche</th><th>Link Type</th><th>Price</th><th>Country</th><th>TAT</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<div class="footer">OutreachLeap · crm.outreachleap.com · Generated ${new Date().toLocaleString()}</div>
</body>
</html>`

  const win = window.open("", "_blank")
  if (!win) { toast.error("Allow popups to export PDF"); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 500)
}

export default function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const fetchProposal = useCallback(async () => {
    try {
      const d = await fetch(`/api/proposals/${id}`).then(r => r.json())
      setProposal(d)
      setStatus(d.status)
      if (Array.isArray(d.selectedSites) && d.selectedSites.length > 0) {
        setSites(d.selectedSites as Site[])
      }
    } catch {
      setProposal(null)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { fetchProposal() }, [fetchProposal])

  async function handleStatusSave() {
    setSaving(true)
    try {
      const body: Record<string, unknown> = { status }
      if (status === "SENT") body.sentAt = new Date().toISOString()
      const res = await fetch(`/api/proposals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setProposal(updated)
      toast.success("Status updated")
    } catch {
      toast.error("Failed to update")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full" /></div>

  if (!proposal || (proposal as Record<string, unknown>).error) {
    return (
      <div className="text-center py-16">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Proposal not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/proposals")}>Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => router.push("/proposals")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold">{proposal.title}</h1>
          <p className="text-sm text-muted-foreground font-mono">{proposal.proposalNumber} · {proposal.client.name}</p>
        </div>
        <StatusBadge status={proposal.status} />

        {/* Export dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setExportOpen(o => !o)}
          >
            <Download className="h-4 w-4" /> Export <ChevronDown className="h-3 w-3" />
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-10 z-50 w-44 rounded-lg border bg-white shadow-lg overflow-hidden">
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted/50 text-left"
                onClick={() => { exportPDF(proposal, sites); setExportOpen(false) }}
              >
                <FileText className="h-4 w-4 text-red-500" /> Export PDF
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted/50 text-left"
                onClick={() => { exportExcel(proposal, sites); setExportOpen(false) }}
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" /> Export Excel
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted/50 text-left"
                onClick={() => { exportCSV(proposal, sites); setExportOpen(false) }}
              >
                <FileDown className="h-4 w-4 text-blue-500" /> Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader><CardTitle className="text-sm">Proposal Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Client</span><p className="font-medium">{proposal.client.name}</p></div>
            <div><span className="text-muted-foreground">Budget</span><p className="font-medium">{proposal.budget ? `$${proposal.budget}` : "—"}</p></div>
            <div><span className="text-muted-foreground">Number of Links</span><p className="font-medium">{proposal.numberOfLinks ?? "—"}</p></div>
            <div><span className="text-muted-foreground">DA Range</span><p className="font-medium">{proposal.daRange || "—"}</p></div>
            <div><span className="text-muted-foreground">Target Country</span><p className="font-medium">{proposal.targetCountry || "—"}</p></div>
            <div><span className="text-muted-foreground">Created</span><p className="font-medium">{new Date(proposal.createdAt).toLocaleDateString()}</p></div>
            {proposal.sentAt && <div><span className="text-muted-foreground">Sent At</span><p className="font-medium">{new Date(proposal.sentAt).toLocaleDateString()}</p></div>}
            <div className="col-span-2">
              <span className="text-muted-foreground">Niche</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.isArray(proposal.niche)
                  ? (proposal.niche as string[]).map(n => <Badge key={n} variant="secondary">{n}</Badge>)
                  : <span>{String(proposal.niche)}</span>}
              </div>
            </div>
            {proposal.notes && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Notes</span>
                <p className="mt-1 text-sm whitespace-pre-wrap">{proposal.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Status Management</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROP_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleStatusSave} disabled={saving} className="w-full" style={{ backgroundColor: "#6366F1" }}>
              {saving ? "Saving..." : "Update Status"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            Selected Sites
            <span className="text-xs font-normal text-muted-foreground">{sites.length} sites</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sites.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="text-left px-3 py-2 font-medium">Domain</th>
                    <th className="text-left px-3 py-2 font-medium">DA</th>
                    <th className="text-left px-3 py-2 font-medium">DR</th>
                    <th className="text-left px-3 py-2 font-medium">Traffic</th>
                    <th className="text-left px-3 py-2 font-medium">Niche</th>
                    <th className="text-left px-3 py-2 font-medium">Link Type</th>
                    <th className="text-left px-3 py-2 font-medium">Price</th>
                    <th className="text-left px-3 py-2 font-medium">Country</th>
                    <th className="text-left px-3 py-2 font-medium">TAT</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site, i) => (
                    <tr key={i} className={`border-b last:border-0 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                      <td className="px-3 py-2 font-medium text-indigo-600">{site.domain}</td>
                      <td className="px-3 py-2">{site.da}</td>
                      <td className="px-3 py-2">{site.dr}</td>
                      <td className="px-3 py-2">{site.traffic?.toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs">
                        {Array.isArray(site.niche) ? (site.niche as string[]).slice(0, 2).join(", ") : ""}
                      </td>
                      <td className="px-3 py-2"><Badge variant="secondary" className="text-xs">{site.linkType}</Badge></td>
                      <td className="px-3 py-2 font-medium">${site.generalPrice}</td>
                      <td className="px-3 py-2">{site.country}</td>
                      <td className="px-3 py-2 text-xs">{site.tat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No sites attached to this proposal yet. Edit the proposal to add sites.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
