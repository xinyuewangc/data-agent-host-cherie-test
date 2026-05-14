"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DownloadIcon, SearchIcon } from "lucide-react"

import { useWorkspace } from "@/components/workspace-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePaginationFooter } from "@/components/table-pagination-footer"
import { cn } from "@/lib/utils"
import {
  categoryDefinitions,
  officialAssets,
  type CategoryId,
  type OfficialAssetRecord,
} from "@/lib/official-assets"
import { getPendingSessionPromptKey } from "@/lib/pending-session-prompt"

const defaultRecentSearches = [
  "预算执行总表",
  "供应商主数据台账",
  "接",
  "验收",
  "财务-PTP-订单行明细表",
  "付款申请单明细",
  "应用层-财务-PTP-采购接收单明细",
  "结算单执行明细",
]

function exportCsv(filename: string, columns: string[], rows: string[][]) {
  const escapeField = (value: string) => {
    if (
      value.includes(",") ||
      value.includes('"') ||
      value.includes("\n") ||
      value.includes("\r")
    ) {
      return `"${value.replace(/"/g, '""')}"`
    }

    return value
  }

  const header = columns.map(escapeField).join(",")
  const body = rows.map((row) => row.map((cell) => escapeField(cell)).join(","))
  const csv = `\uFEFF${[header, ...body].join("\n")}`
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = `${filename}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function OfficialAssetsPage() {
  const router = useRouter()
  const { createTemporarySession, isHydrated } = useWorkspace()
  const [draftQuery, setDraftQuery] = useState("")
  const [query, setQuery] = useState("")
  const [recentSearches, setRecentSearches] = useState(defaultRecentSearches)
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const normalizedQuery = query.trim().toLowerCase()

  const commitSearch = (nextQuery: string) => {
    const trimmedQuery = nextQuery.trim()

    setQuery(trimmedQuery)
    setDraftQuery(trimmedQuery)
    setCurrentPage(1)

    if (!trimmedQuery) {
      return
    }

    setRecentSearches((current) => {
      const deduped = current.filter((item) => item !== trimmedQuery)
      return [trimmedQuery, ...deduped].slice(0, 8)
    })
  }

  const resetSearch = () => {
    setDraftQuery("")
    setQuery("")
    setCurrentPage(1)
  }

  const filteredAssets = useMemo(() => {
    return officialAssets.filter((asset) => {
      const matchesCategory =
        activeCategory === "all" || asset.categoryId === activeCategory
      const matchesQuery =
        !normalizedQuery ||
        [asset.name, asset.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [activeCategory, normalizedQuery])
  const safeAssetPage = Math.min(
    currentPage,
    Math.max(Math.ceil(filteredAssets.length / pageSize), 1)
  )
  const paginatedAssets = useMemo(() => {
    const start = (safeAssetPage - 1) * pageSize
    return filteredAssets.slice(start, start + pageSize)
  }, [filteredAssets, safeAssetPage])

  const startAssetDetailSession = (asset: OfficialAssetRecord) => {
    if (!isHydrated) {
      return
    }

    const prompt = `查询 ${asset.name} 的明细数据`
    const session = createTemporarySession({ prompt })

    window.sessionStorage.setItem(
      getPendingSessionPromptKey(session.id),
      prompt
    )
    router.push(`/sessions/${session.routeSegment}`)
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid min-h-full w-full max-w-7xl grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-r border-border px-5 py-6">
            <div className="space-y-4">
              <div className="px-2 text-sm font-medium text-muted-foreground">
                资产分类
              </div>
              <div className="space-y-1">
                {categoryDefinitions.map((category) => {
                  const assetsInCategory =
                    category.id === "all"
                      ? officialAssets
                      : officialAssets.filter(
                          (asset) => asset.categoryId === category.id
                        )

                  const isActive = activeCategory === category.id

                  return (
                    <div key={category.id} className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveCategory(category.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                          isActive
                            ? "bg-muted text-foreground"
                            : "text-foreground hover:bg-muted/70"
                        )}
                      >
                        <span className="font-medium">{category.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {assetsInCategory.length}
                        </span>
                      </button>

                      {isActive && category.id !== "all" ? (
                        <div className="space-y-1 border-l border-border pl-4">
                          {assetsInCategory.map((asset) => (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() =>
                                router.push(`/assets/official/${asset.id}`)
                              }
                              className="block w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              {asset.name}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>

          <main className="min-w-0 px-6 py-6">
            <div className="space-y-4">
              <div className="space-y-3 rounded-xl border border-border bg-background px-4 py-4 shadow-sm">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="relative min-w-0 flex-1">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={draftQuery}
                      onChange={(event) => setDraftQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          commitSearch(draftQuery)
                        }
                      }}
                      placeholder="搜索数据资产名称或说明"
                      className="h-10 w-full pl-9"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetSearch}
                    >
                      重置
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => commitSearch(draftQuery)}
                    >
                      搜索
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-start">
                  <div className="shrink-0 pt-1">最近搜索：</div>
                  <div className="flex min-w-0 flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => commitSearch(item)}
                        className="max-w-full rounded-md bg-muted px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted/80"
                        title={item}
                      >
                        <span className="block max-w-[220px] truncate">
                          {item}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>数据资产</TableHead>
                      <TableHead className="w-[140px] text-right">
                        操作
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.length ? (
                      paginatedAssets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{asset.name}</div>
                              <p className="text-xs leading-5 text-muted-foreground">
                                {asset.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => startAssetDetailSession(asset)}
                                disabled={!isHydrated}
                              >
                                查看明细
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={2} className="py-12 text-center">
                          <div className="space-y-2">
                            <p className="font-medium">没有匹配的数据资产</p>
                            <p className="text-sm text-muted-foreground">
                              可以切换分类或更换关键词继续搜索。
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <TablePaginationFooter
                  currentPage={safeAssetPage}
                  onPageChange={setCurrentPage}
                  pageSize={pageSize}
                  totalItems={filteredAssets.length}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  )
}

export function OfficialAssetDetailPage({
  asset,
}: {
  asset: OfficialAssetRecord
}) {
  const [query, setQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return asset.draftRows
    }

    return asset.draftRows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(normalizedQuery))
    )
  }, [asset.draftRows, query])
  const safeDetailPage = Math.min(
    currentPage,
    Math.max(Math.ceil(filteredRows.length / pageSize), 1)
  )
  const paginatedRows = useMemo(() => {
    const start = (safeDetailPage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, safeDetailPage])

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-4 px-6 py-6">
          <div className="rounded-xl border border-border bg-background px-4 py-4 shadow-sm">
            <div className="space-y-3">
              <div className="text-sm font-medium">请添加筛选项</div>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索底稿中的字段值"
                className="max-w-sm"
              />
            </div>
          </div>

          <div className="min-h-0 rounded-xl border border-border bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="text-sm font-medium">数据详情</div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    exportCsv(asset.name, asset.draftColumns, filteredRows)
                  }
                >
                  <DownloadIcon className="size-4" />
                  导出
                </Button>
              </div>
            </div>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {asset.draftColumns.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.length ? (
                    paginatedRows.map((row, rowIndex) => (
                      <TableRow key={`${asset.id}-${rowIndex}`}>
                        {row.map((cell, cellIndex) => (
                          <TableCell
                            key={`${asset.id}-${rowIndex}-${cellIndex}`}
                            className={cn(
                              cellIndex === 0
                                ? "font-medium"
                                : "text-muted-foreground"
                            )}
                          >
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={asset.draftColumns.length}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        当前筛选条件下暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <TablePaginationFooter
              currentPage={safeDetailPage}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              totalItems={filteredRows.length}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
