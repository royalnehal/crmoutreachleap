"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  Plus, Search, Upload, Filter, Globe, Eye, EyeOff, Pencil, Trash2, ChevronDown, ChevronUp, X
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"

type Site = {
  id: string
  siteName: string
  domain: string
  da: number
  dr: number
  traffic: number
  niche: unknown
  linkType: string
  generalPrice: number
  costPrice: number
  siteStatus: string
  country: string
  currency: string
}

const SITE_FIELDS_DEFAULTS = {
  siteName: "", domain: "", siteType: "BLOG", country: "US", niche: "",
  subNiche: "", language: "English", da: 0, dr: 0, traffic: 0,
  trafficSource: "Ahrefs", spamScore: 0, referringDomains: 0, indexedPages: 0,
  linkType: "DOFOLLOW", minWordCount: 500, externalLinksAllowed: 2,
  tat: "5-7 days", contentWrittenBy: "AGENCY", acceptsAiContent: "YES",
  generalPrice: 0, casinoGamblingPrice: 0, adultPrice: 0, pharmacyPrice: 0,
  cryptoFinancePrice: 0, datingPrice: 0, forexTradingPrice: 0, costPrice: 0,
  currency: "USD", contactName: "", contactEmail: "", whatsapp: "", telegram: "",
  relationshipStatus: "COLD", responseRate: "MEDIUM", siteStatus: "ACTIVE",
  googlePenalized: "NO", editorialStandards: "MODERATE", internalNotes: "",
  sponsoredTag: false, imagesRequired: false, authorBioAllowed: false,
}

function DualRangeSlider({
  label, min, max, valueMin, valueMax, unit = "",
  onChangeMin, onChangeMax,
}: {
  label: string; min: number; max: number; valueMin: number; valueMax: number
  unit?: string; onChangeMin: (v: number) => void; onChangeMax: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="text-indigo-600 font-semibold">{unit}{valueMin} – {unit}{valueMax}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-4">{min}</span>
          <input
            type="range" min={min} max={max} value={valueMin}
            onChange={e => onChangeMin(Math.min(Number(e.target.value), valueMax - 1))}
            className="flex-1 h-1.5 accent-indigo-500 cursor-pointer"
          />
          <span className="text-xs text-muted-foreground w-6 text-right">{max}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-4">{min}</span>
          <input
            type="range" min={min} max={max} value={valueMax}
            onChange={e => onChangeMax(Math.max(Number(e.target.value), valueMin + 1))}
            className="flex-1 h-1.5 accent-indigo-500 cursor-pointer"
          />
          <span className="text-xs text-muted-foreground w-6 text-right">{max}</span>
        </div>
      </div>
    </div>
  )
}

export default function SitesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAdmin = session?.user?.role === "ADMIN"

  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [linkTypeFilter, setLinkTypeFilter] = useState("ALL")
  const [countryFilter, setCountryFilter] = useState("")
  const [nicheFilter, setNicheFilter] = useState("")
  const [daMin, setDaMin] = useState(0)
  const [daMax, setDaMax] = useState(100)
  const [priceMin, setPriceMin] = useState(0)
  const [priceMax, setPriceMax] = useState(2000)
  const [filtersActive, setFiltersActive] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showCostPrice, setShowCostPrice] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Site | null>(null)
  const [form, setForm] = useState(SITE_FIELDS_DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 25

  const hasActiveFilters = daMin > 0 || daMax < 100 || priceMin > 0 || priceMax < 2000
    || nicheFilter || countryFilter || linkTypeFilter !== "ALL" || statusFilter !== "ALL"

  const fetchSites = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        search, page: String(page), pageSize: String(pageSize),
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        ...(linkTypeFilter !== "ALL" ? { linkType: linkTypeFilter } : {}),
        ...(countryFilter ? { country: countryFilter } : {}),
        ...(nicheFilter ? { niche: nicheFilter } : {}),
        ...(daMin > 0 ? { daMin: String(daMin) } : {}),
        ...(daMax < 100 ? { daMax: String(daMax) } : {}),
        ...(priceMin > 0 ? { priceMin: String(priceMin) } : {}),
        ...(priceMax < 2000 ? { priceMax: String(priceMax) } : {}),
      })
      const res = await fetch(`/api/sites?${params}`)
      const data = await res.json()
      setSites(data.sites ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setSites([])
    } finally {
      setIsLoading(false)
    }
  }, [search, page, statusFilter, linkTypeFilter, countryFilter, nicheFilter, daMin, daMax, priceMin, priceMax])

  useEffect(() => { fetchSites() }, [fetchSites])

  useEffect(() => {
    setFiltersActive(hasActiveFilters)
  }, [hasActiveFilters])

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setSheetOpen(true)
    }
  }, [searchParams])

  function resetFilters() {
    setStatusFilter("ALL")
    setLinkTypeFilter("ALL")
    setCountryFilter("")
    setNicheFilter("")
    setDaMin(0)
    setDaMax(100)
    setPriceMin(0)
    setPriceMax(2000)
    setPage(1)
  }

  function openAdd() {
    setEditingSite(null)
    setForm(SITE_FIELDS_DEFAULTS)
    setSheetOpen(true)
  }

  function openEdit(site: Site) {
    setEditingSite(site)
    setForm({ ...SITE_FIELDS_DEFAULTS, ...site, niche: Array.isArray((site as Record<string, unknown>).niche) ? ((site as Record<string, unknown>).niche as string[]).join(", ") : "" })
    setSheetOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        niche: form.niche ? form.niche.split(",").map((n: string) => n.trim()) : [],
        da: Number(form.da), dr: Number(form.dr), traffic: Number(form.traffic),
        generalPrice: Number(form.generalPrice), costPrice: Number(form.costPrice),
        minWordCount: Number(form.minWordCount), externalLinksAllowed: Number(form.externalLinksAllowed),
        spamScore: Number(form.spamScore), referringDomains: Number(form.referringDomains),
        indexedPages: Number(form.indexedPages),
        casinoGamblingPrice: Number(form.casinoGamblingPrice),
        adultPrice: Number(form.adultPrice), pharmacyPrice: Number(form.pharmacyPrice),
        cryptoFinancePrice: Number(form.cryptoFinancePrice), datingPrice: Number(form.datingPrice),
        forexTradingPrice: Number(form.forexTradingPrice),
        acceptedPostTypes: [], paymentMethod: [], sampleUrls: [],
      }
      const url = editingSite ? `/api/sites/${editingSite.id}` : "/api/sites"
      const method = editingSite ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error("Save failed")
      toast.success(editingSite ? "Site updated" : "Site created")
      setSheetOpen(false)
      fetchSites()
    } catch {
      toast.error("Failed to save site")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await fetch(`/api/sites/${deleteTarget.id}`, { method: "DELETE" })
      toast.success("Site deleted")
      setDeleteTarget(null)
      fetchSites()
    } catch {
      toast.error("Failed to delete site")
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Sites"
        subtitle={`Master sheet · ${total} sites`}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/sites/import")} className="gap-2">
              <Upload className="h-4 w-4" /> Import
            </Button>
            <Button onClick={openAdd} className="gap-2" style={{ backgroundColor: "#6366F1" }}>
              <Plus className="h-4 w-4" /> Add Site
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by domain, name or niche..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
          style={showFilters ? { backgroundColor: "#6366F1" } : {}}
        >
          <Filter className="h-4 w-4" />
          Filters
          {filtersActive && <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-white text-indigo-600">!</Badge>}
          {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground">
            <X className="h-3 w-3" /> Clear filters
          </Button>
        )}
        {isAdmin && (
          <Button variant="ghost" size="sm" onClick={() => setShowCostPrice(!showCostPrice)} className="gap-1 text-muted-foreground">
            {showCostPrice ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showCostPrice ? "Hide Cost" : "Show Cost"}
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v ?? "ALL"); setPage(1) }}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Link Type */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Link Type</Label>
              <Select value={linkTypeFilter} onValueChange={v => { setLinkTypeFilter(v ?? "ALL"); setPage(1) }}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="DOFOLLOW">Dofollow</SelectItem>
                  <SelectItem value="NOFOLLOW">Nofollow</SelectItem>
                  <SelectItem value="MIXED">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Niche */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Niche</Label>
              <Input
                placeholder="e.g. Technology"
                className="h-8 text-sm"
                value={nicheFilter}
                onChange={e => { setNicheFilter(e.target.value); setPage(1) }}
              />
            </div>
            {/* Country */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Input
                placeholder="e.g. US, UK"
                className="h-8 text-sm"
                value={countryFilter}
                onChange={e => { setCountryFilter(e.target.value); setPage(1) }}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* DA Range */}
            <DualRangeSlider
              label="Domain Authority (DA)"
              min={0} max={100}
              valueMin={daMin} valueMax={daMax}
              onChangeMin={v => { setDaMin(v); setPage(1) }}
              onChangeMax={v => { setDaMax(v); setPage(1) }}
            />
            {/* Price Range */}
            <DualRangeSlider
              label="General Price"
              min={0} max={2000}
              valueMin={priceMin} valueMax={priceMax}
              unit="$"
              onChangeMin={v => { setPriceMin(v); setPage(1) }}
              onChangeMax={v => { setPriceMax(v); setPage(1) }}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="text-left px-4 py-3 font-medium">Domain</th>
                <th className="text-left px-4 py-3 font-medium">DA</th>
                <th className="text-left px-4 py-3 font-medium">DR</th>
                <th className="text-left px-4 py-3 font-medium">Traffic</th>
                <th className="text-left px-4 py-3 font-medium">Niche</th>
                <th className="text-left px-4 py-3 font-medium">Country</th>
                <th className="text-left px-4 py-3 font-medium">Link Type</th>
                <th className="text-left px-4 py-3 font-medium">Price</th>
                {isAdmin && showCostPrice && <th className="text-left px-4 py-3 font-medium">Cost</th>}
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-muted/10" : ""}>
                    {Array.from({ length: 10 + (isAdmin && showCostPrice ? 1 : 0) }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : sites.length === 0 ? (
                <tr>
                  <td colSpan={10 + (isAdmin && showCostPrice ? 1 : 0)}>
                    <EmptyState
                      icon={Globe}
                      title="No sites found"
                      description={hasActiveFilters ? "Try adjusting your filters." : "Import your site list or add your first site manually."}
                      action={hasActiveFilters ? { label: "Clear Filters", onClick: resetFilters } : { label: "Add Site", onClick: openAdd }}
                    />
                  </td>
                </tr>
              ) : (
                sites.map((site, i) => (
                  <tr
                    key={site.id}
                    className={`border-b last:border-0 hover:bg-muted/20 ${i % 2 === 1 ? "bg-muted/10" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-indigo-600 cursor-pointer hover:underline" onClick={() => router.push(`/sites/${site.id}`)}>{site.domain}</div>
                      <div className="text-xs text-muted-foreground">{site.siteName}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">{site.da}</td>
                    <td className="px-4 py-3">{site.dr}</td>
                    <td className="px-4 py-3">{site.traffic?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {Array.isArray(site.niche)
                        ? (site.niche as string[]).slice(0, 2).map((n) => (
                          <Badge key={n} variant="secondary" className="mr-1 text-xs">{n}</Badge>
                        ))
                        : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{site.country}</td>
                    <td className="px-4 py-3">
                      <Badge variant={site.linkType === "DOFOLLOW" ? "default" : "secondary"} className="text-xs">
                        {site.linkType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">${site.generalPrice}</td>
                    {isAdmin && showCostPrice && (
                      <td className="px-4 py-3 text-muted-foreground">${site.costPrice}</td>
                    )}
                    <td className="px-4 py-3"><StatusBadge status={site.siteStatus} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/sites/${site.id}`)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(site)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(site)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingSite ? "Edit Site" : "Add New Site"}</SheetTitle>
            <SheetDescription>Fill in the site details below.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Basic Info</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Site Name *</Label><Input value={form.siteName} onChange={e => setForm(f => ({ ...f, siteName: e.target.value }))} placeholder="My Blog" /></div>
                <div><Label>Domain *</Label><Input value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} placeholder="example.com" /></div>
                <div>
                  <Label>Site Type</Label>
                  <Select value={form.siteType} onValueChange={v => setForm(f => ({ ...f, siteType: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["BLOG","MAGAZINE","NEWS","FORUM","NICHE_SITE"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Country</Label><Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="US" /></div>
                <div className="col-span-2"><Label>Niche (comma-separated)</Label><Input value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} placeholder="Technology, SaaS" /></div>
                <div><Label>Sub Niche</Label><Input value={form.subNiche} onChange={e => setForm(f => ({ ...f, subNiche: e.target.value }))} /></div>
                <div><Label>Language</Label><Input value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} /></div>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">SEO Metrics</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "DA", key: "da" }, { label: "DR", key: "dr" }, { label: "Traffic", key: "traffic" },
                  { label: "Spam Score", key: "spamScore" }, { label: "Referring Domains", key: "referringDomains" },
                  { label: "Indexed Pages", key: "indexedPages" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input type="number" value={(form as Record<string, unknown>)[key] as number}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
                <div><Label>Traffic Source</Label><Input value={form.trafficSource} onChange={e => setForm(f => ({ ...f, trafficSource: e.target.value }))} /></div>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Content & Links</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Link Type</Label>
                  <Select value={form.linkType} onValueChange={v => setForm(f => ({ ...f, linkType: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["DOFOLLOW","NOFOLLOW","MIXED"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>TAT</Label><Input value={form.tat} onChange={e => setForm(f => ({ ...f, tat: e.target.value }))} placeholder="5-7 days" /></div>
                <div><Label>Min Word Count</Label><Input type="number" value={form.minWordCount} onChange={e => setForm(f => ({ ...f, minWordCount: Number(e.target.value) }))} /></div>
                <div><Label>External Links Allowed</Label><Input type="number" value={form.externalLinksAllowed} onChange={e => setForm(f => ({ ...f, externalLinksAllowed: Number(e.target.value) }))} /></div>
                <div>
                  <Label>Content Written By</Label>
                  <Select value={form.contentWrittenBy} onValueChange={v => setForm(f => ({ ...f, contentWrittenBy: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["CLIENT","AGENCY","SITE_OWNER"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Accepts AI Content</Label>
                  <Select value={form.acceptsAiContent} onValueChange={v => setForm(f => ({ ...f, acceptsAiContent: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["YES","NO","WITH_DISCLOSURE"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Pricing</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "General Price", key: "generalPrice" }, { label: "Cost Price", key: "costPrice" },
                  { label: "Casino/Gambling", key: "casinoGamblingPrice" }, { label: "Adult", key: "adultPrice" },
                  { label: "Pharmacy", key: "pharmacyPrice" }, { label: "Crypto/Finance", key: "cryptoFinancePrice" },
                  { label: "Dating", key: "datingPrice" }, { label: "Forex/Trading", key: "forexTradingPrice" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input type="number" step="0.01" value={(form as Record<string, unknown>)[key] as number}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v ?? "USD" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["USD","EUR","GBP","INR","AUD","CAD"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Contact</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Contact Name</Label><Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} /></div>
                <div><Label>Contact Email</Label><Input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} /></div>
                <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} /></div>
                <div><Label>Telegram</Label><Input value={form.telegram} onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))} /></div>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Quality & Status</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Site Status</Label>
                  <Select value={form.siteStatus} onValueChange={v => setForm(f => ({ ...f, siteStatus: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["ACTIVE","INACTIVE","ON_HOLD","BLACKLISTED"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Relationship Status</Label>
                  <Select value={form.relationshipStatus} onValueChange={v => setForm(f => ({ ...f, relationshipStatus: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["COLD","NEGOTIATING","ACTIVE","PREFERRED","BLACKLISTED"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Google Penalized</Label>
                  <Select value={form.googlePenalized} onValueChange={v => setForm(f => ({ ...f, googlePenalized: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["YES","NO","UNKNOWN"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Editorial Standards</Label>
                  <Select value={form.editorialStandards} onValueChange={v => setForm(f => ({ ...f, editorialStandards: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["STRICT","MODERATE","FLEXIBLE"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Response Rate</Label>
                  <Select value={form.responseRate} onValueChange={v => setForm(f => ({ ...f, responseRate: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["FAST","MEDIUM","SLOW","UNRESPONSIVE"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Internal Notes</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20"
                    value={form.internalNotes}
                    onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))}
                    placeholder="Internal notes (not visible to clients)"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1" style={{ backgroundColor: "#6366F1" }}>
                {saving ? "Saving..." : editingSite ? "Update Site" : "Create Site"}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Site</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.domain}</strong>? This cannot be undone.
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
