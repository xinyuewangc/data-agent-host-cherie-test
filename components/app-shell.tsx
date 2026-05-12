"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Fragment, type ReactNode } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import {
  WorkspaceProvider,
  useWorkspace,
} from "@/components/workspace-provider"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
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
import { appRoutes, getRouteByPath } from "@/lib/navigation"
import type { WorkspaceSession } from "@/lib/workspace-mock"
import { ChevronRightIcon, EllipsisIcon, SaveIcon } from "lucide-react"

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

  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <AppSidebar />
      <SidebarInset className="min-h-0 overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 px-4">
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
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink
                      render={<Link href={appRoutes.newSession.path} />}
                    >
                      数据中心
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {route.breadcrumbs.map((item, index) => {
                    const isLast = index === route.breadcrumbs.length - 1

                    return (
                      <Fragment key={`${item}-${index}`}>
                        <BreadcrumbSeparator className="hidden md:block" />
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
          {currentSession?.isTemporary ? (
            <TemporarySessionHeaderActions session={currentSession} />
          ) : null}
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function TemporarySessionHeaderActions({
  session,
}: {
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
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0"
      onClick={handleSaveTemporarySession}
    >
      <SaveIcon data-icon="inline-start" />
      保存为数据资产
    </Button>
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
    const nextPath = session.projectId
      ? `/assets/my/${session.projectId}`
      : "/sessions"

    deleteSession(session.id)
    router.push(nextPath)
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
