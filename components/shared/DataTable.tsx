"use client"

import { useState, ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronUp, ChevronDown, ChevronsUpDown, Columns3 } from "lucide-react"

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  sortable?: boolean
  hideable?: boolean
  defaultHidden?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  pageSize?: number
  emptyState?: ReactNode
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
}

type SortDirection = "asc" | "desc" | null

export function DataTable<T>({
  columns,
  data,
  isLoading,
  pageSize = 25,
  emptyState,
  rowKey,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)
  const [page, setPage] = useState(1)
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(
    new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key))
  )

  const visibleColumns = columns.filter((c) => !hiddenCols.has(c.key))
  const hideableColumns = columns.filter((c) => c.hideable !== false)

  function toggleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir("asc")
    } else if (sortDir === "asc") {
      setSortDir("desc")
    } else {
      setSortKey(null)
      setSortDir(null)
    }
    setPage(1)
  }

  function toggleColumn(key: string) {
    setHiddenCols((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const paged = data.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-3">
      {hideableColumns.length > 0 && (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm" className="gap-2">
                <Columns3 className="h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {hideableColumns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={!hiddenCols.has(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                >
                  {col.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                {visibleColumns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={col.sortable ? "cursor-pointer select-none hover:bg-muted/60" : ""}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        <span className="text-muted-foreground">
                          {sortKey === col.key ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {visibleColumns.map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="py-0">
                    {emptyState ?? (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        No results found.
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((row, i) => (
                  <TableRow
                    key={rowKey(row)}
                    className={`${i % 2 === 1 ? "bg-muted/20" : ""} ${onRowClick ? "cursor-pointer hover:bg-muted/40" : "hover:bg-muted/30"}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {visibleColumns.map((col) => (
                      <TableCell key={col.key}>{col.cell(row)}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.length)} of{" "}
            {data.length}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
