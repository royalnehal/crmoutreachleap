"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Link2, ExternalLink, RefreshCw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { Skeleton } from "@/components/ui/skeleton"

type LiveLink = {
  id: string
  liveUrl: string
  anchorText?: string
  targetUrl?: string
  isDofollow: boolean
  linkStatus: string
  httpStatus?: number
  lastChecked?: string
  site?: { domain: string }
  client?: { name: string }
  order?: { orderNumber: string }
}

type LinkStats = { linkStatus: string; _count: number }

const STATUS_TABS = ["ALL", "LIVE", "BROKEN", "REDIRECT", "DEINDEXED"]

const SUMMARY_COLORS: Record<string, string> = {
  LIVE: "text-green-600 bg-green-50 border-green-200",
  BROKEN: "text-red-600 bg-red-50 border-red-200",
  REDIRECT: "text-yellow-600 bg-yellow-50 border-yellow-200",
  DEINDEXED: "text-gray-600 bg-gray-50 border-gray-200",
  UNKNOWN: "text-slate-600 bg-slate-50 border-slate-200",
}

export default function LinksPage() {
  const [links, setLinks] = useState<LiveLink[]>([])
  const [stats, setStats] = useState<LinkStats[]>([])
  const [activeTab, setActiveTab] = useState("ALL")
  const [isLoading, setIsLoading] = useState(true)
  const [checkingAll, setCheckingAll] = useState(false)
  const [checkingId, setCheckingId] = useState<string | null>(null)

  const fetchLinks = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/links${activeTab !== "ALL" ? `?status=${activeTab}` : ""}`)
      const data = await res.json()
      setLinks(data.links ?? [])
      setStats(data.stats ?? [])
    } catch {
      setLinks([])
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  const statMap = Object.fromEntries(stats.map(s => [s.linkStatus, s._count]))
  const total = stats.reduce((s, l) => s + l._count, 0)

  async function checkAll() {
    setCheckingAll(true)
    try {
      toast.info("Checking all links... This may take a while.")
      const res = await fetch("/api/cron/linkcheck")
      const data = await res.json()
      toast.success(`Checked ${data.checked} links — ${data.updated} updated`)
      fetchLinks()
    } catch {
      toast.error("Link check failed")
    } finally {
      setCheckingAll(false)
    }
  }

  async function checkSingle(link: LiveLink) {
    setCheckingId(link.id)
    try {
      const res = await fetch("/api/links/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link.liveUrl }),
      })
      const data = await res.json()
      toast.success(`${link.liveUrl.slice(0, 40)}... → ${data.status} (${data.httpCode})`)
      fetchLinks()
    } catch {
      toast.error("Check failed")
    } finally {
      setCheckingId(null)
    }
  }

  function exportCsv() {
    const headers = ["URL","Domain","Anchor","Target","Client","Dofollow","Status","HTTP","Last Checked"]
    const rows = links.map(l => [
      l.liveUrl, l.site?.domain ?? "", l.anchorText ?? "", l.targetUrl ?? "",
      l.client?.name ?? "", l.isDofollow ? "Yes" : "No", l.linkStatus,
      l.httpStatus ?? "", l.lastChecked ? new Date(l.lastChecked).toLocaleDateString() : "",
    ])
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "live_links.csv"; a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported")
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Live Link Vault"
        subtitle="Monitor and manage all live backlinks"
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>
            <Button variant="outline" onClick={checkAll} disabled={checkingAll} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${checkingAll ? "animate-spin" : ""}`} />
              {checkingAll ? "Checking..." : "Check All Links"}
            </Button>
          </>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: total, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
          { label: "Live", value: statMap["LIVE"] ?? 0, color: SUMMARY_COLORS.LIVE },
          { label: "Broken", value: statMap["BROKEN"] ?? 0, color: SUMMARY_COLORS.BROKEN },
          { label: "Redirects", value: statMap["REDIRECT"] ?? 0, color: SUMMARY_COLORS.REDIRECT },
          { label: "Deindexed", value: statMap["DEINDEXED"] ?? 0, color: SUMMARY_COLORS.DEINDEXED },
        ].map(card => (
          <Card key={card.label} className={`border ${card.color}`}>
            <CardContent className="p-3">
              <p className="text-xs font-medium">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? "border-indigo-500 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="text-left px-4 py-3 font-medium">Live URL</th>
                <th className="text-left px-4 py-3 font-medium">Domain</th>
                <th className="text-left px-4 py-3 font-medium">Anchor</th>
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Last Checked</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>
                ))
              ) : links.length === 0 ? (
                <tr><td colSpan={8}>
                  <EmptyState icon={Link2} title="No live links yet" description="Links appear here once orders go live." />
                </td></tr>
              ) : (
                links.map((link, i) => (
                  <tr key={link.id} className={`border-b last:border-0 hover:bg-muted/20 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                    <td className="px-4 py-3 max-w-48">
                      <a href={link.liveUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 text-xs">
                        <span className="truncate">{link.liveUrl}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-xs">{link.site?.domain ?? "—"}</td>
                    <td className="px-4 py-3 text-xs max-w-32 truncate">{link.anchorText || "—"}</td>
                    <td className="px-4 py-3 text-xs">{link.client?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={link.isDofollow ? "default" : "secondary"} className="text-xs">
                        {link.isDofollow ? "dofollow" : "nofollow"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={link.linkStatus} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {link.lastChecked ? new Date(link.lastChecked).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={() => checkSingle(link)} disabled={checkingId === link.id} className="gap-1 text-xs">
                        <RefreshCw className={`h-3 w-3 ${checkingId === link.id ? "animate-spin" : ""}`} />
                        Check
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
