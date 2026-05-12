"use client"

import { usePathname, useRouter } from "next/navigation"
import { Fragment, useState, type ReactNode } from "react"

import { AppSidebar } from "@/components/app-sidebar"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { appRoutes, getRouteByPath } from "@/lib/navigation"
import type { WorkspaceSession } from "@/lib/workspace-mock"
import {
  ChevronRightIcon,
  EllipsisIcon,
  FileTextIcon,
  MoreHorizontalIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  SaveIcon,
} from "lucide-react"

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
  const { saveTemporarySession } = useWorkspace()

  function handleSaveTemporarySession() {
    const savedSession = saveTemporarySession(session.id)

    if (savedSession?.projectId) {
      router.push(
        `/assets/my/${savedSession.projectId}/${savedSession.routeSegment}`
      )
    }
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
        <Tooltip>
          <TooltipTrigger
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
          </TooltipTrigger>
          <TooltipContent>Artifacts 操作</TooltipContent>
        </Tooltip>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {session.isTemporary ? "临时会话" : "数据资产会话"}
            </p>
            <h3 className="mt-1 truncate text-xl font-semibold tracking-normal">
              {session.title}
            </h3>
          </div>

          <section className="overflow-hidden rounded-lg border border-border bg-background">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>主体</TableHead>
                  <TableHead>币种</TableHead>
                  <TableHead className="text-right">可用</TableHead>
                  <TableHead className="text-right">冻结</TableHead>
                  <TableHead className="text-right">日环比</TableHead>
                  <TableHead>更新</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {artifactTableRows.map((row) => (
                  <TableRow key={row.entity}>
                    <TableCell className="font-medium">{row.entity}</TableCell>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell className="text-right">
                      {row.available}
                    </TableCell>
                    <TableCell className="text-right">{row.frozen}</TableCell>
                    <TableCell className="text-right">{row.change}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.updatedAt}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
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
      <span className="truncate text-sm font-normal text-muted-foreground">
        {parentTitle}
      </span>
      <ChevronRightIcon className="size-3 shrink-0 text-muted-foreground" />
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

  return undefined
}

function decodePathSegment(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

const artifactTableRows = [
  {
    entity: "主体 A",
    currency: "CNY",
    available: "1284.0 万",
    frozen: "32.0 万",
    change: "+2.4%",
    updatedAt: "10:30",
  },
  {
    entity: "主体 B",
    currency: "USD",
    available: "192.5 万",
    frozen: "8.0 万",
    change: "-0.8%",
    updatedAt: "10:28",
  },
  {
    entity: "主体 C",
    currency: "CNY",
    available: "851.2 万",
    frozen: "0.00",
    change: "+0.6%",
    updatedAt: "10:25",
  },
  {
    entity: "主体 D",
    currency: "HKD",
    available: "324.1 万",
    frozen: "12.0 万",
    change: "-1.1%",
    updatedAt: "10:21",
  },
]
