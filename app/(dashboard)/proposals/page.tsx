"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Plus, FileText, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"

type Proposal = {
  id: string
  proposalNumber: string
  title: string
  budget?: number
  numberOfLinks?: number
  status: string
  sentAt?: string
  createdAt: string
  client: { id: string; name: string; company?: string }
}

type Client = { id: string; name: string; company?: string }

const PROP_STATUSES = ["DRAFT","SENT","APPROVED","REJECTED","CONVERTED"]

const FORM_DEFAULTS = {
  clientId: "", title: "", niche: "", daRange: "", budget: "", numberOfLinks: "",
  targetCountry: "", notes: "",
}

export default function ProposalsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null)
  const [form, setForm] = useState(FORM_DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])

  const fetchProposals = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams(statusFilter !== "ALL" ? { status: statusFilter } : {})
      const res = await fetch(`/api/proposals?${params}`)
      const data = await res.json()
      setProposals(data.proposals ?? [])
    } catch {
      setProposals([])
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchProposals() }, [fetchProposals])

  useEffect(() => {
    if (searchParams.get("new") === "true") openAdd()
  }, [searchParams])

  async function openAdd() {
    setForm(FORM_DEFAULTS)
    const cr = await fetch("/api/clients").then(r => r.json()).catch(() => ({ clients: [] }))
    setClients(cr.clients ?? [])
    setSheetOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        niche: form.niche ? form.niche.split(",").map(n => n.trim()) : [],
        budget: form.budget ? Number(form.budget) : null,
        numberOfLinks: form.numberOfLinks ? Number(form.numberOfLinks) : null,
      }
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success("Proposal created")
      setSheetOpen(false)
      router.push(`/proposals/${data.id}`)
    } catch {
      toast.error("Failed to create proposal")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await fetch(`/api/proposals/${deleteTarget.id}`, { method: "DELETE" })
      toast.success("Proposal deleted")
      setDeleteTarget(null)
      fetchProposals()
    } catch {
      toast.error("Failed to delete")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Proposals"
        subtitle="Create and manage client proposals"
        actions={
          <Button onClick={openAdd} className="gap-2" style={{ backgroundColor: "#6366F1" }}>
            <Plus className="h-4 w-4" /> New Proposal
          </Button>
        }
      />

      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "")}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            {PROP_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b">
              <th className="text-left px-4 py-3 font-medium">Proposal #</th>
              <th className="text-left px-4 py-3 font-medium">Client</th>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Budget</th>
              <th className="text-left px-4 py-3 font-medium">Links</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>
              ))
            ) : proposals.length === 0 ? (
              <tr><td colSpan={8}>
                <EmptyState icon={FileText} title="No proposals yet" description="Create your first proposal." action={{ label: "New Proposal", onClick: openAdd }} />
              </td></tr>
            ) : (
              proposals.map((p, i) => (
                <tr key={p.id} className={`border-b last:border-0 hover:bg-muted/20 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs">{p.proposalNumber}</td>
                  <td className="px-4 py-3">{p.client.name}</td>
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3">{p.budget ? `$${p.budget}` : "—"}</td>
                  <td className="px-4 py-3">{p.numberOfLinks ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => router.push(`/proposals/${p.id}`)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New Proposal</SheetTitle>
            <SheetDescription>Fill in details to generate a proposal.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            <div>
              <Label>Client *</Label>
              <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  {clients.length === 0
                    ? <SelectItem value="__none" disabled>No clients</SelectItem>
                    : clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="SaaS Link Building Package" /></div>
            <div><Label>Niche (comma-separated)</Label><Input value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} placeholder="Technology, SaaS" /></div>
            <div><Label>DA Range</Label><Input value={form.daRange} onChange={e => setForm(f => ({ ...f, daRange: e.target.value }))} placeholder="30-60" /></div>
            <div><Label>Budget ($)</Label><Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} /></div>
            <div><Label>Number of Links</Label><Input type="number" value={form.numberOfLinks} onChange={e => setForm(f => ({ ...f, numberOfLinks: e.target.value }))} /></div>
            <div><Label>Target Country</Label><Input value={form.targetCountry} onChange={e => setForm(f => ({ ...f, targetCountry: e.target.value }))} placeholder="US, UK..." /></div>
            <div>
              <Label>Notes</Label>
              <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional requirements..." />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1" style={{ backgroundColor: "#6366F1" }}>
                {saving ? "Creating..." : "Generate Proposal"}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Proposal</AlertDialogTitle>
            <AlertDialogDescription>Delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
