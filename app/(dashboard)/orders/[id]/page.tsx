"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Circle, ExternalLink, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/shared/StatusBadge"

const ORDER_STATUSES = ["NEW","CONTENT_WRITING","SUBMITTED","LIVE","DELIVERED","REVISION","CANCELLED"]

type Order = {
  id: string
  orderNumber: string
  status: string
  agreedPrice: number
  costPrice: number
  profitMargin: number
  deadline?: string
  assignedTo?: string
  platform?: string
  anchorText: string
  targetUrl: string
  contentBrief?: string
  contentDraftUrl?: string
  liveUrl?: string
  notes?: string
  createdAt: string
  deliveredAt?: string
  client: { id: string; name: string; company?: string; email: string }
  site: { id: string; siteName: string; domain: string }
}

function StatusStepper({ current }: { current: string }) {
  const idx = ORDER_STATUSES.indexOf(current)
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {ORDER_STATUSES.map((s, i) => {
        const done = i < idx
        const active = i === idx
        return (
          <div key={s} className="flex items-center">
            <div className={`flex flex-col items-center gap-1 min-w-16 ${active ? "opacity-100" : done ? "opacity-80" : "opacity-40"}`}>
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className={`h-5 w-5 ${active ? "text-indigo-500" : "text-muted-foreground"}`} />
              )}
              <span className={`text-[10px] text-center leading-tight ${active ? "font-semibold text-indigo-600" : "text-muted-foreground"}`}>
                {s.replace("_", " ")}
              </span>
            </div>
            {i < ORDER_STATUSES.length - 1 && (
              <div className={`h-px w-6 mx-1 ${i < idx ? "bg-green-400" : "bg-muted"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [liveUrl, setLiveUrl] = useState("")
  const [contentDraftUrl, setContentDraftUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [checkingLink, setCheckingLink] = useState(false)

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(d => {
        setOrder(d)
        setStatus(d.status ?? "NEW")
        setLiveUrl(d.liveUrl ?? "")
        setContentDraftUrl(d.contentDraftUrl ?? "")
        setNotes(d.notes ?? "")
      })
      .catch(() => setOrder(null))
      .finally(() => setIsLoading(false))
  }, [id])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, liveUrl, contentDraftUrl, notes }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setOrder(updated)
      toast.success("Order updated")
    } catch {
      toast.error("Failed to update")
    } finally {
      setSaving(false)
    }
  }

  async function verifyLink() {
    if (!liveUrl) return toast.error("Enter a live URL first")
    setCheckingLink(true)
    try {
      const res = await fetch("/api/links/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: liveUrl }),
      })
      const data = await res.json()
      toast.success(`Link check: ${data.status} (HTTP ${data.httpCode}) — ${data.isDofollow ? "dofollow" : "nofollow"}`)
    } catch {
      toast.error("Link check failed")
    } finally {
      setCheckingLink(false)
    }
  }

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>
  }

  if (!order || (order as Record<string, unknown>).error) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Order not found or database unavailable.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/orders")}>Back to Orders</Button>
      </div>
    )
  }

  const isAdmin = true // TODO: check session role
  const profit = Number(order.agreedPrice) - Number(order.costPrice)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/orders")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{order.client.name} — {order.site.domain}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Status timeline */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Status Timeline</CardTitle></CardHeader>
        <CardContent>
          <StatusStepper current={status} />
          <div className="flex items-center gap-3 mt-4">
            <Label className="shrink-0">Update Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Order Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Target URL</span>
              <a href={order.targetUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                {order.targetUrl.length > 30 ? order.targetUrl.slice(0, 30) + "…" : order.targetUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex justify-between"><span className="text-muted-foreground">Anchor Text</span><span>{order.anchorText}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><span>{order.platform || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Assigned To</span><span>{order.assignedTo || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Deadline</span>
              <span>{order.deadline ? new Date(order.deadline).toLocaleDateString() : "—"}</span>
            </div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Financials</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Agreed Price</span>
              <span className="font-semibold text-green-600">${Number(order.agreedPrice).toFixed(2)}</span>
            </div>
            {isAdmin && (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Cost Price</span>
                  <span>${Number(order.costPrice).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Profit Margin</span>
                  <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                    ${profit.toFixed(2)} ({order.agreedPrice > 0 ? Math.round((profit / Number(order.agreedPrice)) * 100) : 0}%)
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live URL + Content Draft */}
      <Card>
        <CardHeader><CardTitle className="text-sm">URLs</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Live URL</Label>
            <div className="flex gap-2 mt-1">
              <Input value={liveUrl} onChange={e => setLiveUrl(e.target.value)} placeholder="https://site.com/post-url" />
              <Button variant="outline" onClick={verifyLink} disabled={checkingLink}>
                {checkingLink ? "Checking..." : "Verify Link"}
              </Button>
            </div>
          </div>
          <div>
            <Label>Content Draft URL</Label>
            <Input value={contentDraftUrl} onChange={e => setContentDraftUrl(e.target.value)} className="mt-1" placeholder="https://docs.google.com/..." />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
        <CardContent>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-28"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Internal notes, activity log..."
          />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2" style={{ backgroundColor: "#6366F1" }}>
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={() => toast.info("PDF generation coming soon")}>
          Generate Delivery Report
        </Button>
      </div>
    </div>
  )
}
