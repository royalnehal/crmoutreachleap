"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  // Order statuses
  NEW: { label: "New", className: "bg-slate-100 text-slate-700 border-slate-200" },
  CONTENT_WRITING: { label: "Content Writing", className: "bg-amber-100 text-amber-700 border-amber-200" },
  SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-700 border-blue-200" },
  LIVE: { label: "Live", className: "bg-green-100 text-green-700 border-green-200" },
  DELIVERED: { label: "Delivered", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  REVISION: { label: "Revision", className: "bg-orange-100 text-orange-700 border-orange-200" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200" },

  // Link statuses
  BROKEN: { label: "Broken", className: "bg-red-100 text-red-700 border-red-200" },
  REDIRECT: { label: "Redirect", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  DEINDEXED: { label: "Deindexed", className: "bg-gray-100 text-gray-600 border-gray-200" },
  UNKNOWN: { label: "Unknown", className: "bg-slate-100 text-slate-500 border-slate-200" },

  // Site statuses
  ACTIVE: { label: "Active", className: "bg-green-100 text-green-700 border-green-200" },
  INACTIVE: { label: "Inactive", className: "bg-gray-100 text-gray-600 border-gray-200" },
  ON_HOLD: { label: "On Hold", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  BLACKLISTED: { label: "Blacklisted", className: "bg-red-100 text-red-700 border-red-200" },

  // Proposal statuses
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-200" },
  SENT: { label: "Sent", className: "bg-blue-100 text-blue-700 border-blue-200" },
  APPROVED: { label: "Approved", className: "bg-green-100 text-green-700 border-green-200" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200" },
  CONVERTED: { label: "Converted", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },

  // Client tiers
  ONE_TIME: { label: "One Time", className: "bg-gray-100 text-gray-600 border-gray-200" },
  REGULAR: { label: "Regular", className: "bg-blue-100 text-blue-700 border-blue-200" },
  WHITE_LABEL: { label: "White Label", className: "bg-purple-100 text-purple-700 border-purple-200" },
  AGENCY: { label: "Agency", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },

  // Team roles
  ADMIN: { label: "Admin", className: "bg-red-100 text-red-700 border-red-200" },
  MANAGER: { label: "Manager", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  WRITER: { label: "Writer", className: "bg-green-100 text-green-700 border-green-200" },
  SEO: { label: "SEO", className: "bg-blue-100 text-blue-700 border-blue-200" },
  VIEWER: { label: "Viewer", className: "bg-gray-100 text-gray-600 border-gray-200" },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600 border-gray-200",
  }

  return (
    <Badge
      variant="outline"
      className={cn("font-medium text-xs", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
