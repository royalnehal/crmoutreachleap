"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Plus, List, LayoutGrid, Search, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { ShoppingCart } from "lucide-react"

const ORDER_STATUSES = ["NEW", "CONTENT_WRITING", "SUBMITTED", "LIVE", "DELIVERED", "REVISION", "CANCELLED"]

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-slate-100 border-slate-200",
  CONTENT_WRITING: "bg-amber-50 border-amber-200",
  SUBMITTED: "bg-blue-50 border-blue-200",
  LIVE: "bg-green-50 border-green-200",
  DELIVERED: "bg-indigo-50 border-indigo-200",
  REVISION: "bg-orange-50 border-orange-200",
  CANCELLED: "bg-red-50 border-red-200",
}

type Order = {
  id: string
  orderNumber: string
  status: string
  agreedPrice: number
  costPrice: number
  deadline?: string
  assignedTo?: string
  platform?: string
  anchorText: string
  targetUrl: string
  client: { id: string; name: string; company?: string }
  site: { id: string; siteName: string; domain: string }
  createdAt: string
}

type Client = { id: string; name: string; company?: string }
type Site = { id: string; siteName: string; domain: string }

function deadlineUrgency(deadline?: string) {
  if (!deadline) return "none"
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (days < 0) return "red"
  if (days <= 3) return "yellow"
  return "green"
}

function KanbanCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const urgency = deadlineUrgency(order.deadline)
  const urgencyClass = urgency === "red" ? "border-l-red-500" : urgency === "yellow" ? "border-l-amber-500" : "border-l-green-500"

  return (
    <div
      className={`bg-white rounded-lg border border-l-4 ${urgencyClass} p-3 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-xs font-mono text-muted-foreground">{order.orderNumber}</span>
        <span className="text-xs font-semibold">${order.agreedPrice}</span>
      </div>
      <p className="text-sm font-medium mt-1 truncate">{order.client.name}</p>
      <p className="text-xs text-muted-foreground truncate">{order.site.domain}</p>
      {order.anchorText && (
        <p className="text-xs text-indigo-600 truncate mt-1">{order.anchorText}</p>
      )}
      {order.assignedTo && (
        <p className="text-xs text-muted-foreground mt-1">@{order.assignedTo}</p>
      )}
      {order.deadline && (
        <p className={`text-xs mt-1 font-medium ${urgency === "red" ? "text-red-600" : urgency === "yellow" ? "text-amber-600" : "text-green-600"}`}>
          Due: {new Date(order.deadline).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

const ORDER_FORM_DEFAULTS = {
  clientId: "", siteId: "", targetUrl: "", anchorText: "", contentBrief: "",
  agreedPrice: 0, costPrice: 0, deadline: "", assignedTo: "", platform: "",
  status: "NEW",
}

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null)
  const [form, setForm] = useState(ORDER_FORM_DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [step, setStep] = useState(1)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders ?? [])
    } catch {
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      openAdd()
    }
  }, [searchParams])

  async function loadClientsAndSites() {
    const [cr, sr] = await Promise.all([
      fetch("/api/clients").then(r => r.json()).catch(() => ({ clients: [] })),
      fetch("/api/sites").then(r => r.json()).catch(() => ({ sites: [] })),
    ])
    setClients(cr.clients ?? [])
    setSites(sr.sites ?? [])
  }

  function openAdd() {
    setEditingOrder(null)
    setForm(ORDER_FORM_DEFAULTS)
    setStep(1)
    loadClientsAndSites()
    setSheetOpen(true)
  }

  function openEdit(order: Order) {
    setEditingOrder(order)
    setForm({
      clientId: order.client.id, siteId: order.site.id,
      targetUrl: order.targetUrl, anchorText: order.anchorText,
      contentBrief: "", agreedPrice: order.agreedPrice, costPrice: order.costPrice,
      deadline: order.deadline ? order.deadline.split("T")[0] : "",
      assignedTo: order.assignedTo ?? "", platform: order.platform ?? "",
      status: order.status,
    })
    setStep(1)
    loadClientsAndSites()
    setSheetOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        agreedPrice: Number(form.agreedPrice),
        costPrice: Number(form.costPrice),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      }
      const url = editingOrder ? `/api/orders/${editingOrder.id}` : "/api/orders"
      const method = editingOrder ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error("Save failed")
      toast.success(editingOrder ? "Order updated" : "Order created")
      setSheetOpen(false)
      fetchOrders()
    } catch {
      toast.error("Failed to save order")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await fetch(`/api/orders/${deleteTarget.id}`, { method: "DELETE" })
      toast.success("Order deleted")
      setDeleteTarget(null)
      fetchOrders()
    } catch {
      toast.error("Failed to delete")
    }
  }

  const filtered = orders.filter(o => {
    if (!search) return true
    const q = search.toLowerCase()
    return o.orderNumber.toLowerCase().includes(q) ||
      o.client.name.toLowerCase().includes(q) ||
      o.site.domain.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Orders"
        subtitle="Manage your guest post orders"
        actions={
          <>
            <div className="flex rounded-lg border overflow-hidden">
              <Button variant={view === "kanban" ? "default" : "ghost"} size="sm" className="rounded-none gap-1" onClick={() => setView("kanban")}
                style={view === "kanban" ? { backgroundColor: "#6366F1" } : {}}>
                <LayoutGrid className="h-4 w-4" /> Kanban
              </Button>
              <Button variant={view === "list" ? "default" : "ghost"} size="sm" className="rounded-none gap-1" onClick={() => setView("list")}
                style={view === "list" ? { backgroundColor: "#6366F1" } : {}}>
                <List className="h-4 w-4" /> List
              </Button>
            </div>
            <Button onClick={openAdd} className="gap-2" style={{ backgroundColor: "#6366F1" }}>
              <Plus className="h-4 w-4" /> New Order
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {ORDER_STATUSES.map(status => {
              const colOrders = filtered.filter(o => o.status === status)
              return (
                <div key={status} className={`w-64 rounded-lg border p-3 ${STATUS_COLORS[status]}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide">{status.replace("_", " ")}</h3>
                    <Badge variant="secondary" className="text-xs">{colOrders.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {colOrders.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No orders</p>
                    ) : (
                      colOrders.map(o => (
                        <KanbanCard key={o.id} order={o} onClick={() => router.push(`/orders/${o.id}`)} />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {filtered.length === 0 && !isLoading && (
            <EmptyState icon={ShoppingCart} title="No orders yet" description="Create your first order to get started." action={{ label: "New Order", onClick: openAdd }} />
          )}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b">
                  <th className="text-left px-4 py-3 font-medium">Order #</th>
                  <th className="text-left px-4 py-3 font-medium">Client</th>
                  <th className="text-left px-4 py-3 font-medium">Site</th>
                  <th className="text-left px-4 py-3 font-medium">Anchor</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Price</th>
                  <th className="text-left px-4 py-3 font-medium">Deadline</th>
                  <th className="text-left px-4 py-3 font-medium">Assigned</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="h-4 bg-muted/30 rounded animate-pulse" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9}>
                    <EmptyState icon={ShoppingCart} title="No orders yet" description="Create your first order to get started." action={{ label: "New Order", onClick: openAdd }} />
                  </td></tr>
                ) : (
                  filtered.map((order, i) => {
                    const urgency = deadlineUrgency(order.deadline)
                    return (
                      <tr key={order.id} className={`border-b last:border-0 hover:bg-muted/20 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                        <td className="px-4 py-3 font-mono text-xs font-medium">{order.orderNumber}</td>
                        <td className="px-4 py-3">{order.client.name}</td>
                        <td className="px-4 py-3 text-indigo-600">{order.site.domain}</td>
                        <td className="px-4 py-3 max-w-32 truncate">{order.anchorText}</td>
                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-4 py-3 font-medium">${order.agreedPrice}</td>
                        <td className={`px-4 py-3 text-xs ${urgency === "red" ? "text-red-600 font-medium" : urgency === "yellow" ? "text-amber-600" : ""}`}>
                          {order.deadline ? new Date(order.deadline).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{order.assignedTo || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => router.push(`/orders/${order.id}`)}><Eye className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(order)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(order)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New/Edit Order Sheet (multi-step) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingOrder ? "Edit Order" : "New Order"}</SheetTitle>
            <SheetDescription>
              {editingOrder ? "Update order details." : `Step ${step} of 4`}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {!editingOrder && (
              <div className="flex gap-1 mb-4">
                {[1,2,3,4].map(s => (
                  <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? "bg-indigo-500" : "bg-muted"}`} />
                ))}
              </div>
            )}

            {(step === 1 || editingOrder) && (
              <div className="space-y-3">
                {!editingOrder && <h3 className="font-semibold">1. Select Client</h3>}
                <div>
                  <Label>Client</Label>
                  <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v ?? "" }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.length === 0
                        ? <SelectItem value="__none" disabled>No clients (DB unavailable)</SelectItem>
                        : clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(step === 2 || editingOrder) && (
              <div className="space-y-3">
                {!editingOrder && <h3 className="font-semibold">2. Select Site</h3>}
                <div>
                  <Label>Site</Label>
                  <Select value={form.siteId} onValueChange={v => setForm(f => ({ ...f, siteId: v ?? "" }))}>
                    <SelectTrigger><SelectValue placeholder="Select site..." /></SelectTrigger>
                    <SelectContent>
                      {sites.length === 0
                        ? <SelectItem value="__none" disabled>No sites (DB unavailable)</SelectItem>
                        : sites.map(s => <SelectItem key={s.id} value={s.id}>{s.domain} — {s.siteName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(step === 3 || editingOrder) && (
              <div className="space-y-3">
                {!editingOrder && <h3 className="font-semibold">3. Content Details</h3>}
                <div>
                  <Label>Target URL *</Label>
                  <Input value={form.targetUrl} onChange={e => setForm(f => ({ ...f, targetUrl: e.target.value }))} placeholder="https://yourclient.com/page" />
                </div>
                <div>
                  <Label>Anchor Text *</Label>
                  <Input value={form.anchorText} onChange={e => setForm(f => ({ ...f, anchorText: e.target.value }))} placeholder="best CRM software" />
                </div>
                <div>
                  <Label>Content Brief</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20"
                    value={form.contentBrief}
                    onChange={e => setForm(f => ({ ...f, contentBrief: e.target.value }))}
                    placeholder="Content guidelines..."
                  />
                </div>
              </div>
            )}

            {(step === 4 || editingOrder) && (
              <div className="space-y-3">
                {!editingOrder && <h3 className="font-semibold">4. Pricing & Assignment</h3>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Agreed Price ($)</Label>
                    <Input type="number" step="0.01" value={form.agreedPrice} onChange={e => setForm(f => ({ ...f, agreedPrice: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Cost Price ($)</Label>
                    <Input type="number" step="0.01" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Deadline</Label>
                    <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Platform</Label>
                    <Input value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} placeholder="Email, WhatsApp..." />
                  </div>
                  <div className="col-span-2">
                    <Label>Assigned To</Label>
                    <Input value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="team member name" />
                  </div>
                </div>
              </div>
            )}

            <Separator />

            <div className="flex gap-2">
              {!editingOrder && step > 1 && (
                <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>
              )}
              {!editingOrder && step < 4 ? (
                <Button className="flex-1" style={{ backgroundColor: "#6366F1" }} onClick={() => setStep(s => s + 1)}>
                  Next
                </Button>
              ) : (
                <Button className="flex-1" style={{ backgroundColor: "#6366F1" }} onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : editingOrder ? "Update Order" : "Create Order"}
                </Button>
              )}
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Delete order <strong>{deleteTarget?.orderNumber}</strong>? This cannot be undone.
            </AlertDialogDescription>
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
