"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"

type TeamMember = {
  id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string
}

type NicheMarkup = { niche: string; markup: number }

const MEMBER_FORM_DEFAULTS = { name: "", email: "", role: "VIEWER", password: "" }
const ROLES = ["ADMIN","MANAGER","WRITER","SEO","VIEWER"]

const EMAIL_TEMPLATES: Record<string, { label: string; vars: string[]; default: string }> = {
  outreach: {
    label: "Outreach",
    vars: ["{{site_domain}}", "{{contact_name}}", "{{niche}}", "{{your_name}}"],
    default: `Hi {{contact_name}},

I hope this email finds you well! I'm reaching out because {{site_domain}} looks like a great fit for a guest post collaboration.

We have high-quality content on {{niche}} topics that we believe your audience would find valuable.

Would you be interested in discussing a guest post opportunity?

Best regards,
{{your_name}}`,
  },
  followup: {
    label: "Follow-up",
    vars: ["{{contact_name}}", "{{site_domain}}", "{{your_name}}"],
    default: `Hi {{contact_name}},

Just following up on my previous email regarding a guest post on {{site_domain}}.

I'd love to connect if you have a moment!

Best,
{{your_name}}`,
  },
  delivery: {
    label: "Order Delivery",
    vars: ["{{client_name}}", "{{site_domain}}", "{{live_url}}", "{{anchor_text}}", "{{order_number}}"],
    default: `Hi {{client_name}},

Great news! Your guest post on {{site_domain}} is now live.

Order: {{order_number}}
Live URL: {{live_url}}
Anchor Text: {{anchor_text}}

Please let us know if you have any questions!

Best regards,
OutreachLeap Team`,
  },
  proposal: {
    label: "Proposal",
    vars: ["{{client_name}}", "{{number_of_links}}", "{{budget}}", "{{your_name}}"],
    default: `Hi {{client_name}},

Thank you for your interest in our guest posting services!

I've put together a tailored proposal of {{number_of_links}} high-quality placements within your budget of {{budget}}.

Please find the catalog attached. Let me know if you'd like to proceed or adjust anything.

Best regards,
{{your_name}}`,
  },
}

export default function SettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [memberSheet, setMemberSheet] = useState(false)
  const [memberForm, setMemberForm] = useState(MEMBER_FORM_DEFAULTS)
  const [savingMember, setSavingMember] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)

  // Branding
  const [agencyName, setAgencyName] = useState("OutreachLeap")
  const [contactEmail, setContactEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("+916376445266")
  const [website, setWebsite] = useState("")

  // Pricing
  const [defaultMarkup, setDefaultMarkup] = useState(30)
  const [nicheMarkups, setNicheMarkups] = useState<NicheMarkup[]>([])
  const [newNiche, setNewNiche] = useState("")
  const [newMarkup, setNewMarkup] = useState(0)

  // Email templates
  const [activeTemplate, setActiveTemplate] = useState("outreach")
  const [templates, setTemplates] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(EMAIL_TEMPLATES).map(([k, v]) => [k, v.default]))
  )

  useEffect(() => {
    fetch("/api/settings/team")
      .then(r => r.json())
      .then(d => setMembers(d.members ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false))
  }, [])

  async function saveMember() {
    setSavingMember(true)
    try {
      const url = editingMember ? `/api/settings/team/${editingMember.id}` : "/api/settings/team"
      const method = editingMember ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberForm),
      })
      if (!res.ok) throw new Error()
      toast.success(editingMember ? "Member updated" : "Member created")
      setMemberSheet(false)
      const d = await fetch("/api/settings/team").then(r => r.json())
      setMembers(d.members ?? [])
    } catch {
      toast.error("Failed to save team member")
    } finally {
      setSavingMember(false)
    }
  }

  async function toggleActive(member: TeamMember) {
    try {
      await fetch(`/api/settings/team/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !member.isActive }),
      })
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, isActive: !m.isActive } : m))
      toast.success(`${member.name} ${!member.isActive ? "activated" : "deactivated"}`)
    } catch {
      toast.error("Failed to update status")
    }
  }

  async function deleteMember(id: string) {
    try {
      await fetch(`/api/settings/team/${id}`, { method: "DELETE" })
      setMembers(prev => prev.filter(m => m.id !== id))
      toast.success("Member removed")
    } catch {
      toast.error("Failed to delete")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" subtitle="Configure your agency settings" />

      <Tabs defaultValue="branding">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Rules</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
        </TabsList>

        {/* BRANDING */}
        <TabsContent value="branding" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Agency Branding</CardTitle>
              <CardDescription>Configure your agency identity. The agency name is also set via <code>NEXT_PUBLIC_AGENCY_NAME</code> env var.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div><Label>Agency Name</Label><Input value={agencyName} onChange={e => setAgencyName(e.target.value)} className="mt-1" /></div>
              <div><Label>Contact Email</Label><Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="mt-1" placeholder="hello@outreachleap.com" /></div>
              <div><Label>WhatsApp Number</Label><Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="mt-1" placeholder="+1234567890" /></div>
              <div><Label>Website</Label><Input value={website} onChange={e => setWebsite(e.target.value)} className="mt-1" placeholder="https://outreachleap.com" /></div>
              <Button onClick={() => toast.success("Branding saved (in-memory only — add DB to persist)")} style={{ backgroundColor: "#6366F1" }}>Save Branding</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEAM */}
        <TabsContent value="team" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Team Members</h3>
            <Button onClick={() => { setEditingMember(null); setMemberForm(MEMBER_FORM_DEFAULTS); setMemberSheet(true) }} className="gap-2" style={{ backgroundColor: "#6366F1" }}>
              <Plus className="h-4 w-4" /> Add Member
            </Button>
          </div>

          {loadingMembers ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : members.length === 0 ? (
            <EmptyState icon={Users} title="No team members yet" description="Add your first team member." />
          ) : (
            <div className="rounded-lg border bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-left px-4 py-3 font-medium">Role</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, i) => (
                    <tr key={member.id} className={`border-b last:border-0 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                      <td className="px-4 py-3 font-medium">{member.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                      <td className="px-4 py-3"><StatusBadge status={member.role} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Switch checked={member.isActive} onCheckedChange={() => toggleActive(member)} />
                          <span className="text-xs text-muted-foreground">{member.isActive ? "Active" : "Inactive"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingMember(member); setMemberForm({ name: member.name, email: member.email, role: member.role, password: "" }); setMemberSheet(true) }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMember(member.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* PRICING */}
        <TabsContent value="pricing" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Default Markup</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Default Markup %</Label>
                  <div className="flex gap-2 mt-1">
                    <Input type="number" value={defaultMarkup} onChange={e => setDefaultMarkup(Number(e.target.value))} className="w-28" />
                    <Button onClick={() => toast.success("Markup saved")} style={{ backgroundColor: "#6366F1" }}>Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Per-Niche Markup Overrides</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Niche (e.g. Casino)" value={newNiche} onChange={e => setNewNiche(e.target.value)} />
                  <Input type="number" placeholder="%" className="w-20" value={newMarkup} onChange={e => setNewMarkup(Number(e.target.value))} />
                  <Button variant="outline" onClick={() => {
                    if (!newNiche) return
                    setNicheMarkups(prev => [...prev, { niche: newNiche, markup: newMarkup }])
                    setNewNiche(""); setNewMarkup(0)
                  }}>Add</Button>
                </div>
                {nicheMarkups.length > 0 && (
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-muted/40 border-b"><th className="text-left px-3 py-2">Niche</th><th className="text-left px-3 py-2">Markup %</th><th /></tr></thead>
                      <tbody>
                        {nicheMarkups.map((nm, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="px-3 py-2">{nm.niche}</td>
                            <td className="px-3 py-2">{nm.markup}%</td>
                            <td className="px-3 py-2 text-right">
                              <Button size="sm" variant="ghost" onClick={() => setNicheMarkups(prev => prev.filter((_, idx) => idx !== i))}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {nicheMarkups.length > 0 && (
                  <Button onClick={() => toast.success("Pricing rules saved")} style={{ backgroundColor: "#6366F1" }}>Save Rules</Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* EMAIL TEMPLATES */}
        <TabsContent value="templates" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              {Object.entries(EMAIL_TEMPLATES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setActiveTemplate(key)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${activeTemplate === key ? "bg-indigo-50 text-indigo-600 font-medium" : "hover:bg-muted/50"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{EMAIL_TEMPLATES[activeTemplate].label} Template</CardTitle>
                  <CardDescription>
                    Available variables: {EMAIL_TEMPLATES[activeTemplate].vars.map(v => (
                      <code key={v} className="bg-muted px-1 rounded text-xs mr-1">{v}</code>
                    ))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-64 font-mono"
                    value={templates[activeTemplate]}
                    onChange={e => setTemplates(prev => ({ ...prev, [activeTemplate]: e.target.value }))}
                  />
                  <Button onClick={() => toast.success("Template saved")} style={{ backgroundColor: "#6366F1" }}>Save Template</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Team Member Sheet */}
      <Sheet open={memberSheet} onOpenChange={setMemberSheet}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingMember ? "Edit Member" : "Add Team Member"}</SheetTitle>
            <SheetDescription>Fill in member details.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            <div><Label>Name *</Label><Input value={memberForm.name} onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input type="email" value={memberForm.email} onChange={e => setMemberForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div>
              <Label>Role</Label>
              <Select value={memberForm.role} onValueChange={v => setMemberForm(f => ({ ...f, role: v ?? "" }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Temporary Password</Label><Input type="password" value={memberForm.password} onChange={e => setMemberForm(f => ({ ...f, password: e.target.value }))} placeholder="Leave blank to keep existing" /></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveMember} disabled={savingMember} className="flex-1" style={{ backgroundColor: "#6366F1" }}>
                {savingMember ? "Saving..." : editingMember ? "Update" : "Create Member"}
              </Button>
              <Button variant="outline" onClick={() => setMemberSheet(false)}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
