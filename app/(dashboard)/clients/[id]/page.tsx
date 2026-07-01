"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/shared/StatusBadge"

type Order = {
  id: string; orderNumber: string; status: string; agreedPrice: number; createdAt: string
  site: { siteName: string; domain: string }
}
type LiveLink = { id: string; liveUrl: string; anchorText?: string; linkStatus: string; lastChecked?: string }
type Proposal = { id: string; proposalNumber: string; title: string; status: string; createdAt: string }
type Client = {
  id: string; name: string; company?: string; email: string; whatsapp?: string
  country?: string; niche: unknown; tier: string; currency: string; notes?: string
  orders: Order[]; liveLinks: LiveLink[]; proposals: Proposal[]
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then(r => r.json())
      .then(d => setClient(d))
      .catch(() => setClient(null))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full" /></div>

  if (!client || (client as Record<string, unknown>).error) {
    return (
      <div className="text-center py-16">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Client not found or database unavailable.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/clients")}>Back</Button>
      </div>
    )
  }

  const totalSpend = client.orders.reduce((s, o) => s + Number(o.agreedPrice), 0)
  const activeOrders = client.orders.filter(o => !["DELIVERED","CANCELLED"].includes(o.status)).length
  const liveLinks = client.liveLinks.filter(l => l.linkStatus === "LIVE").length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/clients")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          {client.company && <p className="text-muted-foreground text-sm">{client.company}</p>}
        </div>
        <StatusBadge status={client.tier} />
        <Button onClick={() => router.push(`/clients?edit=${id}`)} variant="outline">Edit</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: client.orders.length },
          { label: "Total Spend", value: `$${totalSpend.toFixed(2)}` },
          { label: "Live Links", value: liveLinks },
          { label: "Active Orders", value: activeOrders },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-semibold mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader><CardTitle className="text-sm">Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Email: </span>{client.email}</div>
            {client.whatsapp && <div><span className="text-muted-foreground">WhatsApp: </span>{client.whatsapp}</div>}
            {client.country && <div><span className="text-muted-foreground">Country: </span>{client.country}</div>}
            <div><span className="text-muted-foreground">Currency: </span>{client.currency}</div>
            {Array.isArray(client.niche) && (client.niche as string[]).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(client.niche as string[]).map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="col-span-2">
          <Tabs defaultValue="orders">
            <TabsList>
              <TabsTrigger value="orders">Orders ({client.orders.length})</TabsTrigger>
              <TabsTrigger value="links">Live Links ({client.liveLinks.length})</TabsTrigger>
              <TabsTrigger value="proposals">Proposals ({client.proposals.length})</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-3">
              <div className="rounded-lg border bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/40 border-b">
                    <th className="text-left px-4 py-2 font-medium">Order #</th>
                    <th className="text-left px-4 py-2 font-medium">Site</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-right px-4 py-2 font-medium">Price</th>
                  </tr></thead>
                  <tbody>
                    {client.orders.length === 0
                      ? <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">No orders yet</td></tr>
                      : client.orders.map((o, i) => (
                        <tr key={o.id} className={`border-b last:border-0 hover:bg-muted/20 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                          <td className="px-4 py-2 font-mono text-xs">{o.orderNumber}</td>
                          <td className="px-4 py-2">{o.site.domain}</td>
                          <td className="px-4 py-2"><StatusBadge status={o.status} /></td>
                          <td className="px-4 py-2 text-right">${Number(o.agreedPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="links" className="mt-3">
              <div className="rounded-lg border bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/40 border-b">
                    <th className="text-left px-4 py-2 font-medium">URL</th>
                    <th className="text-left px-4 py-2 font-medium">Anchor</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                  </tr></thead>
                  <tbody>
                    {client.liveLinks.length === 0
                      ? <tr><td colSpan={3} className="text-center py-8 text-muted-foreground text-sm">No live links yet</td></tr>
                      : client.liveLinks.map((l, i) => (
                        <tr key={l.id} className={`border-b last:border-0 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                          <td className="px-4 py-2"><a href={l.liveUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs">{l.liveUrl}</a></td>
                          <td className="px-4 py-2 text-xs">{l.anchorText || "—"}</td>
                          <td className="px-4 py-2"><StatusBadge status={l.linkStatus} /></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="proposals" className="mt-3">
              <div className="rounded-lg border bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/40 border-b">
                    <th className="text-left px-4 py-2 font-medium">Proposal #</th>
                    <th className="text-left px-4 py-2 font-medium">Title</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                  </tr></thead>
                  <tbody>
                    {client.proposals.length === 0
                      ? <tr><td colSpan={3} className="text-center py-8 text-muted-foreground text-sm">No proposals yet</td></tr>
                      : client.proposals.map((p, i) => (
                        <tr key={p.id} className={`border-b last:border-0 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                          <td className="px-4 py-2 font-mono text-xs">{p.proposalNumber}</td>
                          <td className="px-4 py-2">{p.title}</td>
                          <td className="px-4 py-2"><StatusBadge status={p.status} /></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-3">
              <Card><CardContent className="pt-4">
                <p className="text-sm">{client.notes || <span className="text-muted-foreground">No notes yet.</span>}</p>
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
