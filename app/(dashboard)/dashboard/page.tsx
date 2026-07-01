import Link from "next/link"

import { prisma } from "@/lib/db"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DashboardCharts,
  type RevenueTrendPoint,
  type StatusBreakdownPoint,
} from "./_components/dashboard-charts"

type RecentOrder = {
  id: string
  orderNumber: string
  status: string
  agreedPrice: string
  client: { name: string }
  site: { siteName: string }
  createdAt: Date
}

type DashboardStats = {
  totalSites: number
  activeOrders: number
  revenueThisMonth: number
  profitThisMonth: number
  liveLinks: number
  brokenLinks: number
  recentOrders: RecentOrder[]
}

const EMPTY_STATS: DashboardStats = {
  totalSites: 0,
  activeOrders: 0,
  revenueThisMonth: 0,
  profitThisMonth: 0,
  liveLinks: 0,
  brokenLinks: 0,
  recentOrders: [],
}

async function getDashboardStats(): Promise<DashboardStats> {
  // There is no live MySQL instance in this environment yet, so every Prisma
  // call here is wrapped in try/catch and falls back to zeroed placeholder
  // stats — this keeps the dashboard rendering instead of crashing in dev.
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalSites,
      activeOrders,
      monthlyOrders,
      liveLinks,
      brokenLinks,
      recentOrders,
    ] = await Promise.all([
      prisma.site.count(),
      prisma.order.count({
        where: { status: { in: ["NEW", "CONTENT_WRITING", "SUBMITTED"] } },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: { agreedPrice: true, costPrice: true },
      }),
      prisma.liveLink.count({ where: { linkStatus: "LIVE" } }),
      prisma.liveLink.count({ where: { linkStatus: "BROKEN" } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          agreedPrice: true,
          createdAt: true,
          client: { select: { name: true } },
          site: { select: { siteName: true } },
        },
      }),
    ])

    const revenueThisMonth = monthlyOrders.reduce(
      (sum, order) => sum + Number(order.agreedPrice),
      0
    )
    const profitThisMonth = monthlyOrders.reduce(
      (sum, order) => sum + (Number(order.agreedPrice) - Number(order.costPrice)),
      0
    )

    return {
      totalSites,
      activeOrders,
      revenueThisMonth,
      profitThisMonth,
      liveLinks,
      brokenLinks,
      recentOrders: recentOrders.map((order) => ({
        ...order,
        agreedPrice: order.agreedPrice.toString(),
      })),
    }
  } catch (error) {
    console.error("Dashboard stats unavailable, falling back to placeholders:", error)
    return EMPTY_STATS
  }
}

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  NEW: "secondary",
  CONTENT_WRITING: "outline",
  SUBMITTED: "outline",
  LIVE: "default",
  DELIVERED: "default",
}

const SAMPLE_STATUS_BREAKDOWN: StatusBreakdownPoint[] = [
  { name: "New", value: 8, color: "#94A3B8" },
  { name: "Content Writing", value: 14, color: "#F59E0B" },
  { name: "Submitted", value: 6, color: "#6366F1" },
  { name: "Live", value: 22, color: "#22C55E" },
  { name: "Delivered", value: 17, color: "#0EA5E9" },
]

const SAMPLE_REVENUE_TREND: RevenueTrendPoint[] = [
  { month: "Jan", revenue: 4200, cost: 2100 },
  { month: "Feb", revenue: 5100, cost: 2450 },
  { month: "Mar", revenue: 4800, cost: 2300 },
  { month: "Apr", revenue: 6200, cost: 2950 },
  { month: "May", revenue: 7100, cost: 3300 },
  { month: "Jun", revenue: 6800, cost: 3150 },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const kpis = [
    { label: "Total Sites", value: stats.totalSites.toLocaleString() },
    { label: "Active Orders", value: stats.activeOrders.toLocaleString() },
    { label: "Revenue This Month", value: formatCurrency(stats.revenueThisMonth) },
    { label: "Profit This Month", value: formatCurrency(stats.profitThisMonth) },
    { label: "Live Links", value: stats.liveLinks.toLocaleString() },
    { label: "Broken Links", value: stats.brokenLinks.toLocaleString() },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            An overview of your outreach pipeline.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/sites?new=true" />}>Add Site</Button>
          <Button variant="secondary" render={<Link href="/orders?new=true" />}>
            New Order
          </Button>
          <Button variant="outline" render={<Link href="/proposals?new=true" />}>
            New Proposal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardDescription>{kpi.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardCharts
        statusBreakdown={SAMPLE_STATUS_BREAKDOWN}
        revenueTrend={SAMPLE_REVENUE_TREND}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>The last 10 orders placed.</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No orders yet. Create your first order to see it here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{order.client.name}</TableCell>
                    <TableCell>{order.site.siteName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_BADGE_VARIANT[order.status] ?? "secondary"}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(order.agreedPrice))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
