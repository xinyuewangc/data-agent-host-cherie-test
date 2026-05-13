"use client"

import { usePathname, useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import {
  WorkspaceProvider,
  useWorkspace,
} from "@/components/workspace-provider"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePaginationFooter } from "@/components/table-pagination-footer"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { appRoutes, getRouteByPath } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import type { WorkspaceSession } from "@/lib/workspace-mock"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DownloadIcon,
  EllipsisIcon,
  FileTextIcon,
  MinusIcon,
  MoreHorizontalIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  SearchIcon,
  SquareDashedMousePointerIcon,
  Share2Icon,
  XIcon,
} from "lucide-react"

const FLOW_MIN_ZOOM = 0.55
const FLOW_MAX_ZOOM = 2

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <AppShellContent>{children}</AppShellContent>
    </WorkspaceProvider>
  )
}

function AppShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const workspace = useWorkspace()
  const route = workspace.getRouteByPath(pathname) ?? getRouteByPath(pathname)
  const currentSession = getSessionFromPath(pathname, workspace)
  const shouldHideBreadcrumb = pathname === appRoutes.newSession.path
  const [artifactSessionId, setArtifactSessionId] = useState<string | null>(
    null
  )
  const isArtifactOpen = currentSession?.id === artifactSessionId

  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <AppSidebar />
      <SidebarInset className="min-h-0 overflow-hidden border border-border">
        <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            {currentSession ? (
              <SessionHeaderTitle session={currentSession} />
            ) : shouldHideBreadcrumb ? null : (
              <Breadcrumb>
                <BreadcrumbList>
                  {route.breadcrumbs.map((item, index) => {
                    const isLast = index === route.breadcrumbs.length - 1

                    return (
                      <Fragment key={`${item}-${index}`}>
                        {index > 0 ? (
                          <BreadcrumbSeparator className="hidden md:block" />
                        ) : null}
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{item}</BreadcrumbPage>
                          ) : (
                            <span>{item}</span>
                          )}
                        </BreadcrumbItem>
                      </Fragment>
                    )
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
          {currentSession ? (
            <SessionHeaderActions
              isArtifactOpen={isArtifactOpen}
              session={currentSession}
              onArtifactOpenChange={(isOpen) =>
                setArtifactSessionId(isOpen ? currentSession.id : null)
              }
            />
          ) : null}
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {currentSession ? (
            <div
              className={
                isArtifactOpen
                  ? "grid min-h-0 flex-1 grid-cols-[minmax(0,3fr)_minmax(0,7fr)] transition-[grid-template-columns] duration-300 ease-out"
                  : "grid min-h-0 flex-1 grid-cols-[minmax(0,10fr)_minmax(0,0fr)] transition-[grid-template-columns] duration-300 ease-out"
              }
            >
              <div className="flex min-h-0 min-w-0 flex-col overflow-hidden p-4">
                {children}
              </div>
              <div className="min-h-0 min-w-0 overflow-hidden">
                <SessionArtifactPanel
                  isOpen={isArtifactOpen}
                  session={currentSession}
                />
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function SessionHeaderActions({
  isArtifactOpen,
  onArtifactOpenChange,
  session,
}: {
  isArtifactOpen: boolean
  onArtifactOpenChange: (isOpen: boolean) => void
  session: WorkspaceSession
}) {
  const router = useRouter()
  const { getProject, saveTemporarySession, setProjectMcpSharing } =
    useWorkspace()
  const project = session.projectId ? getProject(session.projectId) : undefined
  const isMcpShared = Boolean(project?.isMcpShared)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const shareDialogTitle = isMcpShared ? "取消MCP分享" : "通过MCP分享"
  const shareDialogDescription = isMcpShared
    ? "是否取消分享？"
    : "将当前Artifacts以MCP形式分享。"
  const shareButtonLabel = isMcpShared ? "取消MCP分享" : "通过MCP分享"

  function handleSaveTemporarySession() {
    const savedSession = saveTemporarySession(session.id)

    if (savedSession?.projectId) {
      router.push(
        `/assets/my/${savedSession.projectId}/${savedSession.routeSegment}`
      )
    }
  }

  function handleConfirmMcpSharing() {
    if (!project) {
      return
    }

    setProjectMcpSharing(project.id, !isMcpShared)
    setIsShareDialogOpen(false)
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {session.isTemporary ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="保存为数据资产"
                onClick={handleSaveTemporarySession}
              />
            }
          >
            <SaveIcon />
          </TooltipTrigger>
          <TooltipContent>保存为数据资产</TooltipContent>
        </Tooltip>
      ) : null}

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={shareButtonLabel}
                disabled={!project}
                onClick={() => setIsShareDialogOpen(true)}
              />
            }
          >
            <Share2Icon />
          </TooltipTrigger>
          <TooltipContent>{shareButtonLabel}</TooltipContent>
        </Tooltip>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{shareDialogTitle}</DialogTitle>
            <DialogDescription>{shareDialogDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              取消
            </DialogClose>
            <Button type="button" onClick={handleConfirmMcpSharing}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={
                isArtifactOpen ? "关闭 Artifacts 面板" : "打开 Artifacts 面板"
              }
              aria-pressed={isArtifactOpen}
              onClick={() => onArtifactOpenChange(!isArtifactOpen)}
            />
          }
        >
          {isArtifactOpen ? <PanelRightCloseIcon /> : <PanelRightOpenIcon />}
        </TooltipTrigger>
        <TooltipContent>
          {isArtifactOpen ? "关闭 Artifacts 面板" : "打开 Artifacts 面板"}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function SessionArtifactPanel({
  isOpen,
  session,
}: {
  isOpen: boolean
  session: WorkspaceSession
}) {
  const [isPickingArtifactContext, setIsPickingArtifactContext] =
    useState(false)
  const [activeTab, setActiveTab] = useState<ArtifactTabId>("table")
  const [activeProcessTab, setActiveProcessTab] =
    useState<ArtifactProcessTabId>("flow")
  const artifact = getArtifactContent(session)
  const tableFilterFields = artifact.table.filterFields
  const hasTableFilters = tableFilterFields.length > 0
  const [draftTableFilters, setDraftTableFilters] = useState<
    Record<string, string>
  >({})
  const [activeTableFilters, setActiveTableFilters] = useState<
    Record<string, string>
  >({})
  const [currentTablePage, setCurrentTablePage] = useState(1)
  const [expandedTableFilters, setExpandedTableFilters] = useState<
    Record<string, boolean>
  >({})
  const tablePageSize = 10
  const [flowZoom, setFlowZoom] = useState(1)
  const flowViewportRef = useRef<HTMLDivElement | null>(null)
  const [flowViewportWidth, setFlowViewportWidth] = useState(0)
  const [flowViewportHeight, setFlowViewportHeight] = useState(0)
  const [selectedFlowNodeId, setSelectedFlowNodeId] = useState<string | null>(
    null
  )
  const filteredTableRows = useMemo(
    () =>
      filterArtifactTableRows(
        artifact.table.rows,
        activeTableFilters,
        tableFilterFields
      ),
    [artifact.table.rows, activeTableFilters, tableFilterFields]
  )
  const paginatedTableRows = useMemo(() => {
    const pageCount = Math.max(
      Math.ceil(filteredTableRows.length / tablePageSize),
      1
    )
    const safePage = Math.min(currentTablePage, pageCount)
    const start = (safePage - 1) * tablePageSize

    return filteredTableRows.slice(start, start + tablePageSize)
  }, [currentTablePage, filteredTableRows])
  const safeTablePage = Math.min(
    currentTablePage,
    Math.max(Math.ceil(filteredTableRows.length / tablePageSize), 1)
  )
  const filterPreviewCount = 4
  const hasExpandableFilters = tableFilterFields.length > filterPreviewCount
  const isTableFilterExpanded = expandedTableFilters[artifact.title] ?? false
  const visibleTableFilterFields =
    hasExpandableFilters && !isTableFilterExpanded
      ? tableFilterFields.slice(0, filterPreviewCount)
      : tableFilterFields
  const flowBoard = useMemo(
    () => createFlowBoardLayout(artifact.process.graph, flowViewportWidth),
    [artifact.process.graph, flowViewportWidth]
  )
  const activeFlowNodeId =
    selectedFlowNodeId &&
    flowBoard.nodes.some((node) => node.id === selectedFlowNodeId)
      ? selectedFlowNodeId
      : null
  const selectedFlowNode = useMemo(
    () =>
      flowBoard.nodes.find((node) => node.id === activeFlowNodeId) ??
      null,
    [activeFlowNodeId, flowBoard.nodes]
  )
  const selectedFlowNodeSummary = useMemo(
    () =>
      selectedFlowNode
        ? createSelectedFlowNodeSummary(selectedFlowNode, artifact.process.graph)
        : null,
    [selectedFlowNode, artifact.process.graph]
  )
  const visualSeries = useMemo(
    () =>
      buildArtifactVisualSeries(
        filteredTableRows,
        artifact.visual,
        artifact.table.columns
      ),
    [filteredTableRows, artifact.visual, artifact.table.columns]
  )
  const visualDistribution = useMemo(
    () =>
      buildArtifactVisualDistribution(
        filteredTableRows,
        artifact.visual,
        artifact.table.columns
      ),
    [filteredTableRows, artifact.visual, artifact.table.columns]
  )

  useEffect(() => {
    const element = flowViewportRef.current

    if (!element) {
      return
    }

    function updateViewportSize(nextWidth: number, nextHeight: number) {
      setFlowViewportWidth(Math.max(Math.floor(nextWidth) - 24, 0))
      setFlowViewportHeight(Math.max(Math.floor(nextHeight) - 24, 0))
    }

    const initialRect = element.getBoundingClientRect()
    updateViewportSize(initialRect.width, initialRect.height)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]

      if (entry) {
        updateViewportSize(entry.contentRect.width, entry.contentRect.height)
      }
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  function handleTableFilterChange(fieldId: string, value: string) {
    setDraftTableFilters((current) => ({
      ...current,
      [fieldId]: value,
    }))
  }

  function handleApplyFilters() {
    setActiveTableFilters(
      Object.fromEntries(
        Object.entries(draftTableFilters).filter(([, value]) => value.trim())
      )
    )
  }

  function handleResetFilters() {
    setDraftTableFilters({})
    setActiveTableFilters({})
  }

  function handleExportRows() {
    exportArtifactRows(
      `${artifact.title}-${new Date().toISOString().slice(0, 10)}`,
      artifact.table.columns,
      filteredTableRows
    )
  }

  function updateFlowZoom(nextZoom: number) {
    const viewport = flowViewportRef.current
    const currentZoom = flowZoom
    const safeNextZoom = clampNumber(
      Number(nextZoom.toFixed(3)),
      FLOW_MIN_ZOOM,
      FLOW_MAX_ZOOM
    )

    if (!viewport || safeNextZoom === currentZoom) {
      setFlowZoom(safeNextZoom)
      return
    }

    const currentBoardWidth = flowBoard.width * currentZoom
    const currentBoardHeight = flowBoard.height * currentZoom
    const nextBoardWidth = flowBoard.width * safeNextZoom
    const nextBoardHeight = flowBoard.height * safeNextZoom
    const currentInsetX = Math.max(
      (viewport.clientWidth - currentBoardWidth) / 2,
      0
    )
    const currentInsetY = Math.max(
      (viewport.clientHeight - currentBoardHeight) / 2,
      0
    )
    const nextInsetX = Math.max((viewport.clientWidth - nextBoardWidth) / 2, 0)
    const nextInsetY = Math.max((viewport.clientHeight - nextBoardHeight) / 2, 0)
    const offsetX = viewport.clientWidth / 2
    const offsetY = viewport.clientHeight / 2
    const worldX =
      (viewport.scrollLeft + offsetX - currentInsetX) / currentZoom
    const worldY =
      (viewport.scrollTop + offsetY - currentInsetY) / currentZoom

    setFlowZoom(safeNextZoom)

    window.requestAnimationFrame(() => {
      const nextScrollLeft = worldX * safeNextZoom + nextInsetX - offsetX
      const nextScrollTop = worldY * safeNextZoom + nextInsetY - offsetY
      const maxScrollLeft = Math.max(
        viewport.scrollWidth - viewport.clientWidth,
        0
      )
      const maxScrollTop = Math.max(
        viewport.scrollHeight - viewport.clientHeight,
        0
      )

      viewport.scrollLeft = clampNumber(nextScrollLeft, 0, maxScrollLeft)
      viewport.scrollTop = clampNumber(nextScrollTop, 0, maxScrollTop)
    })
  }

  function handleFlowZoom(nextZoom: number) {
    updateFlowZoom(nextZoom)
  }

  function handleFlowViewportWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && !event.metaKey) {
      return
    }

    event.preventDefault()

    const delta =
      event.deltaMode === 1 ? event.deltaY * 12 : event.deltaY
    const nextZoom = flowZoom - delta * 0.001

    updateFlowZoom(nextZoom)
  }

  return (
    <aside
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={
        isOpen
          ? "flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l border-border bg-background opacity-100 transition-[opacity,transform] duration-300 ease-out"
          : "pointer-events-none flex h-full min-h-0 min-w-0 translate-x-4 flex-col overflow-hidden border-l border-border bg-background opacity-0 transition-[opacity,transform] duration-300 ease-out"
      }
    >
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2">
          <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
          <h2 className="truncate text-sm font-medium">Artifacts</h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant={isPickingArtifactContext ? "secondary" : "ghost"}
                  size="icon-sm"
                  aria-label="选择 Artifact 元素作为上下文"
                  aria-pressed={isPickingArtifactContext}
                  onClick={() =>
                    setIsPickingArtifactContext((isPicking) => !isPicking)
                  }
                />
              }
            >
              <SquareDashedMousePointerIcon />
            </TooltipTrigger>
            <TooltipContent>
              {isPickingArtifactContext
                ? "退出选择上下文元素"
                : "选择 Artifact 元素作为上下文"}
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Artifacts 操作"
                />
              }
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuGroup>
                <DropdownMenuItem>复制结果摘要</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-5">
        <div className="flex w-full min-w-0 flex-col gap-3">
          <section className="flex min-w-0 items-center py-1">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as ArtifactTabId)}
            >
              <TabsList className="w-fit">
                {artifactTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </section>

          {activeTab === "table" ? (
            <div className="grid gap-3">
              {hasTableFilters ? (
                <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                    {visibleTableFilterFields.map((field) => (
                      <label key={field.id} className="space-y-2">
                        <span className="text-sm font-medium text-foreground/70">
                          {field.label}
                        </span>
                        {field.type === "text" ? (
                          <Input
                            value={draftTableFilters[field.id] ?? ""}
                            onChange={(event) =>
                              handleTableFilterChange(
                                field.id,
                                event.target.value
                              )
                            }
                            placeholder={field.placeholder}
                            className="h-8 rounded-lg px-2.5 text-sm placeholder:text-muted-foreground"
                          />
                        ) : (
                          <Select
                            value={draftTableFilters[field.id] ?? ""}
                            onValueChange={(value) =>
                              handleTableFilterChange(field.id, value ?? "")
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={field.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">{field.placeholder}</SelectItem>
                              {(field.options ?? []).map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {hasExpandableFilters ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 w-fit gap-1.5 px-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
                        onClick={() =>
                          setExpandedTableFilters((current) => ({
                            ...current,
                            [artifact.title]: !isTableFilterExpanded,
                          }))
                        }
                      >
                        {isTableFilterExpanded ? (
                          <ChevronUpIcon className="size-3.5" />
                        ) : (
                          <ChevronDownIcon className="size-3.5" />
                        )}
                        {isTableFilterExpanded
                          ? "收起筛选"
                          : `展开更多筛选 +${tableFilterFields.length - filterPreviewCount}`}
                      </Button>
                    ) : (
                      <div />
                    )}
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 gap-2"
                        onClick={handleResetFilters}
                      >
                        <RotateCcwIcon className="size-4" />
                        重置
                      </Button>
                      <Button
                        type="button"
                        className="h-9 gap-2"
                        onClick={handleApplyFilters}
                      >
                        <SearchIcon className="size-4" />
                        查询
                      </Button>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <h4 className="text-sm font-medium">明细表结果</h4>
                  <div className="flex items-center gap-2 lg:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 gap-2 rounded-lg px-3 text-sm"
                      onClick={handleExportRows}
                    >
                      <DownloadIcon className="size-4" />
                      导出明细表
                    </Button>
                  </div>
                </div>
                <div className="overflow-auto p-2">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        {artifact.table.columns.map((column) => (
                          <TableHead key={column}>{column}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTableRows.length ? (
                        paginatedTableRows.map((row, rowIndex) => (
                          <TableRow key={`${artifact.title}-${rowIndex}`}>
                            {artifact.table.columns.map((column, columnIndex) => (
                              <TableCell
                                key={`${rowIndex}-${column}`}
                                className={cn(
                                  columnIndex === 0 ? "font-medium" : undefined,
                                  column === "风险级别" || column === "状态"
                                    ? "text-foreground"
                                    : undefined
                                )}
                              >
                                {row[column]}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={artifact.table.columns.length}
                            className="h-28 text-center text-sm text-muted-foreground"
                          >
                            当前筛选条件下暂无结果
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <TablePaginationFooter
                  currentPage={safeTablePage}
                  onPageChange={setCurrentTablePage}
                  pageSize={tablePageSize}
                  totalItems={filteredTableRows.length}
                />
              </section>

              <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-sm font-medium">数据处理过程</h4>
                  <div className="rounded-lg border border-border bg-muted/30 p-1">
                    <div className="flex flex-wrap gap-1">
                      {[
                        { id: "flow", label: "数据流转" },
                        { id: "rules", label: "处理规则" },
                        { id: "sql", label: "SQL" },
                      ].map((item) => (
                        <Button
                          key={item.id}
                          type="button"
                          variant="ghost"
                          className={cn(
                            "h-8 rounded-md px-2.5 text-xs",
                            activeProcessTab === item.id
                              ? "bg-background text-foreground shadow-sm hover:bg-background"
                              : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                          )}
                          onClick={() =>
                            setActiveProcessTab(
                              item.id as ArtifactProcessTabId
                            )
                          }
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                {activeProcessTab === "flow" ? (
                  <div
                    className={cn(
                      "mt-4 grid gap-4 transition-[grid-template-columns] duration-300 ease-out",
                      selectedFlowNode
                        ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px]"
                        : "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_0px]"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="relative">
                        <div
                          ref={flowViewportRef}
                          onWheel={handleFlowViewportWheel}
                          className="relative overflow-auto rounded-xl border border-dashed border-border bg-[radial-gradient(circle,_rgba(0,0,0,0.06)_1px,_transparent_1px)] [background-size:16px_16px] p-4"
                        >
                          <div
                            className="relative flex items-center justify-center rounded-[28px]"
                            style={{
                              width: Math.max(
                                flowBoard.width * flowZoom,
                                flowViewportWidth
                              ),
                              height: Math.max(
                                flowBoard.height * flowZoom,
                                flowViewportHeight
                              ),
                            }}
                          >
                            <div
                              className="relative origin-top-left"
                              style={{
                                width: flowBoard.width,
                                height: flowBoard.height,
                                transform: `scale(${flowZoom})`,
                              }}
                            >
                              <svg
                                className="pointer-events-none absolute inset-0 z-10"
                                width={flowBoard.width}
                                height={flowBoard.height}
                                viewBox={`0 0 ${flowBoard.width} ${flowBoard.height}`}
                                fill="none"
                              >
                                {flowBoard.edges.map((edge) => (
                                  <Fragment key={edge.id}>
                                    {edge.paths.map((path) => (
                                      <Fragment key={path.id}>
                                        <path
                                          d={path.d}
                                          stroke={path.stroke}
                                          strokeWidth="2"
                                          strokeOpacity="0.18"
                                          strokeDasharray="6 10"
                                          strokeLinecap="round"
                                        />
                                        <path
                                          d={path.d}
                                          stroke={path.stroke}
                                          strokeWidth="2.4"
                                          strokeDasharray="10 14"
                                          strokeLinecap="round"
                                        >
                                          <animate
                                            attributeName="stroke-dashoffset"
                                            from="24"
                                            to="0"
                                            dur="1.15s"
                                            repeatCount="indefinite"
                                          />
                                        </path>
                                        <circle r="3.5" fill={path.stroke}>
                                          <animateMotion
                                            dur="2.6s"
                                            repeatCount="indefinite"
                                            path={path.d}
                                          />
                                        </circle>
                                      </Fragment>
                                    ))}
                                    <path
                                      d={edge.axisPath}
                                      stroke="rgba(17,24,39,0.18)"
                                      strokeWidth="1.5"
                                      strokeDasharray="2 10"
                                      strokeLinecap="round"
                                    />
                                  </Fragment>
                                ))}
                              </svg>

                              {flowBoard.nodes.map((node) => (
                                <button
                                  key={node.id}
                                  type="button"
                                  className={cn(
                                    "absolute z-30 rounded-2xl border bg-background px-4 py-4 text-left shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-md",
                                    getFlowToneCardClass(node.tone),
                                    selectedFlowNode?.id === node.id &&
                                      "ring-2 ring-foreground/10"
                                  )}
                                  style={{
                                    left: node.x,
                                    top: node.y,
                                    width: node.width,
                                    minHeight: node.height,
                                  }}
                                  onClick={() =>
                                    setSelectedFlowNodeId((current) =>
                                      current === node.id ? null : node.id
                                    )
                                  }
                                >
                                  <span className="absolute -left-1.5 top-8 size-3 rounded-full border border-background bg-background shadow-sm" />
                                  <span className="absolute -right-1.5 top-8 size-3 rounded-full border border-background bg-background shadow-sm" />
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={cn(
                                            "size-2.5 rounded-full",
                                            getFlowToneDotClass(node.tone)
                                          )}
                                        />
                                        <div className="text-sm font-medium">
                                          {node.title}
                                        </div>
                                      </div>
                                      <div className="text-xs leading-5 text-muted-foreground">
                                        {node.subtitle}
                                      </div>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="shrink-0 bg-background/90"
                                    >
                                      {getFlowToneLabel(node.tone)}
                                    </Badge>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pointer-events-none absolute inset-0 z-40">
                          <div className="absolute top-4 right-4">
                            <div className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
                              {(
                                [
                                  ["source", "数据来源"],
                                  ["process", "处理节点"],
                                  ["aggregate", "合并处理"],
                                  ["result", "最终结果"],
                                ] as const
                              ).map(([tone, label]) => (
                                <div
                                  key={tone}
                                  className="flex items-center gap-2 text-xs text-muted-foreground"
                                >
                                  <span
                                    className={cn(
                                      "size-2.5 rounded-full",
                                      getFlowToneDotClass(tone)
                                    )}
                                  />
                                  <span>{label}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="absolute right-4 bottom-4">
                            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-background/95 px-1 py-1 shadow-sm">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="size-7"
                                aria-label="缩小画布"
                                onClick={() => handleFlowZoom(flowZoom - 0.1)}
                              >
                                <MinusIcon className="size-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-7 min-w-12 px-2 text-[11px]"
                                onClick={() => handleFlowZoom(1)}
                              >
                                {Math.round(flowZoom * 100)}%
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="size-7"
                                aria-label="放大画布"
                                onClick={() => handleFlowZoom(flowZoom + 0.1)}
                              >
                                <PlusIcon className="size-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <aside
                      aria-hidden={!selectedFlowNode || !selectedFlowNodeSummary}
                      className={cn(
                        "min-w-0 overflow-hidden transition-[opacity,transform,padding,border-color,background-color,box-shadow] duration-200 ease-out",
                        selectedFlowNode && selectedFlowNodeSummary
                          ? "translate-x-0 rounded-xl border border-border bg-muted/20 p-4 opacity-100 shadow-sm"
                          : "pointer-events-none translate-x-3 border border-transparent bg-transparent p-0 opacity-0 shadow-none"
                      )}
                    >
                      {selectedFlowNode && selectedFlowNodeSummary ? (
                        <div className="animate-in fade-in-0 slide-in-from-right-2 duration-200">
                          <div className="space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <h5 className="text-sm font-medium">
                              {selectedFlowNode.title}
                            </h5>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="shrink-0 rounded-full"
                              aria-label="关闭节点详情"
                              onClick={() => setSelectedFlowNodeId(null)}
                            >
                              <XIcon className="size-4" />
                            </Button>
                          </div>

                          <div className="rounded-lg border border-border bg-background px-3 py-3">
                            <div className="text-xs text-muted-foreground">
                              所属阶段
                            </div>
                            <div className="mt-1 text-sm font-medium">
                              {selectedFlowNodeSummary.stageTitle}
                            </div>
                          </div>

                          <div className="rounded-lg border border-border bg-background px-3 py-3">
                            <div className="text-xs text-muted-foreground">
                              节点说明
                            </div>
                            <p className="mt-1 text-sm leading-6 text-foreground">
                              {selectedFlowNode.subtitle}
                            </p>
                          </div>

                          {selectedFlowNode.fields?.length ? (
                            <div className="rounded-lg border border-border bg-background px-3 py-3">
                              <div className="text-xs text-muted-foreground">
                                关键字段
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {selectedFlowNode.fields.map((field) => (
                                  <Badge
                                    key={`${selectedFlowNode.id}-${field}`}
                                    variant="outline"
                                  >
                                    {field}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {selectedFlowNodeSummary.incoming.length ? (
                            <div className="rounded-lg border border-border bg-background px-3 py-3">
                              <div className="text-xs text-muted-foreground">
                                上游流转
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {selectedFlowNodeSummary.incoming.map((item) => (
                                  <Badge
                                    key={`incoming-${selectedFlowNode.id}-${item}`}
                                    variant="outline"
                                  >
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {selectedFlowNodeSummary.outgoing.length ? (
                            <div className="rounded-lg border border-border bg-background px-3 py-3">
                              <div className="text-xs text-muted-foreground">
                                下游输出
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {selectedFlowNodeSummary.outgoing.map((item) => (
                                  <Badge
                                    key={`outgoing-${selectedFlowNode.id}-${item}`}
                                    variant="outline"
                                  >
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                        </div>
                      ) : null}
                    </aside>
                  </div>
                ) : null}
                {activeProcessTab === "rules" ? (
                  <div className="mt-4 space-y-3">
                    {artifact.process.rules.map((rule, index) => (
                      <div
                        key={`${artifact.title}-rule-${rule.title}`}
                        className="rounded-lg border border-border bg-muted/20 px-4 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium">
                            规则 {index + 1}
                          </span>
                          <h5 className="text-sm font-medium">{rule.title}</h5>
                        </div>
                        {rule.tags?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {rule.tags.map((tag) => (
                              <Badge
                                key={`${rule.title}-${tag}`}
                                variant="outline"
                                className={cn("font-normal", getRuleTagClassName(tag))}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {rule.detail}
                        </p>
                        {rule.note ? (
                          <p className="mt-3 text-xs leading-5 text-muted-foreground">
                            {rule.note}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
                {activeProcessTab === "sql" ? (
                  <pre className="mt-4 overflow-auto rounded-lg border border-border bg-muted/20 px-4 py-4 text-sm leading-7 text-muted-foreground">
                    <code>{artifact.process.sql}</code>
                  </pre>
                ) : null}
              </section>
            </div>
          ) : (
            <div className="grid gap-4">
              <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-medium">可视化图表</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      基于当前明细表实时整理，让同一份结果能换一种方式继续看。
                    </p>
                  </div>
                  <Badge variant="outline">{artifact.visual.chartLabel}</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {visualSeries.map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-muted-foreground">
                          {item.value}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-foreground transition-[width] duration-300"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <h4 className="text-sm font-medium">关键结论</h4>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                      当前图表基于 {filteredTableRows.length} 条明细结果生成，继续筛选后这里会同步变化。
                    </div>
                    {artifact.visual.insights.map((insight) => (
                      <div
                        key={insight}
                        className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm leading-6 text-muted-foreground"
                      >
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <h4 className="text-sm font-medium">结构占比</h4>
                  <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                      {visualDistribution.map((item) => (
                        <div
                          key={item.label}
                          className={cn(
                            "h-full",
                            item.tone === "primary" && "bg-foreground",
                            item.tone === "secondary" && "bg-muted-foreground/70",
                            item.tone === "tertiary" && "bg-muted-foreground/35"
                          )}
                          style={{ width: `${item.percent}%` }}
                        />
                      ))}
                    </div>
                    <div className="mt-4 space-y-2">
                      {visualDistribution.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "size-2.5 rounded-full",
                                item.tone === "primary" && "bg-foreground",
                                item.tone === "secondary" &&
                                  "bg-muted-foreground/70",
                                item.tone === "tertiary" &&
                                  "bg-muted-foreground/35"
                              )}
                            />
                            <span>{item.label}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {item.percent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function SessionHeaderTitle({ session }: { session: WorkspaceSession }) {
  const router = useRouter()
  const { deleteSession, getProject, renameSession } = useWorkspace()
  const project = session.projectId ? getProject(session.projectId) : undefined
  const parentTitle = session.isTemporary
    ? "临时会话"
    : (project?.title ?? "项目会话")
  const shouldShowParent =
    session.isTemporary || (project?.sessionIds.length ?? 0) > 1

  function handleRename() {
    const nextTitle = window.prompt("重命名会话", session.title)

    if (nextTitle === null) {
      return
    }

    renameSession(session.id, nextTitle)
  }

  function handleDelete() {
    deleteSession(session.id)
    router.replace(appRoutes.newSession.path)
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      {shouldShowParent ? (
        <>
          <span className="truncate text-sm font-normal text-muted-foreground">
            {parentTitle}
          </span>
          <ChevronRightIcon className="size-3 shrink-0 text-muted-foreground" />
        </>
      ) : null}
      <div className="flex min-w-0 items-center gap-1">
        <h1 className="truncate text-sm font-normal tracking-normal">
          {session.title}
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`${session.title} 操作`}
                className="shrink-0"
              />
            }
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" className="w-28">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleRename}>重命名</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                删除
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function getSessionFromPath(
  pathname: string,
  workspace: ReturnType<typeof useWorkspace>
) {
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => decodePathSegment(segment))

  if (segments[0] === "sessions" && segments[1] && segments[1] !== "new") {
    return workspace.getSessionByRoute(segments[1])
  }

  if (segments[0] === "assets" && segments[1] === "my" && segments[3]) {
    return workspace.getSessionByRoute(segments[3], segments[2])
  }

  if (segments[0] === "assets" && segments[1] === "my" && segments[2]) {
    const project = workspace.getProject(segments[2])
    const primarySessionId = project?.sessionIds[0]

    return primarySessionId ? workspace.getSession(primarySessionId) : undefined
  }

  return undefined
}

function decodePathSegment(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

type ArtifactTabId = "table" | "visual"
type ArtifactProcessTabId = "flow" | "rules" | "sql"

type ArtifactMetric = {
  label: string
  value: string
  helper: string
}

type ArtifactTableFilterField = {
  id: string
  label: string
  type: "text" | "select"
  placeholder: string
  options?: string[]
  columnId?: string
}

type ArtifactTable = {
  caption: string
  filters: string[]
  columns: string[]
  rows: Record<string, string>[]
  filterFields: ArtifactTableFilterField[]
}

type ArtifactVisual = {
  chartLabel: string
  insights: string[]
  labelColumn?: string
  valueColumn?: string
  aggregateByLabel?: boolean
  distributionColumn?: string
  distributionValueColumn?: string
  series: { label: string; value: string; percent: number }[]
  distribution: {
    label: string
    percent: number
    tone: "primary" | "secondary" | "tertiary"
  }[]
}

type ArtifactProcessStep = {
  title: string
  detail: string
  tags?: string[]
  note?: string
}

type ArtifactFlowNode = {
  id: string
  title: string
  subtitle: string
  tone: "source" | "process" | "aggregate" | "result"
  fields?: string[]
}

type ArtifactFlowStage = {
  id: string
  title: string
  nodes: ArtifactFlowNode[]
}

type ArtifactFlowConnection = {
  from: string
  to: string
  labels: string[]
}

type FlowBoardNodeLayout = ArtifactFlowNode & {
  stageId: string
  x: number
  y: number
  width: number
  height: number
}

type FlowBoardEdgeLayout = {
  id: string
  labels: string[]
  labelX: number
  labelY: number
  labelWidth: number
  axisPath: string
  paths: Array<{
    id: string
    d: string
    stroke: string
  }>
}

type FlowBoardLayout = {
  width: number
  height: number
  nodes: FlowBoardNodeLayout[]
  edges: FlowBoardEdgeLayout[]
  stageLabels: Array<{
    id: string
    title: string
    index: number
    x: number
    y: number
  }>
}

type ArtifactProcess = {
  flow: ArtifactProcessStep[]
  graph: {
    stages: ArtifactFlowStage[]
    connections: ArtifactFlowConnection[]
  }
  rules: ArtifactProcessStep[]
  sql: string
}

type ArtifactContent = {
  scopeLabel: string
  title: string
  description: string
  metrics: ArtifactMetric[]
  table: ArtifactTable
  visual: ArtifactVisual
  process: ArtifactProcess
}

const artifactTabs: {
  id: ArtifactTabId
  label: string
}[] = [
  {
    id: "table",
    label: "明细表",
  },
  {
    id: "visual",
    label: "可视化图表",
  },
]

const fundsArtifact = createArtifact({
  scopeLabel: "资金余额",
  title: "主体资金余额结果明细",
  description:
    "围绕主体、币种、可用余额、冻结余额和日环比，提供可继续追问的明细表和结构表达。",
  metrics: [
    { label: "结果行数", value: "4 行", helper: "按主体维度拆分展示" },
    { label: "核心字段", value: "6 个", helper: "余额、冻结、环比、更新时间" },
    { label: "优先关注", value: "2 个主体", helper: "负向环比或冻结金额偏高" },
  ],
  table: {
    caption: "结果已按主体维度整理，可继续追加阈值、负责人或账户明细。",
    filters: ["日期：今日", "维度：主体 / 币种", "排序：余额降序"],
    columns: ["主体", "币种", "可用余额", "冻结余额", "日环比", "更新时间"],
    rows: [
      ["主体 A", "CNY", "1284.0 万", "32.0 万", "+2.4%", "10:30"],
      ["主体 B", "USD", "192.5 万", "8.0 万", "-0.8%", "10:28"],
      ["主体 C", "CNY", "851.2 万", "0.0", "+0.6%", "10:25"],
      ["主体 D", "HKD", "324.1 万", "12.0 万", "-1.1%", "10:21"],
    ],
  },
  visual: {
    chartLabel: "余额对比",
    labelColumn: "主体",
    valueColumn: "可用余额",
    distributionColumn: "币种",
    distributionValueColumn: "可用余额",
    insights: [
      "主体 A 是当前主要资金承载主体，适合继续追问账户构成和最近大额变动。",
      "主体 B 与主体 D 均出现负向环比，建议进一步拆解冻结金额和变动原因。",
      "主体 C 状态稳定，可作为正常样本对比异常主体。",
    ],
    series: [
      { label: "主体 A", value: "1284.0 万", percent: 100 },
      { label: "主体 C", value: "851.2 万", percent: 66 },
      { label: "主体 D", value: "324.1 万", percent: 25 },
      { label: "主体 B", value: "192.5 万", percent: 15 },
    ],
    distribution: [
      { label: "正常", percent: 58, tone: "primary" },
      { label: "需关注", percent: 27, tone: "secondary" },
      { label: "高风险", percent: 15, tone: "tertiary" },
    ],
  },
})

const requirementsOverdueArtifact = createArtifact({
  scopeLabel: "需求明细",
  title: "高优需求超期定位",
  description:
    "聚焦 P0/P1 超期未闭环记录，按负责人汇总并突出等待时间较长的异常需求。",
  metrics: [
    { label: "异常记录", value: "18 条", helper: "P0 / P1 超期未闭环" },
    { label: "负责人", value: "4 组", helper: "A / B / C 组及未分配" },
    { label: "最长等待", value: "11 天", helper: "建议优先处理未分配记录" },
  ],
  table: {
    caption: "这份明细已经对齐超期和未闭环口径，适合继续让 Agent 汇总到负责人或原因分类。",
    filters: ["优先级：P0 / P1", "状态：未闭环", "排序：等待时长降序"],
    columns: ["需求单ID", "需求标题", "负责人", "阻塞原因", "状态", "已等待"],
    filterFields: [
      {
        id: "需求单ID",
        label: "需求单号",
        type: "text",
        placeholder: "输入需求单号",
      },
      {
        id: "需求标题关键词",
        label: "需求标题",
        type: "text",
        placeholder: "输入需求标题关键词",
        columnId: "需求标题",
      },
      {
        id: "负责人",
        label: "负责人",
        type: "select",
        placeholder: "全部负责人",
        options: ["A 组", "B 组", "C 组", "未分配"],
      },
      {
        id: "阻塞原因",
        label: "阻塞原因",
        type: "select",
        placeholder: "全部阻塞原因",
        options: [
          "权限审批",
          "数据接入",
          "口径确认",
          "数据准备",
          "开发排期",
          "依赖接口",
          "数据校验",
        ],
      },
      {
        id: "状态",
        label: "需求单状态",
        type: "select",
        placeholder: "全部状态",
        options: ["处理中", "待确认", "未闭环"],
      },
      {
        id: "已等待天数",
        label: "等待天数",
        type: "text",
        placeholder: "输入等待天数",
        columnId: "已等待",
      },
    ],
    rows: [
      ["REQ-1165", "异常记录回溯", "未分配", "权限审批", "未闭环", "11 天"],
      ["REQ-1032", "高优需求超期定位", "A 组", "数据接入", "处理中", "9 天"],
      ["REQ-1191", "重复提交识别", "B 组", "口径确认", "待确认", "8 天"],
      ["REQ-1098", "来源占比复盘", "B 组", "数据准备", "待确认", "7 天"],
      ["REQ-1143", "负责人待办排行", "C 组", "开发排期", "处理中", "6 天"],
      ["REQ-1210", "资产口径对齐", "A 组", "依赖接口", "处理中", "6 天"],
      ["REQ-1176", "权限回收复盘", "未分配", "权限审批", "未闭环", "5 天"],
      ["REQ-1124", "收入明细补数", "C 组", "数据校验", "待确认", "5 天"],
    ],
  },
  visual: {
    chartLabel: "负责人分布",
    labelColumn: "负责人",
    valueColumn: "已等待",
    aggregateByLabel: true,
    distributionColumn: "状态",
    insights: [
      "A 组和 B 组承接了最多高优需求，适合继续按阻塞原因做二次拆分。",
      "未分配记录数量少但等待时间最长，建议单独跟踪。",
      "当前卡点主要集中在数据接入、权限审批和口径确认。",
    ],
    series: [
      { label: "A 组", value: "7 条", percent: 100 },
      { label: "B 组", value: "5 条", percent: 72 },
      { label: "C 组", value: "3 条", percent: 42 },
      { label: "未分配", value: "1 条", percent: 18 },
    ],
    distribution: [
      { label: "处理中", percent: 46, tone: "primary" },
      { label: "待确认", percent: 34, tone: "secondary" },
      { label: "未闭环", percent: 20, tone: "tertiary" },
    ],
  },
  process: {
    flow: [
      ["筛选高优未闭环需求", "先按 P0/P1 优先级与未闭环状态过滤需求记录，只保留当前需要跟进的范围。"],
      ["补充负责人和阻塞原因", "关联负责人字段与阻塞原因标签，便于后续按人和问题类型继续汇总。"],
      ["按等待时间排序输出", "计算等待时长后按降序整理结果，优先暴露等待时间最长的异常需求。"],
    ],
    graph: {
      stages: [
        {
          id: "source",
          title: "数据来源",
          nodes: [
            {
              id: "requirement-base",
              title: "需求主表",
              subtitle: "读取需求单基础信息、优先级、当前状态和负责人。",
              tone: "source",
              fields: ["demand_id", "priority", "current_status", "owner_id"],
            },
            {
              id: "progress-log",
              title: "推进日志表",
              subtitle: "补最近一次有效推进时间，用于后续计算等待时长。",
              tone: "source",
              fields: ["demand_id", "last_progress_date", "updated_at"],
            },
            {
              id: "blocker-dict",
              title: "阻塞原因字典",
              subtitle: "还原阻塞分类、负责人组别和展示口径。",
              tone: "source",
              fields: ["blocker_code", "blocker_reason", "owner_group"],
            },
          ],
        },
        {
          id: "enrich",
          title: "筛选与补充",
          nodes: [
            {
              id: "priority-filter",
              title: "高优未闭环筛选",
              subtitle: "只保留 P0/P1 且仍未闭环的需求记录。",
              tone: "process",
              fields: ["priority IN (P0,P1)", "status != 已完成"],
            },
            {
              id: "owner-enrich",
              title: "负责人和阻塞归因",
              subtitle: "补齐负责人组别、阻塞原因和来源口径，方便继续追问。",
              tone: "aggregate",
              fields: ["owner_group", "blocker_reason", "source_type"],
            },
          ],
        },
        {
          id: "rank",
          title: "等待计算",
          nodes: [
            {
              id: "waiting-days",
              title: "等待时长计算",
              subtitle: "按最近推进时间计算等待天数，并标记超期记录。",
              tone: "process",
              fields: ["DATEDIFF(today, last_progress_date)", "overdue_flag"],
            },
            {
              id: "priority-order",
              title: "风险优先排序",
              subtitle: "优先暴露未分配、等待更久、卡在关键原因的需求。",
              tone: "aggregate",
              fields: ["unassigned first", "waiting_days DESC", "blocker_tag"],
            },
          ],
        },
        {
          id: "result",
          title: "结果输出",
          nodes: [
            {
              id: "overdue-detail",
              title: "高优需求超期定位明细",
              subtitle: "输出右侧明细表，可继续筛选、导出和下钻追问。",
              tone: "result",
              fields: [
                "需求单ID",
                "需求标题",
                "负责人",
                "阻塞原因",
                "状态",
                "已等待",
              ],
            },
          ],
        },
      ],
      connections: [
        {
          from: "source",
          to: "enrich",
          labels: ["demand_id 关联", "priority / status 过滤", "owner_id 补组别"],
        },
        {
          from: "enrich",
          to: "rank",
          labels: ["last_progress_date 计算", "阻塞原因归类", "超期标记"],
        },
        {
          from: "rank",
          to: "result",
          labels: ["等待时长排序", "保留关键展示字段", "输出可导出明细"],
        },
      ],
    },
    rules: [
      {
        title: "高优需求入池口径",
        detail:
          "仅保留优先级为 P0 / P1 的需求单，并要求当前状态仍处于处理中、待确认或未闭环，已完成与已关闭记录不进入结果。",
        tags: ["priority", "P0/P1", "current_status"],
        note:
          "这一步先锁定排查范围，避免把普通优先级或已收口的需求混入当前明细。",
      },
      {
        title: "等待时长计算规则",
        detail:
          "等待时长使用当前日期减去最近一次有效推进时间 `last_progress_date` 计算；若近 5 天无推进动作，则标记为超期候选。",
        tags: ["last_progress_date", "waiting_days", ">= 5 天"],
        note:
          "有效推进时间取最后一次状态变更、评论确认或负责人更新中的最新时间。",
      },
      {
        title: "负责人与阻塞原因补齐",
        detail:
          "通过 `owner_id` 关联负责人映射表得到负责组别，再通过 `blocker_code` 还原阻塞原因标签，确保同一需求在明细、图表和后续追问中口径一致。",
        tags: ["owner_id", "owner_group", "blocker_code", "blocker_reason"],
        note:
          "未匹配到负责人时统一落到“未分配”，方便单独筛选和优先处理。",
      },
      {
        title: "结果排序与展示优先级",
        detail:
          "最终结果按未分配优先、等待时长降序、阻塞原因风险级别排序，优先把权限审批、数据接入和口径确认等高频卡点展示在前面。",
        tags: ["未分配优先", "waiting_days DESC", "风险标签排序"],
        note:
          "这样能让右侧明细表更像问题处理清单，而不是纯粹的原始记录罗列。",
      },
    ],
    sql: [
      "-- 高优需求超期定位",
      "SELECT",
      "  demand_id,",
      "  demand_title,",
      "  owner_group,",
      "  blocker_reason,",
      "  current_status,",
      "  DATEDIFF(CURRENT_DATE, last_progress_date) AS waiting_days",
      "FROM requirement_detail",
      "WHERE priority IN ('P0', 'P1')",
      "  AND current_status IN ('处理中', '待确认', '未闭环')",
      "  AND DATEDIFF(CURRENT_DATE, last_progress_date) >= 5",
      "ORDER BY waiting_days DESC;",
    ].join("\n"),
  },
})

const requirementsSourceArtifact = createArtifact({
  scopeLabel: "需求明细",
  title: "需求来源占比",
  description:
    "按本月来源维度整理需求量和环比变化，支持继续追问增长最快来源的明细。",
  metrics: [
    { label: "来源类型", value: "4 类", helper: "业务运营、财务分析、项目管理、其他" },
    { label: "增长最快", value: "财务分析", helper: "环比提升 9 个百分点" },
    { label: "总需求量", value: "84 条", helper: "已按来源和模块拆开 mock" },
  ],
  table: {
    caption: "可以继续要求展开某一来源下的具体需求列表，或按周拆趋势。",
    filters: ["时间：本月", "视角：需求来源", "排序：占比降序"],
    columns: [
      "来源",
      "需求模块",
      "需求数",
      "占比",
      "环比变化",
      "高优需求",
      "状态",
    ],
    filterFields: [
      {
        id: "来源",
        label: "来源",
        type: "select",
        placeholder: "全部来源",
        options: ["业务运营", "财务分析", "项目管理", "其他"],
      },
      {
        id: "需求模块",
        label: "需求模块",
        type: "select",
        placeholder: "全部模块",
        options: [
          "经营复盘",
          "投放监控",
          "结算对账",
          "利润核算",
          "排期跟踪",
          "交付复盘",
          "临时核查",
          "权限处理",
        ],
      },
      {
        id: "状态",
        label: "状态",
        type: "select",
        placeholder: "全部状态",
        options: ["稳定", "增长最快", "波动"],
      },
      {
        id: "高优需求",
        label: "高优需求数",
        type: "text",
        placeholder: "输入高优需求数",
      },
    ],
    rows: [
      ["业务运营", "经营复盘", "18", "21%", "+4pp", "6", "稳定"],
      ["业务运营", "投放监控", "17", "20%", "+2pp", "5", "稳定"],
      ["财务分析", "结算对账", "13", "15%", "+5pp", "7", "增长最快"],
      ["财务分析", "利润核算", "11", "13%", "+4pp", "4", "增长最快"],
      ["项目管理", "排期跟踪", "8", "10%", "-1pp", "2", "稳定"],
      ["项目管理", "交付复盘", "7", "8%", "-1pp", "1", "稳定"],
      ["其他", "临时核查", "6", "7%", "+1pp", "1", "波动"],
      ["其他", "权限处理", "4", "5%", "-2pp", "1", "波动"],
    ],
  },
  visual: {
    chartLabel: "来源占比",
    labelColumn: "来源",
    valueColumn: "需求数",
    aggregateByLabel: true,
    distributionColumn: "来源",
    distributionValueColumn: "需求数",
    insights: [
      "业务运营仍是需求主来源，但增长主要来自经营复盘和投放监控两类需求。",
      "财务分析来源增长最快，而且高优需求数更高，适合继续追问集中在哪些财务模块。",
      "项目管理来源整体稳定，更适合作为基线口径看长期变化。",
    ],
    series: [
      { label: "业务运营", value: "42%", percent: 100 },
      { label: "财务分析", value: "28%", percent: 67 },
      { label: "项目管理", value: "18%", percent: 43 },
      { label: "其他", value: "12%", percent: 29 },
    ],
    distribution: [
      { label: "业务运营", percent: 42, tone: "primary" },
      { label: "财务分析", percent: 28, tone: "secondary" },
      { label: "其他来源", percent: 30, tone: "tertiary" },
    ],
  },
  process: {
    flow: [
      [
        "读取需求主表与提单来源",
        "先按自然月取需求明细，并读取提单来源、模块标签、优先级与当前状态等基础字段。",
      ],
      [
        "按来源口径归类映射",
        "把原始提单方映射为业务运营、财务分析、项目管理、其他四类统一来源口径。",
      ],
      [
        "按来源与模块聚合",
        "在来源维度下继续按需求模块聚合需求量、高优需求数与环比变化，供右侧明细表和图表共用。",
      ],
      [
        "输出明细与图表",
        "把聚合后的来源明细输出到明细表，图表页则直接基于这份明细做可视化表达。",
      ],
    ],
    graph: {
      stages: [
        {
          id: "source",
          title: "数据来源",
          nodes: [
            {
              id: "source-requirements",
              title: "需求主表",
              subtitle: "读取需求单、创建时间、提单来源、优先级和状态。",
              tone: "source",
              fields: [
                "demand_id",
                "created_at",
                "source_owner",
                "priority",
                "current_status",
              ],
            },
            {
              id: "source-module",
              title: "模块标签表",
              subtitle: "补充需求模块、业务域和展示标签。",
              tone: "source",
              fields: ["demand_id", "module_name", "biz_domain"],
            },
          ],
        },
        {
          id: "process",
          title: "口径处理",
          nodes: [
            {
              id: "source-mapping",
              title: "来源归类映射",
              subtitle: "把原始提单方统一归到四类来源口径中。",
              tone: "process",
              fields: [
                "source_owner -> source_type",
                "财务BP -> 财务分析",
                "PMO -> 项目管理",
              ],
            },
            {
              id: "source-filter",
              title: "时间与范围过滤",
              subtitle: "仅保留本月已入池需求，并剔除测试单和撤销单。",
              tone: "process",
              fields: ["本月", "is_test = 0", "status != 已撤销"],
            },
          ],
        },
        {
          id: "aggregate",
          title: "合并处理",
          nodes: [
            {
              id: "source-group",
              title: "来源与模块聚合",
              subtitle: "按来源 + 模块统计需求量、高优需求数与状态口径。",
              tone: "aggregate",
              fields: [
                "COUNT(demand_id)",
                "priority IN (P0,P1)",
                "group by source_type,module_name",
              ],
            },
            {
              id: "source-trend",
              title: "环比变化计算",
              subtitle: "对比上月同口径结果，计算来源和模块层环比变化。",
              tone: "aggregate",
              fields: ["last_month_count", "mom_change", "share_rate"],
            },
          ],
        },
        {
          id: "result",
          title: "结果输出",
          nodes: [
            {
              id: "source-artifact",
              title: "需求来源占比明细",
              subtitle: "右侧明细表用于筛选与导出，图表页复用同一份来源明细。",
              tone: "result",
              fields: [
                "来源",
                "需求模块",
                "需求数",
                "占比",
                "环比变化",
                "高优需求",
              ],
            },
          ],
        },
      ],
      connections: [
        {
          from: "source",
          to: "process",
          labels: ["读取原始需求", "补模块标签", "统一来源口径"],
        },
        {
          from: "process",
          to: "aggregate",
          labels: ["过滤测试/撤销单", "按来源+模块聚合", "计算环比"],
        },
        {
          from: "aggregate",
          to: "result",
          labels: ["生成可筛选明细", "驱动图表表达"],
        },
      ],
    },
    rules: [
      {
        title: "来源分类口径",
        detail:
          "来源不直接展示原始提单方，而是统一映射为业务运营、财务分析、项目管理、其他四类，避免同类角色拆散后影响占比判断。",
        tags: ["source_owner", "source_type", "统一归类"],
        note:
          "例如经营复盘、投放监控等业务团队统一归到“业务运营”，财务 BP、对账支持统一归到“财务分析”。",
      },
      {
        title: "时间范围与去噪规则",
        detail:
          "仅保留本月创建并成功入池的需求；测试单、撤销单、重复演示单不进入结果，确保来源占比反映真实业务需求。",
        tags: ["created_at", "本月", "is_test = 0", "status != 已撤销"],
        note:
          "这一步决定了结果能不能真实反映本月来源结构，而不是被无效记录拉偏。",
      },
      {
        title: "占比与环比计算方式",
        detail:
          "来源占比 = 当前来源需求数 / 本月总需求数；环比变化使用当前来源需求数与上月同口径需求数对比，输出百分点变化。",
        tags: ["share_rate", "mom_change", "百分点变化"],
        note:
          "环比变化与占比是两个不同概念，图表和表格里都会同时保留，避免继续追问时口径混淆。",
      },
      {
        title: "高优需求补充规则",
        detail:
          "明细表额外保留每个来源-模块组合下的 P0/P1 数量，方便直接看增长来源里是否同时带来高优压力。",
        tags: ["priority", "P0/P1", "high_priority_count"],
        note:
          "这一列也是后续继续追问“增长最快的来源是否更紧急”的关键依据。",
      },
    ],
    sql: [
      "-- 需求来源占比",
      "WITH base AS (",
      "  SELECT",
      "    CASE",
      "      WHEN source_owner IN ('业务运营', '经营分析', '投放运营') THEN '业务运营'",
      "      WHEN source_owner IN ('财务BP', '结算分析', '经营财务') THEN '财务分析'",
      "      WHEN source_owner IN ('PMO', '项目经理') THEN '项目管理'",
      "      ELSE '其他'",
      "    END AS source_type,",
      "    module_name,",
      "    priority,",
      "    current_status",
      "  FROM requirement_detail",
      "  WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)",
      "    AND is_test = 0",
      "    AND current_status != '已撤销'",
      ")",
      "SELECT",
      "  source_type,",
      "  module_name,",
      "  COUNT(*) AS demand_count,",
      "  SUM(CASE WHEN priority IN ('P0', 'P1') THEN 1 ELSE 0 END) AS high_priority_count",
      "FROM base",
      "GROUP BY 1, 2",
      "ORDER BY demand_count DESC;",
    ].join("\n"),
  },
})

const requirementsOwnerArtifact = createArtifact({
  scopeLabel: "需求明细",
  title: "负责人待办排行",
  description:
    "按负责人聚合待处理需求数、平均等待天数和最早创建时间，突出高等待负责人。",
  metrics: [
    { label: "负责人", value: "6 位", helper: "当前待办已聚合到负责人维度" },
    { label: "高等待", value: "3 位", helper: "平均等待超过 6 天" },
    { label: "最长待办", value: "11 天", helper: "未分配记录需优先提醒" },
  ],
  table: {
    caption: "这份结果适合继续要求按负责人展开具体需求，或只保留等待时间大于 5 天的记录。",
    filters: ["状态：待处理", "排序：平均等待天数降序", "范围：本月"],
    columns: [
      "负责人",
      "所属组",
      "待处理需求数",
      "平均等待",
      "最早创建",
      "高优需求",
      "阻塞数",
      "状态",
    ],
    filterFields: [
      {
        id: "负责人",
        label: "负责人",
        type: "text",
        placeholder: "输入负责人",
      },
      {
        id: "所属组",
        label: "所属组",
        type: "select",
        placeholder: "全部组别",
        options: [
          "数据治理 A 组",
          "数据治理 B 组",
          "经营分析组",
          "平台支持组",
          "未分配",
        ],
      },
      {
        id: "状态",
        label: "状态",
        type: "select",
        placeholder: "全部状态",
        options: ["需关注", "稳定", "异常"],
      },
      {
        id: "高优需求",
        label: "高优需求数",
        type: "text",
        placeholder: "输入高优需求数",
      },
    ],
    rows: [
      ["林西", "数据治理 A 组", "7", "6.8 天", "05-02", "3", "2", "需关注"],
      ["周乔", "数据治理 B 组", "6", "6.3 天", "05-03", "2", "1", "需关注"],
      ["陈澜", "经营分析组", "5", "5.7 天", "05-04", "2", "1", "需关注"],
      ["赵青", "平台支持组", "4", "4.9 天", "05-05", "1", "1", "稳定"],
      ["王屿", "经营分析组", "3", "3.4 天", "05-06", "1", "0", "稳定"],
      ["未分配", "未分配", "2", "11.0 天", "05-01", "2", "2", "异常"],
    ],
  },
  visual: {
    chartLabel: "等待时长对比",
    labelColumn: "负责人",
    valueColumn: "待处理需求数",
    distributionColumn: "状态",
    distributionValueColumn: "待处理需求数",
    insights: [
      "林西和周乔当前承接待办最多，适合继续展开看高优需求和阻塞明细。",
      "未分配虽然数量不大，但等待时间极长，应单独作为异常清单处理。",
      "当前可先把平均等待超过 6 天或阻塞数大于 1 的负责人作为提醒阈值。",
    ],
    series: [
      { label: "林西", value: "7 条", percent: 100 },
      { label: "周乔", value: "6 条", percent: 86 },
      { label: "陈澜", value: "5 条", percent: 72 },
      { label: "赵青", value: "4 条", percent: 58 },
      { label: "未分配", value: "2 条", percent: 29 },
    ],
    distribution: [
      { label: "超过 6 天", percent: 43, tone: "primary" },
      { label: "3-6 天", percent: 37, tone: "secondary" },
      { label: "3 天内", percent: 20, tone: "tertiary" },
    ],
  },
  process: {
    flow: [
      [
        "拉取待处理需求明细",
        "按本月仍未完成的需求记录取数，并读取负责人、创建时间、最近推进时间和优先级。",
      ],
      [
        "按负责人归并计算",
        "把同一负责人名下的待办需求合并，计算待处理需求数、平均等待、高优需求数与阻塞数。",
      ],
      [
        "识别异常负责人",
        "把等待时间长、未分配、阻塞数高的负责人打上异常或需关注标签。",
      ],
      [
        "输出排行结果",
        "生成右侧排行明细表，供筛选、导出和切换到图表视角继续查看。",
      ],
    ],
    graph: {
      stages: [
        {
          id: "source",
          title: "数据来源",
          nodes: [
            {
              id: "owner-demand-base",
              title: "需求主表",
              subtitle: "读取负责人、当前状态、优先级和创建时间。",
              tone: "source",
              fields: ["demand_id", "owner_name", "current_status", "created_at"],
            },
            {
              id: "owner-progress-log",
              title: "推进日志",
              subtitle: "用于计算最近推进时间和当前等待天数。",
              tone: "source",
              fields: ["demand_id", "last_progress_date", "updated_at"],
            },
          ],
        },
        {
          id: "process",
          title: "处理中间层",
          nodes: [
            {
              id: "owner-scope-filter",
              title: "待处理范围过滤",
              subtitle: "只保留处理中、待确认、待排期等未完成需求。",
              tone: "process",
              fields: ["status != 已完成", "status != 已关闭"],
            },
            {
              id: "owner-waiting",
              title: "等待时长计算",
              subtitle: "按最近一次有效推进时间计算每条需求等待天数。",
              tone: "process",
              fields: ["DATEDIFF(today, last_progress_date)", "waiting_days"],
            },
          ],
        },
        {
          id: "aggregate",
          title: "合并处理",
          nodes: [
            {
              id: "owner-grouping",
              title: "负责人聚合",
              subtitle: "按负责人汇总待办数、平均等待、高优需求与阻塞数。",
              tone: "aggregate",
              fields: [
                "COUNT(demand_id)",
                "AVG(waiting_days)",
                "SUM(high_priority)",
                "SUM(block_flag)",
              ],
            },
            {
              id: "owner-tagging",
              title: "风险标签判断",
              subtitle: "对未分配、等待过长或阻塞偏高的负责人打标签。",
              tone: "aggregate",
              fields: [">= 6 天", "unassigned", "block_count >= 2"],
            },
          ],
        },
        {
          id: "result",
          title: "结果输出",
          nodes: [
            {
              id: "owner-artifact",
              title: "负责人待办排行明细",
              subtitle: "输出筛选后的负责人排行，同时驱动右侧图表表达。",
              tone: "result",
              fields: [
                "负责人",
                "所属组",
                "待处理需求数",
                "平均等待",
                "高优需求",
                "阻塞数",
              ],
            },
          ],
        },
      ],
      connections: [
        {
          from: "source",
          to: "process",
          labels: ["取未完成需求", "补推进时间", "计算等待天数"],
        },
        {
          from: "process",
          to: "aggregate",
          labels: ["按负责人合并", "统计高优/阻塞", "识别异常负责人"],
        },
        {
          from: "aggregate",
          to: "result",
          labels: ["生成排行表", "同步到图表"],
        },
      ],
    },
    rules: [
      {
        title: "待办范围定义",
        detail:
          "只纳入当前状态为处理中、待确认、待排期、未闭环的需求，已完成与已关闭需求不参与负责人待办排行。",
        tags: ["current_status", "处理中", "待确认", "未闭环"],
        note:
          "这一步保证待办排行反映的是“当前真的还压在负责人身上的事”，而不是历史累计处理量。",
      },
      {
        title: "等待时长计算口径",
        detail:
          "平均等待按每条需求的 `today - last_progress_date` 计算后再做负责人聚合，避免直接用创建时间放大正在推进中的需求。",
        tags: ["last_progress_date", "waiting_days", "AVG(waiting_days)"],
        note:
          "如果没有推进记录，则退化使用创建时间作为等待起点。",
      },
      {
        title: "高优需求与阻塞数补充",
        detail:
          "排行表除了待处理需求数，还额外保留 P0/P1 数量与阻塞数，用于区分“量大但可推进”和“量不大但卡点集中”的负责人。",
        tags: ["priority", "P0/P1", "block_flag"],
        note:
          "这也是后续继续追问“先提醒谁”时最有用的两列。",
      },
      {
        title: "状态标签判断",
        detail:
          "平均等待超过 6 天或阻塞数超过 1 的负责人标记为“需关注”；未分配或等待超过 10 天标记为“异常”。",
        tags: ["> 6 天", "block_count > 1", "未分配", "异常"],
        note:
          "这样右侧明细表既能用来排序，也能直接当做行动列表。",
      },
    ],
    sql: [
      "-- 负责人待办排行",
      "WITH base AS (",
      "  SELECT",
      "    COALESCE(owner_name, '未分配') AS owner_name,",
      "    owner_group,",
      "    created_at,",
      "    priority,",
      "    blocker_flag,",
      "    DATEDIFF(CURRENT_DATE, COALESCE(last_progress_date, created_at)) AS waiting_days",
      "  FROM requirement_detail",
      "  WHERE current_status IN ('处理中', '待确认', '待排期', '未闭环')",
      ")",
      "SELECT",
      "  owner_name,",
      "  owner_group,",
      "  COUNT(*) AS todo_count,",
      "  AVG(waiting_days) AS avg_waiting_days,",
      "  MIN(created_at) AS earliest_created_at,",
      "  SUM(CASE WHEN priority IN ('P0', 'P1') THEN 1 ELSE 0 END) AS high_priority_count,",
      "  SUM(CASE WHEN blocker_flag = 1 THEN 1 ELSE 0 END) AS blocker_count",
      "FROM base",
      "GROUP BY 1, 2",
      "ORDER BY avg_waiting_days DESC;",
    ].join("\n"),
  },
})

const budgetConversionArtifact = createArtifact({
  scopeLabel: "预算漏斗",
  title: "预算漏斗转化分析",
  description:
    "展示申请、审批、冻结、消耗四个阶段的转化情况，并保留关键阶段明细。",
  metrics: [
    { label: "关键阶段", value: "4 段", helper: "申请、审批、冻结、消耗" },
    { label: "最终转化", value: "51%", helper: "申请到实际消耗" },
    { label: "最大流失", value: "审批到冻结", helper: "当前最主要损耗段" },
  ],
  table: {
    caption: "如果你继续追问，可以再把每个阶段拆到渠道或预算单明细。",
    filters: ["范围：本月", "视角：漏斗阶段", "排序：阶段顺序"],
    columns: ["阶段", "预算单数", "金额", "转化率", "主要损耗", "状态"],
    rows: [
      ["申请", "126", "1280 万", "100%", "-", "起点"],
      ["审批通过", "96", "1024 万", "76%", "审批驳回", "正常"],
      ["冻结成功", "79", "836 万", "63%", "冻结未执行", "需关注"],
      ["实际消耗", "65", "654 万", "51%", "释放和核销偏慢", "需跟进"],
    ],
  },
  visual: {
    chartLabel: "阶段转化",
    labelColumn: "阶段",
    valueColumn: "预算单数",
    distributionColumn: "阶段",
    distributionValueColumn: "预算单数",
    insights: [
      "审批到冻结阶段流失最大，说明执行环节是主要问题点。",
      "冻结成功率虽然不低，但释放和核销速度仍影响最终消耗。",
      "后续适合继续让 Agent 追加驳回原因或冻结说明字段。",
    ],
    series: [
      { label: "申请", value: "100%", percent: 100 },
      { label: "审批通过", value: "76%", percent: 76 },
      { label: "冻结成功", value: "63%", percent: 63 },
      { label: "实际消耗", value: "51%", percent: 51 },
    ],
    distribution: [
      { label: "已转化", percent: 51, tone: "primary" },
      { label: "阶段损耗", percent: 32, tone: "secondary" },
      { label: "待处理", percent: 17, tone: "tertiary" },
    ],
  },
})

const budgetFreezeArtifact = createArtifact({
  scopeLabel: "预算漏斗",
  title: "冻结预算原因追踪",
  description:
    "聚焦冻结超过 14 天仍未释放或消耗的预算记录，适合继续按金额或渠道展开追踪。",
  metrics: [
    { label: "异常笔数", value: "23 笔", helper: "冻结超过 14 天" },
    { label: "高金额", value: "3 笔", helper: "单笔金额超过 120 万" },
    { label: "集中场景", value: "渠道投放", helper: "当前金额占比最高" },
  ],
  table: {
    caption: "建议优先人工复核金额较大和冻结时间较长的预算单。",
    filters: ["状态：冻结 / 待释放", "时长：>14 天", "排序：金额降序"],
    columns: ["预算单号", "渠道", "申请金额", "当前阶段", "冻结时长", "风险级别"],
    rows: [
      ["BDG-021", "渠道 C", "280 万", "冻结中", "19 天", "高"],
      ["BDG-034", "渠道 F", "164 万", "待释放", "16 天", "高"],
      ["BDG-039", "渠道 H", "122 万", "冻结中", "15 天", "中"],
      ["BDG-041", "渠道 A", "96 万", "审批通过", "14 天", "低"],
    ],
  },
  visual: {
    chartLabel: "风险结构",
    labelColumn: "渠道",
    valueColumn: "申请金额",
    distributionColumn: "风险级别",
    distributionValueColumn: "申请金额",
    insights: [
      "渠道 C 金额最高且冻结最久，适合优先展开单笔追踪。",
      "待释放记录占比较高，说明预算并非没有通过，而是释放和核销偏慢。",
      "继续追问时可以让 Agent 按联运、投放、结算场景分组。",
    ],
    series: [
      { label: "渠道 C", value: "280 万", percent: 100 },
      { label: "渠道 F", value: "164 万", percent: 58 },
      { label: "渠道 H", value: "122 万", percent: 44 },
      { label: "渠道 A", value: "96 万", percent: 34 },
    ],
    distribution: [
      { label: "高风险", percent: 48, tone: "primary" },
      { label: "中风险", percent: 31, tone: "secondary" },
      { label: "低风险", percent: 21, tone: "tertiary" },
    ],
  },
})

const budgetWarningArtifact = createArtifact({
  scopeLabel: "预算漏斗",
  title: "渠道预算消耗预警",
  description:
    "找出消耗进度低于计划 20% 的渠道，方便继续补充渠道负责人和原因说明。",
  metrics: [
    { label: "预警渠道", value: "3 个", helper: "当前低于计划 20%" },
    { label: "最大偏差", value: "渠道 C", helper: "预算大且启动晚" },
    { label: "建议动作", value: "拆原因", helper: "区分启动晚和转化低" },
  ],
  table: {
    caption: "适合继续按渠道展开预算单明细，或让 Agent 输出预警邮件摘要。",
    filters: ["范围：本月", "规则：低于计划 20%", "排序：偏差绝对值降序"],
    columns: ["渠道", "计划进度", "实际进度", "偏差", "预算规模", "状态"],
    rows: [
      ["渠道 C", "65%", "38%", "-27pp", "高", "预警"],
      ["渠道 F", "54%", "31%", "-23pp", "中", "预警"],
      ["渠道 H", "49%", "28%", "-21pp", "中", "预警"],
      ["渠道 A", "52%", "47%", "-5pp", "低", "正常"],
    ],
  },
  visual: {
    chartLabel: "渠道进度差异",
    labelColumn: "渠道",
    valueColumn: "偏差",
    distributionColumn: "状态",
    insights: [
      "渠道 C 预算规模最大，但实际消耗明显落后计划，应优先排查。",
      "渠道 F 和 H 也存在明显偏差，适合继续看启动时间和转化表现。",
      "正常渠道可以作为对比样本，辅助判断问题来自节奏还是效果。",
    ],
    series: [
      { label: "渠道 C", value: "-27pp", percent: 100 },
      { label: "渠道 F", value: "-23pp", percent: 85 },
      { label: "渠道 H", value: "-21pp", percent: 78 },
      { label: "渠道 A", value: "-5pp", percent: 18 },
    ],
    distribution: [
      { label: "严重预警", percent: 41, tone: "primary" },
      { label: "中度预警", percent: 34, tone: "secondary" },
      { label: "正常", percent: 25, tone: "tertiary" },
    ],
  },
})

const executionSlaArtifact = createArtifact({
  scopeLabel: "执行情况",
  title: "需求单执行 SLA",
  description:
    "按部门整理创建到完成的 SLA 达成情况，突出达成率偏低的部门。",
  metrics: [
    { label: "整体达成率", value: "83%", helper: "本期 mock 汇总" },
    { label: "最低部门", value: "数据平台", helper: "当前主要受权限等待影响" },
    { label: "对比部门", value: "4 个", helper: "可继续展开部门明细" },
  ],
  table: {
    caption: "如果继续追问，可以把低 SLA 部门再拆到具体阻塞需求。",
    filters: ["时间：本月", "指标：SLA 达成率", "排序：达成率升序"],
    columns: ["部门", "总单量", "SLA 达成率", "平均耗时", "主要原因", "状态"],
    rows: [
      ["数据平台", "42", "72%", "6.2 天", "权限等待", "需关注"],
      ["项目管理", "27", "79%", "5.4 天", "口径确认", "需关注"],
      ["研发支持", "38", "84%", "4.8 天", "排期冲突", "稳定"],
      ["财务分析", "33", "91%", "3.6 天", "少量返工", "良好"],
    ],
  },
  visual: {
    chartLabel: "达成率对比",
    labelColumn: "部门",
    valueColumn: "SLA 达成率",
    distributionColumn: "状态",
    distributionValueColumn: "总单量",
    insights: [
      "数据平台达成率最低，适合继续追问具体卡在哪些权限或上游表。",
      "财务分析达成率最高，可以作为处理流程的对照组。",
      "当前两类主要问题是权限等待和口径确认。",
    ],
    series: [
      { label: "财务分析", value: "91%", percent: 91 },
      { label: "研发支持", value: "84%", percent: 84 },
      { label: "项目管理", value: "79%", percent: 79 },
      { label: "数据平台", value: "72%", percent: 72 },
    ],
    distribution: [
      { label: "达标", percent: 83, tone: "primary" },
      { label: "临界", percent: 11, tone: "secondary" },
      { label: "未达标", percent: 6, tone: "tertiary" },
    ],
  },
})

const executionCompletionArtifact = createArtifact({
  scopeLabel: "执行情况",
  title: "部门完成率对比",
  description:
    "整理各部门完成率、进行中数量和阻塞数量，适合继续生成部门复盘摘要。",
  metrics: [
    { label: "完成率最高", value: "财务分析 91%", helper: "当前表现最佳" },
    { label: "阻塞最高", value: "数据平台 8 条", helper: "需继续拆阻塞原因" },
    { label: "进行中", value: "25 条", helper: "跨部门累计进行中数量" },
  ],
  table: {
    caption: "继续追问时，可以让 Agent 只保留阻塞高的部门，或按负责人展开。",
    filters: ["时间：本月", "视角：部门", "排序：完成率升序"],
    columns: ["部门", "总单量", "完成率", "进行中", "阻塞数", "状态"],
    rows: [
      ["数据平台", "42", "72%", "10", "8", "需关注"],
      ["项目管理", "27", "79%", "5", "3", "需关注"],
      ["研发支持", "38", "84%", "7", "4", "稳定"],
      ["财务分析", "33", "91%", "3", "1", "良好"],
    ],
  },
  visual: {
    chartLabel: "完成率对比",
    labelColumn: "部门",
    valueColumn: "完成率",
    distributionColumn: "状态",
    distributionValueColumn: "总单量",
    insights: [
      "数据平台完成率最低，同时阻塞数量最高，建议作为重点部门继续分析。",
      "项目管理也存在一定积压，但波动不如数据平台明显。",
      "财务分析团队可以作为高完成率样本进行流程对照。",
    ],
    series: [
      { label: "财务分析", value: "91%", percent: 91 },
      { label: "研发支持", value: "84%", percent: 84 },
      { label: "项目管理", value: "79%", percent: 79 },
      { label: "数据平台", value: "72%", percent: 72 },
    ],
    distribution: [
      { label: "已完成", percent: 83, tone: "primary" },
      { label: "进行中", percent: 11, tone: "secondary" },
      { label: "阻塞中", percent: 6, tone: "tertiary" },
    ],
  },
})

const executionBlockArtifact = createArtifact({
  scopeLabel: "执行情况",
  title: "阻塞原因归类",
  description:
    "将阻塞中的需求单按原因归类，并保留可继续追问的原因占比与建议方向。",
  metrics: [
    { label: "阻塞总量", value: "31 条", helper: "当前处于阻塞状态的需求单" },
    { label: "最高原因", value: "权限等待", helper: "占比 38%" },
    { label: "建议动作", value: "权限同步", helper: "适合接到 MCP 权限流" },
  ],
  table: {
    caption: "这份结果可以继续按原因展开具体需求清单，或者直接转成处理建议。",
    filters: ["状态：阻塞中", "视角：原因分类", "排序：占比降序"],
    columns: ["阻塞原因", "需求数", "占比", "典型场景", "建议动作", "状态"],
    rows: [
      ["权限等待", "12", "38%", "上游表开通", "同步权限申请", "优先处理"],
      ["口径未确认", "8", "27%", "指标口径反复确认", "补充 owner", "持续跟进"],
      ["排期冲突", "6", "21%", "开发资源不足", "重新排期", "可协调"],
      ["数据缺失", "5", "14%", "源表字段不全", "补齐数据", "待确认"],
    ],
  },
  visual: {
    chartLabel: "阻塞结构",
    labelColumn: "阻塞原因",
    valueColumn: "需求数",
    distributionColumn: "阻塞原因",
    distributionValueColumn: "需求数",
    insights: [
      "权限等待是最主要的阻塞原因，适合优先接入自动化流程。",
      "口径未确认比例也不低，说明前置定义和 owner 同步仍需加强。",
      "如果继续追问，可以把每类阻塞再拆到具体部门或需求单。",
    ],
    series: [
      { label: "权限等待", value: "38%", percent: 100 },
      { label: "口径未确认", value: "27%", percent: 71 },
      { label: "排期冲突", value: "21%", percent: 55 },
      { label: "数据缺失", value: "14%", percent: 37 },
    ],
    distribution: [
      { label: "权限等待", percent: 38, tone: "primary" },
      { label: "口径 / 排期", percent: 48, tone: "secondary" },
      { label: "数据缺失", percent: 14, tone: "tertiary" },
    ],
  },
})

function getArtifactContent(session: WorkspaceSession): ArtifactContent {
  const normalizedPrompt = getFirstMessageText(session, "user")

  if (hasKeyword(normalizedPrompt, ["资金", "余额"])) {
    return fundsArtifact
  }

  if (hasKeyword(normalizedPrompt, ["超期", "未闭环"])) {
    return requirementsOverdueArtifact
  }

  if (hasKeyword(normalizedPrompt, ["来源占比", "增长最快"])) {
    return requirementsSourceArtifact
  }

  if (hasKeyword(normalizedPrompt, ["负责人", "待处理"])) {
    return requirementsOwnerArtifact
  }

  if (hasKeyword(normalizedPrompt, ["转化率", "审批", "冻结"])) {
    return budgetConversionArtifact
  }

  if (hasKeyword(normalizedPrompt, ["冻结预算", "未释放", "未消耗"])) {
    return budgetFreezeArtifact
  }

  if (hasKeyword(normalizedPrompt, ["消耗进度", "低于计划"])) {
    return budgetWarningArtifact
  }

  if (hasKeyword(normalizedPrompt, ["SLA", "达成率"])) {
    return executionSlaArtifact
  }

  if (hasKeyword(normalizedPrompt, ["完成率", "阻塞数量"])) {
    return executionCompletionArtifact
  }

  if (hasKeyword(normalizedPrompt, ["阻塞", "归类"])) {
    return executionBlockArtifact
  }

  if (session.projectId === "requirements") {
    return requirementsOverdueArtifact
  }

  if (session.projectId === "budget-funnel") {
    return budgetConversionArtifact
  }

  if (session.projectId === "request-execution") {
    return executionCompletionArtifact
  }

  return fundsArtifact
}

function createArtifact({
  table,
  process,
  ...artifact
}: Omit<ArtifactContent, "table" | "process"> & {
  table: Omit<ArtifactTable, "rows" | "filterFields"> & {
    rows: string[][]
    filterFields?: ArtifactTableFilterField[]
  }
  process?: {
    flow: Array<ArtifactProcessStep | [string, string]>
    rules: Array<ArtifactProcessStep | [string, string]>
    graph?: {
      stages: ArtifactFlowStage[]
      connections: ArtifactFlowConnection[]
    }
    sql: string
  }
}): ArtifactContent {
  const normalizedRows = table.rows.map((row) =>
    Object.fromEntries(
      table.columns.map((column, index) => [column, row[index] ?? ""])
    )
  )

  return {
    ...artifact,
    table: {
      ...table,
      filterFields:
        table.filterFields ??
        createDefaultFilterFields(table.columns, normalizedRows),
      rows: normalizedRows,
    },
    process: {
      flow: (process?.flow ?? createDefaultProcessFlow(artifact.title)).map(
        normalizeProcessStep
      ),
      graph:
        process?.graph ??
        createDefaultProcessGraph(artifact.title, table.columns, table.filters),
      rules: (process?.rules ?? createDefaultProcessRules(table.filters)).map(
        normalizeProcessStep
      ),
      sql:
        process?.sql ??
        createDefaultProcessSql(artifact.title, table.columns, table.filters),
    },
  }
}

function createDefaultProcessFlow(title: string): [string, string][] {
  return [
    ["提取原始数据", `从与“${title}”相关的明细表中取数，并保留本次分析需要的核心字段。`],
    ["按口径聚合整理", "根据当前问题的筛选条件和分组维度完成聚合、去重和排序。"],
    ["输出结果表格", "将可继续追问的结果字段整理成右侧表格，供后续图示和下钻使用。"],
  ]
}

function createDefaultProcessRules(filters: string[]): [string, string][] {
  return [
    ["筛选条件对齐", `优先使用当前结果上的筛选条件：${filters.join("、")}。`],
    ["同口径计算", "所有占比、环比和聚合指标都按统一时间范围与维度口径计算。"],
    ["结果排序输出", "优先展示风险更高、等待更久或指标波动更明显的记录。"],
  ]
}

function createDefaultFilterFields(
  columns: string[],
  rows: Record<string, string>[]
): ArtifactTableFilterField[] {
  const priorityColumns = [
    "需求单ID",
    "预算单号",
    "主体",
    "来源",
    "负责人",
    "部门",
    "渠道",
    "币种",
    "阻塞原因",
    "状态",
    "风险级别",
    "主要类型",
    "当前阶段",
  ]

  const sortedColumns = [
    ...priorityColumns.filter((column) => columns.includes(column)),
    ...columns.filter((column) => !priorityColumns.includes(column)),
  ].slice(0, 4)

  return sortedColumns.map((column, index) => {
    const uniqueValues = Array.from(
      new Set(
        rows
          .map((row) => String(row[column] ?? "").trim())
          .filter(Boolean)
      )
    )
    const shouldUseText =
      index === 0 ||
      /ID|号|标题|名称/.test(column) ||
      uniqueValues.length > 8

    if (shouldUseText) {
      return {
        id: column,
        label: getFilterFieldLabel(column),
        type: "text",
        placeholder: `输入${getFilterFieldLabel(column)}`,
      }
    }

    return {
      id: column,
      label: getFilterFieldLabel(column),
      type: "select",
      placeholder: `全部${getFilterFieldLabel(column)}`,
      options: uniqueValues,
    }
  })
}

function getFilterFieldLabel(column: string) {
  const labelMap: Record<string, string> = {
    需求单ID: "需求单号",
    预算单号: "预算单号",
    主体: "主体",
    来源: "来源",
    负责人: "负责人",
    部门: "部门",
    渠道: "渠道",
    币种: "币种",
    阻塞原因: "阻塞原因",
    状态: "状态",
    风险级别: "风险级别",
    主要类型: "主要类型",
    当前阶段: "当前阶段",
    需求标题: "需求标题",
  }

  return labelMap[column] ?? column
}

function createDefaultProcessGraph(
  title: string,
  columns: string[],
  filters: string[]
): ArtifactProcess["graph"] {
  return {
    stages: [
      {
        id: "source",
        title: "数据来源",
        nodes: [
          {
            id: `${title}-source`,
            title: "原始明细表",
            subtitle: `读取与「${title}」相关的基础记录和核心字段。`,
            tone: "source",
            fields: columns.slice(0, Math.min(4, columns.length)),
          },
        ],
      },
      {
        id: "process",
        title: "处理中间层",
        nodes: [
          {
            id: `${title}-filter`,
            title: "筛选与整理",
            subtitle: "按当前问题口径完成过滤、补充字段和排序。",
            tone: "process",
            fields: filters.slice(0, Math.min(3, filters.length)),
          },
        ],
      },
      {
        id: "result",
        title: "结果输出",
        nodes: [
          {
            id: `${title}-result`,
            title: title,
            subtitle: "整理成可继续追问的明细表和可视化结果。",
            tone: "result",
            fields: columns.slice(0, Math.min(6, columns.length)),
          },
        ],
      },
    ],
    connections: [
      {
        from: "source",
        to: "process",
        labels: ["原始字段读取", "按口径筛选"],
      },
      {
        from: "process",
        to: "result",
        labels: ["字段整理", "结果输出"],
      },
    ],
  }
}

function createDefaultProcessSql(
  title: string,
  columns: string[],
  filters: string[]
) {
  const selectColumns = columns
    .map((column) => `  ${toSqlIdentifier(column)}`)
    .join(",\n")
  const filterComment = filters.length
    ? `-- 当前筛选条件：${filters.join("；")}`
    : "-- 当前筛选条件：按默认口径"

  return [
    `-- ${title}`,
    filterComment,
    "SELECT",
    selectColumns,
    "FROM source_dataset",
    "WHERE ds = CURRENT_DATE",
    "ORDER BY 1 ASC;",
  ].join("\n")
}

function toSqlIdentifier(value: string) {
  return value
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_]/gu, "")
    .toLowerCase()
}

function filterArtifactTableRows(
  rows: Record<string, string>[],
  filters: Record<string, string>,
  filterFields: ArtifactTableFilterField[]
) {
  const normalizedEntries = Object.entries(filters).filter(([, value]) =>
    value.trim()
  )

  if (!normalizedEntries.length) {
    return rows
  }

  return rows.filter((row) =>
    normalizedEntries.every(([fieldId, value]) => {
      const field = filterFields.find((item) => item.id === fieldId)
      const targetColumn = field?.columnId ?? fieldId
      const rowValue = String(row[targetColumn] ?? "").trim().toLowerCase()
      const filterValue = value.trim().toLowerCase()

      if (!filterValue) {
        return true
      }

      if (field?.type === "select") {
        return rowValue === filterValue
      }

      return rowValue.includes(filterValue)
    })
  )
}

function exportArtifactRows(
  filename: string,
  columns: string[],
  rows: Record<string, string>[]
) {
  const worksheetData = [
    columns,
    ...rows.map((row) => columns.map((column) => row[column] ?? "")),
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  worksheet["!cols"] = columns.map((column) => {
    const maxCellLength = rows.reduce((maxLength, row) => {
      return Math.max(maxLength, String(row[column] ?? "").length)
    }, column.length)

    return {
      wch: Math.min(Math.max(maxCellLength + 2, 10), 24),
    }
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "明细表")
  const workbookOutput = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  })
  const blob = new Blob([workbookOutput], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  const safeFilename = filename.replace(/[\\/:*?"<>|]/g, "_")

  anchor.href = url
  anchor.download = safeFilename.endsWith(".xlsx")
    ? safeFilename
    : `${safeFilename}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function buildArtifactVisualSeries(
  rows: Record<string, string>[],
  visual: ArtifactVisual,
  columns: string[]
) {
  const labelColumn = visual.labelColumn ?? columns[0]
  const valueColumn = visual.valueColumn ?? columns[1]

  if (!labelColumn || !valueColumn || !rows.length) {
    return visual.series
  }

  const rawItems = rows
    .map((row) => ({
      label: String(row[labelColumn] ?? "").trim(),
      value: String(row[valueColumn] ?? "").trim(),
      numericValue: parseArtifactNumericValue(row[valueColumn] ?? ""),
    }))
    .filter((item) => item.label && item.value)

  if (!rawItems.length) {
    return visual.series
  }

  const items = visual.aggregateByLabel
    ? Array.from(
        rawItems.reduce((map, item) => {
          const current = map.get(item.label)

          if (current) {
            current.numericValue += item.numericValue
            current.values.push(item.value)
          } else {
            map.set(item.label, {
              label: item.label,
              numericValue: item.numericValue,
              values: [item.value],
            })
          }

          return map
        }, new Map<string, { label: string; numericValue: number; values: string[] }>())
      ).map(([, item]) => ({
        label: item.label,
        value:
          item.values.length === 1
            ? item.values[0]
            : formatAggregatedArtifactValue(item.numericValue, valueColumn),
        numericValue: item.numericValue,
      }))
    : rawItems

  const sortedItems = items
    .sort((left, right) => right.numericValue - left.numericValue)
    .slice(0, 6)
  const maxValue = Math.max(...sortedItems.map((item) => item.numericValue), 1)

  return sortedItems.map((item) => ({
    label: item.label,
    value: item.value,
    percent: Math.max(Math.round((item.numericValue / maxValue) * 100), 8),
  }))
}

function buildArtifactVisualDistribution(
  rows: Record<string, string>[],
  visual: ArtifactVisual,
  columns: string[]
) {
  const categoryColumn =
    visual.distributionColumn ??
    columns.find((column) =>
      ["状态", "风险级别", "来源", "部门", "负责人", "渠道", "当前阶段"].includes(
        column
      )
    )

  if (!categoryColumn || !rows.length) {
    return visual.distribution
  }

  const valueColumn = visual.distributionValueColumn
  const totals = rows.reduce((map, row) => {
    const label = String(row[categoryColumn] ?? "").trim()

    if (!label) {
      return map
    }

    const nextValue = valueColumn
      ? parseArtifactNumericValue(row[valueColumn] ?? "")
      : 1

    map.set(label, (map.get(label) ?? 0) + nextValue)
    return map
  }, new Map<string, number>())

  const entries = Array.from(totals.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)

  if (!entries.length) {
    return visual.distribution
  }

  const totalValue = entries.reduce((sum, [, value]) => sum + value, 0) || 1
  const tones: Array<"primary" | "secondary" | "tertiary"> = [
    "primary",
    "secondary",
    "tertiary",
  ]

  return entries.map(([label, value], index) => ({
    label,
    percent: Math.max(Math.round((value / totalValue) * 100), 1),
    tone: tones[index] ?? "tertiary",
  }))
}

function parseArtifactNumericValue(rawValue: string) {
  const normalized = String(rawValue).replace(/,/g, "").trim()
  const matched = normalized.match(/-?\d+(\.\d+)?/)

  if (!matched) {
    return 0
  }

  let value = Number(matched[0])

  if (normalized.includes("亿")) {
    value *= 10000
  } else if (normalized.includes("万")) {
    value *= 100
  }

  return Number.isFinite(value) ? value : 0
}

function formatAggregatedArtifactValue(value: number, column: string) {
  if (/占比|达成率|完成率|转化率|进度|偏差/.test(column)) {
    return `${Math.round(value)}%`
  }

  if (/等待|时长/.test(column)) {
    return `${value.toFixed(1)} 天`
  }

  if (/金额|余额/.test(column)) {
    return `${(value / 100).toFixed(1)} 万`
  }

  return `${Math.round(value)}`
}

function getFlowToneLabel(tone: ArtifactFlowNode["tone"]) {
  const labels: Record<ArtifactFlowNode["tone"], string> = {
    source: "来源",
    process: "处理",
    aggregate: "聚合",
    result: "输出",
  }

  return labels[tone]
}

function getRuleTagClassName(tag: string) {
  if (
    /P0|P1|priority|current_status|high_priority_count|处理中|待确认|待排期|未闭环/i.test(
      tag
    )
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700"
  }

  if (
    /last_progress_date|created_at|waiting_days|本月|DESC|AVG\(waiting_days\)|天/i.test(
      tag
    )
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  if (/owner_|blocker_|负责人|阻塞|block_flag/i.test(tag)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (/source_|source_type|source_owner|统一归类|归类|分类/i.test(tag)) {
    return "border-cyan-200 bg-cyan-50 text-cyan-700"
  }

  if (/is_test|status\s*!=|未分配/i.test(tag)) {
    return "border-slate-200 bg-slate-50 text-slate-700"
  }

  if (
    />=|>|异常|风险|超期|需关注|排序|未分配优先|block_count\s*>/i.test(
      tag
    )
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  if (/share_rate|mom_change|百分点变化|count|AVG\(/i.test(tag)) {
    return "border-violet-200 bg-violet-50 text-violet-700"
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-700"
}

function getFlowToneCardClass(tone: ArtifactFlowNode["tone"]) {
  const classes: Record<ArtifactFlowNode["tone"], string> = {
    source:
      "border-blue-200 bg-white shadow-[0_0_0_1px_rgba(239,246,255,0.9)_inset]",
    process:
      "border-amber-200 bg-white shadow-[0_0_0_1px_rgba(255,251,235,0.95)_inset]",
    aggregate:
      "border-emerald-200 bg-white shadow-[0_0_0_1px_rgba(236,253,245,0.95)_inset]",
    result:
      "border-rose-200 bg-white shadow-[0_0_0_1px_rgba(255,241,242,0.95)_inset]",
  }

  return classes[tone]
}

function getFlowToneDotClass(tone: ArtifactFlowNode["tone"]) {
  const classes: Record<ArtifactFlowNode["tone"], string> = {
    source: "bg-blue-500",
    process: "bg-amber-500",
    aggregate: "bg-emerald-500",
    result: "bg-rose-500",
  }

  return classes[tone]
}

function getFlowToneStroke(tone: ArtifactFlowNode["tone"]) {
  const colors: Record<ArtifactFlowNode["tone"], string> = {
    source: "rgba(59,130,246,0.88)",
    process: "rgba(245,158,11,0.88)",
    aggregate: "rgba(16,185,129,0.88)",
    result: "rgba(244,63,94,0.9)",
  }

  return colors[tone]
}

function createFlowBoardLayout(
  graph: ArtifactProcess["graph"],
  viewportWidth: number
): FlowBoardLayout {
  const stageCount = graph.stages.length
  const boardPaddingX = 28
  const boardPaddingTop = 92
  const boardPaddingBottom = 48
  const minStageWidth = 240
  const maxStageWidth = 340
  const minStageGap = 28
  const maxStageGap = 52
  const rowGap = 36
  const availableWidth = Math.max(viewportWidth, 1080)
  const usableWidth = availableWidth - boardPaddingX * 2
  const stageWidth = clampNumber(
    (usableWidth - 32 * (stageCount - 1)) / stageCount,
    minStageWidth,
    maxStageWidth
  )
  const stageGap =
    stageCount > 1
      ? clampNumber(
          (usableWidth - stageWidth * stageCount) / (stageCount - 1),
          minStageGap,
          maxStageGap
        )
      : 0
  const naturalWidth =
    boardPaddingX * 2 + stageWidth * stageCount + stageGap * (stageCount - 1)
  const boardWidth = Math.max(availableWidth, naturalWidth)
  const offsetX = Math.max((boardWidth - naturalWidth) / 2, 0)
  const cardWidth = stageWidth - 16
  const stageLabelTop = 58
  const stageLayouts = graph.stages.map((stage) => {
    const nodeHeights = stage.nodes.map((node) => estimateFlowNodeHeight(node))
    const stageContentHeight =
      nodeHeights.reduce((sum, height) => sum + height, 0) +
      rowGap * Math.max(nodeHeights.length - 1, 0)

    return {
      stage,
      nodeHeights,
      stageContentHeight,
    }
  })
  const contentHeight = Math.max(
    ...stageLayouts.map((layout) => layout.stageContentHeight),
    420
  )
  const boardHeight = boardPaddingTop + contentHeight + boardPaddingBottom

  const nodes: FlowBoardNodeLayout[] = stageLayouts.flatMap(
    ({ stage, nodeHeights, stageContentHeight }, stageIndex) => {
      const stageX =
        offsetX + boardPaddingX + stageIndex * (stageWidth + stageGap)
      let currentY =
        boardPaddingTop + Math.max((contentHeight - stageContentHeight) / 2, 0)

      return stage.nodes.map((node, nodeIndex) => {
        const nextNode = {
          ...node,
          stageId: stage.id,
          width: cardWidth,
          height: nodeHeights[nodeIndex],
          x: stageX + (stageWidth - cardWidth) / 2,
          y: currentY,
        }

        currentY += nodeHeights[nodeIndex] + rowGap
        return nextNode
      })
    }
  )

  const stageLabels = graph.stages.map((stage, stageIndex) => {
    return {
      id: stage.id,
      title: stage.title,
      index: stageIndex,
      x:
        offsetX +
        boardPaddingX +
        stageIndex * (stageWidth + stageGap) +
        4,
      y: stageLabelTop,
    }
  })

  const edges = graph.connections.map((connection) => {
    const fromNodes = nodes.filter((node) => node.stageId === connection.from)
    const toNodes = nodes.filter((node) => node.stageId === connection.to)
    const connectionCount = Math.max(fromNodes.length, toNodes.length)

    const paths = Array.from({ length: connectionCount }, (_, index) => {
      const fromNode =
        fromNodes[
          Math.min(
            Math.floor((index / connectionCount) * fromNodes.length),
            fromNodes.length - 1
          )
        ]
      const toNode =
        toNodes[
          Math.min(
            Math.floor((index / connectionCount) * toNodes.length),
            toNodes.length - 1
          )
        ]

      return {
        id: `${connection.from}-${connection.to}-${index}`,
        d: buildFlowCurvePath(
          fromNode.x + fromNode.width,
          fromNode.y + 32,
          toNode.x,
          toNode.y + 32
        ),
        stroke: getFlowToneStroke(toNode.tone),
      }
    })

    const fromStageMidX =
      Math.max(...fromNodes.map((node) => node.x + node.width)) + 18
    const toStageMidX = Math.min(...toNodes.map((node) => node.x)) - 18
    const fromStageMidY =
      average(
        fromNodes.map((node) => node.y + node.height / 2)
      ) ?? boardHeight / 2
    const toStageMidY =
      average(toNodes.map((node) => node.y + node.height / 2)) ?? boardHeight / 2
    const labelWidth = Math.max(connection.labels.length * 112, 240)

    return {
      id: `${connection.from}-${connection.to}`,
      labels: connection.labels,
      labelX: (fromStageMidX + toStageMidX) / 2,
      labelY: (fromStageMidY + toStageMidY) / 2 - 18,
      labelWidth,
      axisPath: buildFlowCurvePath(
        fromStageMidX,
        fromStageMidY,
        toStageMidX,
        toStageMidY
      ),
      paths,
    }
  })

  return {
    width: boardWidth,
    height: boardHeight,
    nodes,
    edges,
    stageLabels,
  }
}

function estimateFlowNodeHeight(node: ArtifactFlowNode) {
  const titleLines = Math.max(Math.ceil(node.title.length / 14), 1)
  const subtitleLines = Math.max(Math.ceil(node.subtitle.length / 22), 2)

  return 64 + titleLines * 10 + subtitleLines * 18
}

function createSelectedFlowNodeSummary(
  selectedNode: FlowBoardNodeLayout,
  graph: ArtifactProcess["graph"]
) {
  const stageIndex = graph.stages.findIndex(
    (stage) => stage.id === selectedNode.stageId
  )
  const stageTitle =
    stageIndex >= 0
      ? `${graph.stages[stageIndex].title} · 阶段 ${stageIndex + 1}`
      : selectedNode.stageId

  const incoming = graph.connections
    .filter((connection) => connection.to === selectedNode.stageId)
    .flatMap((connection) => connection.labels)
  const outgoing = graph.connections
    .filter((connection) => connection.from === selectedNode.stageId)
    .flatMap((connection) => connection.labels)

  return {
    stageTitle,
    incoming,
    outgoing,
  }
}

function buildFlowCurvePath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) {
  const curve = Math.max((toX - fromX) * 0.42, 48)

  return `M ${fromX} ${fromY} C ${fromX + curve} ${fromY}, ${toX - curve} ${toY}, ${toX} ${toY}`
}

function average(values: number[]) {
  if (!values.length) {
    return null
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeProcessStep(
  step: ArtifactProcessStep | [string, string]
): ArtifactProcessStep {
  if (Array.isArray(step)) {
    return { title: step[0], detail: step[1] }
  }

  return step
}

function hasKeyword(text: string, keywords: string[]) {
  return keywords.every((keyword) => text.includes(keyword))
}

function getFirstMessageText(
  session: WorkspaceSession,
  role: "user" | "assistant"
) {
  const message = session.messages.find((item) => item.role === role)

  return getMessageText(message) ?? session.title
}

function getMessageText(message: WorkspaceSession["messages"][number] | undefined) {
  const textPart = message?.parts.find((part) => part.type === "text")
  return textPart?.type === "text" ? textPart.text : undefined
}
