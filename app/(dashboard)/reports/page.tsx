"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/PageHeader"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"

const MONTHLY_DATA = [
  { month: "Jan", revenue: 4200, cost: 2100 },
  { month: "Feb", revenue: 5100, cost: 2450 },
  { month: "Mar", revenue: 4800, cost: 2300 },
  { month: "Apr", revenue: 6200, cost: 2950 },
  { month: "May", revenue: 7100, cost: 3300 },
  { month: "Jun", revenue: 6800, cost: 3150 },
]

const STATUS_DATA = [
  { name: "New", value: 8, color: "#94A3B8" },
  { name: "Content Writing", value: 14, color: "#F59E0B" },
  { name: "Submitted", value: 6, color: "#6366F1" },
  { name: "Live", value: 22, color: "#22C55E" },
  { name: "Delivered", value: 17, color: "#0EA5E9" },
  { name: "Cancelled", value: 3, color: "#EF4444" },
]

const TOP_CLIENTS = [
  { name: "Acme Corp", revenue: 8500 },
  { name: "TechStart Inc", revenue: 6200 },
  { name: "Digital Agency X", revenue: 5100 },
  { name: "Growth Lab", revenue: 3800 },
  { name: "Brand Co", revenue: 2900 },
]

const PLATFORM_DATA = [
  { platform: "Email", orders: 42 },
  { platform: "WhatsApp", orders: 28 },
  { platform: "Upwork", orders: 15 },
  { platform: "Fiverr", orders: 8 },
  { platform: "Direct", orders: 7 },
]

const LINK_HEALTH = [
  { name: "Live", value: 78, color: "#22C55E" },
  { name: "Broken", value: 8, color: "#EF4444" },
  { name: "Redirect", value: 10, color: "#F59E0B" },
  { name: "Deindexed", value: 4, color: "#94A3B8" },
]

const PRESETS = [
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "Last 3 Months", value: "last_3" },
  { label: "Last 6 Months", value: "last_6" },
  { label: "This Year", value: "this_year" },
]

export default function ReportsPage() {
  const [preset, setPreset] = useState("this_month")

  // Sample KPIs — in production these would come from /api/reports
  const kpis = [
    { label: "Total Revenue", value: "$34,200", color: "text-green-600" },
    { label: "Total Cost", value: "$16,250", color: "text-orange-600" },
    { label: "Gross Profit", value: "$17,950", color: "text-indigo-600" },
    { label: "Profit Margin", value: "52.5%", color: "text-purple-600" },
    { label: "Total Orders", value: "70", color: "" },
    { label: "Completed", value: "17", color: "text-green-600" },
    { label: "Cancelled", value: "3", color: "text-red-600" },
    { label: "Total Live Links", value: "150", color: "" },
    { label: "Broken Links %", value: "8%", color: "text-red-600" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        subtitle="Analytics and performance insights"
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={() => toast.info("PDF export coming soon")}>
              <Download className="h-4 w-4" /> Export PDF
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => toast.info("Excel export coming soon")}>
              <FileSpreadsheet className="h-4 w-4" /> Export Excel
            </Button>
          </>
        }
      />

      {/* Date range */}
      <div className="flex items-center gap-3">
        <Select value={preset} onValueChange={(v) => setPreset(v ?? "")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">Showing sample data (no DB connected)</span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-9 gap-3">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground leading-tight">{kpi.label}</p>
              <p className={`text-lg font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenue vs Cost</CardTitle>
            <CardDescription>Monthly breakdown (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MONTHLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#6366F1" radius={[4,4,0,0]} />
                <Bar dataKey="cost" name="Cost" fill="#F59E0B" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Orders by Status</CardTitle>
            <CardDescription>Current pipeline breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={STATUS_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                    {STATUS_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 flex-1">
                {STATUS_DATA.map(s => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top 5 Clients by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={TOP_CLIENTS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#6366F1" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Orders by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={PLATFORM_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#22C55E" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Link health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Link Health Summary</CardTitle>
          <CardDescription>Overall health of your backlink portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 items-center">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={LINK_HEALTH} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {LINK_HEALTH.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${Number(v)}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {LINK_HEALTH.map(h => (
                <div key={h.name} className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: h.color }} />
                  <span className="text-sm w-24">{h.name}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden w-32">
                    <div className="h-full rounded-full" style={{ width: `${h.value}%`, backgroundColor: h.color }} />
                  </div>
                  <span className="text-sm font-medium w-10">{h.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
