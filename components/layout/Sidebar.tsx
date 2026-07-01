"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Globe,
  ShoppingCart,
  Users,
  Link2,
  FileText,
  BookOpen,
  BarChart3,
  Mail,
  Settings,
  Menu,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Sites", href: "/sites", icon: Globe },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Links", href: "/links", icon: Link2 },
  { label: "Proposals", href: "/proposals", icon: FileText },
  { label: "Catalog", href: "/catalog", icon: BookOpen },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Import", href: "/import", icon: Mail },
  { label: "Settings", href: "/settings", icon: Settings },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-indigo-100/80 transition-colors hover:bg-white/10 hover:text-white",
              isActive && "bg-[#6366F1] text-white hover:bg-[#6366F1]"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col py-6 lg:flex"
        style={{ backgroundColor: "#1E1B4B" }}
      >
        <div className="mb-6 px-6">
          <span className="text-lg font-semibold text-white">OutreachOS</span>
        </div>
        <NavLinks />
      </aside>

      {/* Mobile sidebar */}
      <div className="fixed left-0 top-0 z-30 flex h-14 w-full items-center justify-between px-4 lg:hidden">
        <Sheet>
          <SheetTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-60 border-none p-0"
            style={{ backgroundColor: "#1E1B4B" }}
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="py-6">
              <div className="mb-6 px-6">
                <span className="text-lg font-semibold text-white">
                  OutreachOS
                </span>
              </div>
              <NavLinks />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
