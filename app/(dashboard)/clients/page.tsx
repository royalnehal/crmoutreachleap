"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Search, Users, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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

const TIERS = ["ONE_TIME", "REGULAR", "WHITE_LABEL", "AGENCY"]

type Client = {
  id: string
  name: string
  company?: string
  email: string
  whatsapp?: string
  country?: string
  niche: unknown
  tier: string
  currency: string
  createdAt: string
  _count?: { orders: number; liveLinks: number }
}

const FORM_DEFAULTS = {
  name: "", company: "", email: "", whatsapp: "", country: "", niche: "",
  tier: "ONE_TIME", currency: "USD", notes: "",
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState("ALL")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [form, setForm] = useState(FORM_DEFAULTS)
  const [saving, setSaving] = useState(false)

  const fetchClients = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ search, ...(tierFilter !== "ALL" ? { tier: tierFilter } : {}) })
      const res = await fetch(`/api/clients?${params}`)
      const data = await res.json()
      setClients(data.clients ?? [])
    } catch {
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }, [search, tierFilter])

  useEffect(() => { fetchClients() }, [fetchClients])

  function openAdd() {
    setEditingClient(null)
    setForm(FORM_DEFAULTS)
    setSheetOpen(true)
  }

  function openEdit(client: Client) {
    setEditingClient(client)
    setForm({
      name: client.name, company: client.company ?? "",
      email: client.email, whatsapp: client.whatsapp ?? "",
      country: client.country ?? "",
      niche: Array.isArray(client.niche) ? (client.niche as string[]).join(", ") : "",
      tier: client.tier, currency: client.currency, notes: "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        niche: form.niche ? form.niche.split(",").map((n: string) => n.trim()) : [],
      }
      const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients"
      const method = editingClient ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      toast.success(editingClient ? "Client updated" : "Client created")
      setSheetOpen(false)
      fetchClients()
    } catch {
      toast.error("Failed to save client")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await fetch(`/api/clients/${deleteTarget.id}`, { method: "DELETE" })
      toast.success("Client deleted")
      setDeleteTarget(null)
      fetchClients()
    } catch {
      toast.error("Failed to delete")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Clients"
        subtitle="Manage your client relationships"
        actions={
          <Button onClick={openAdd} className="gap-2" style={{ backgroundColor: "#6366F1" }}>
            <Plus className="h-4 w-4" /> Add Client
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={tierFilter} onValueChange={(v) => setTierFilter(v ?? "")}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Tiers</SelectItem>
            {TIERS.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState icon={Users} title="No clients yet" description="Add your first client to get started." action={{ label: "Add Client", onClick: openAdd }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clients.map(client => (
            <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/clients/${client.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{client.name}</h3>
                    {client.company && <p className="text-xs text-muted-foreground truncate">{client.company}</p>}
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{client.email}</p>
                  </div>
                  <StatusBadge status={client.tier} className="shrink-0 ml-2" />
                </div>
                <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                  <span>{client._count?.orders ?? 0} orders</span>
                  <span>{client._count?.liveLinks ?? 0} links</span>
                  {client.country && <span>{client.country}</span>}
                </div>
                <div className="flex gap-1 mt-3 justify-end" onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(client)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(client)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingClient ? "Edit Client" : "Add Client"}</SheetTitle>
            <SheetDescription>Fill in client details below.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Smith" /></div>
            <div><Label>Company</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@acme.com" /></div>
            <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="+1234567890" /></div>
            <div><Label>Country</Label><Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="US" /></div>
            <div><Label>Niche (comma-separated)</Label><Input value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} placeholder="SaaS, Marketing" /></div>
            <div>
              <Label>Tier</Label>
              <Select value={form.tier} onValueChange={v => setForm(f => ({ ...f, tier: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIERS.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["USD","EUR","GBP","AED","INR"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Client notes..." />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1" style={{ backgroundColor: "#6366F1" }}>
                {saving ? "Saving..." : editingClient ? "Update" : "Create Client"}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</AlertDialogDescription>
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
