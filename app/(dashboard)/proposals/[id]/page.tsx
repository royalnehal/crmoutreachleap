"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/shared/StatusBadge"

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

export default function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/proposals/${id}`)
      .then(r => r.json())
      .then(d => { setProposal(d); setStatus(d.status) })
      .catch(() => setProposal(null))
      .finally(() => setIsLoading(false))
  }, [id])

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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/proposals")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{proposal.title}</h1>
          <p className="text-sm text-muted-foreground font-mono">{proposal.proposalNumber} · {proposal.client.name}</p>
        </div>
        <StatusBadge status={proposal.status} />
        <Button variant="outline" onClick={() => toast.info("PDF generation coming soon")}>Export PDF</Button>
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
        <CardHeader><CardTitle className="text-sm">Selected Sites</CardTitle></CardHeader>
        <CardContent>
          {Array.isArray(proposal.selectedSites) && (proposal.selectedSites as unknown[]).length > 0 ? (
            <p className="text-sm text-muted-foreground">{(proposal.selectedSites as unknown[]).length} sites selected</p>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No sites selected yet. Sites matching the niche/DA criteria will appear here once the database is connected.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
