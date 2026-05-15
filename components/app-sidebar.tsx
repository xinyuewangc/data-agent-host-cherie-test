"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { WorkspaceSearchDialog } from "@/components/workspace-search-dialog"
import {
  ConfirmActionDialog,
  DeleteActionDialog,
  RenameActionDialog,
  type ConfirmAction,
  type DeleteAction,
  type RenameAction,
} from "@/components/workspace-action-dialogs"
import { useWorkspace } from "@/components/workspace-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { appRoutes } from "@/lib/navigation"
import { createDataAssetTitle } from "@/lib/workspace-title"
import {
  EllipsisIcon,
  FolderIcon,
  FolderSymlinkIcon,
  GalleryVerticalEndIcon,
  HardDriveIcon,
  MessageSquarePlusIcon,
  PlugIcon,
  SearchIcon,
  WrenchIcon,
} from "lucide-react"

type SidebarNavItem = {
  title: string
  url?: string
  icon?: React.ReactNode
  collapsedIcon?: React.ReactNode
  actionType?: "project" | "session"
  showAction?: boolean
  onNewSession?: () => void
  onSelect?: () => void
  onSave?: () => void
  onToggleMcp?: () => void
  onRename?: () => void
  onDelete?: () => void
  mcpActionLabel?: string
  items?: {
    title: string
    url: string
    icon?: React.ReactNode
    showAction?: boolean
    onSave?: () => void
    onToggleMcp?: () => void
    onRename?: () => void
    onDelete?: () => void
    mcpActionLabel?: string
  }[]
}

type SidebarNavSection = {
  title?: string
  collapsible?: boolean
  items: SidebarNavItem[]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const {
    deleteProject,
    deleteSession,
    getSession,
    projects,
    renameProject,
    renameSession,
    saveTemporarySession,
    setProjectMcpSharing,
    temporarySessions,
  } = useWorkspace()
  const [renameAction, setRenameAction] = React.useState<RenameAction | null>(
    null
  )
  const [deleteAction, setDeleteAction] = React.useState<DeleteAction | null>(
    null
  )
  const [confirmAction, setConfirmAction] =
    React.useState<ConfirmAction | null>(null)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const decodedPathname = decodePathname(pathname)
  const navSections = React.useMemo<SidebarNavSection[]>(
    () => [
      {
        items: [
          {
            title: appRoutes.newSession.title,
            url: appRoutes.newSession.path,
            icon: <MessageSquarePlusIcon />,
          },
          {
            title: appRoutes.search.title,
            icon: <SearchIcon />,
            onSelect: () => setIsSearchOpen(true),
          },
          {
            title: appRoutes.officialAssets.title,
            url: appRoutes.officialAssets.path,
            icon: <HardDriveIcon />,
          },
        ],
      },
      {
        title: "我的数据资产",
        collapsible: true,
        items: projects.map((project) => {
          const primarySession = project.sessionIds
            .map((sessionId) => getSession(sessionId))
            .find(Boolean)
          const itemTitle = primarySession?.title ?? project.title

          return {
            title: itemTitle,
            url: primarySession
              ? `/assets/my/${project.id}/${primarySession.routeSegment}`
              : `/assets/my/${project.id}`,
            icon: project.isMcpShared ? <FolderSymlinkIcon /> : <FolderIcon />,
            actionType: "project",
            showAction: true,
            mcpActionLabel: project.isMcpShared ? "取消MCP分享" : "发布MCP",
            onToggleMcp: () => {
              setConfirmAction({
                title: project.isMcpShared ? "取消MCP分享" : "发布MCP",
                description: project.isMcpShared
                  ? `确定要取消“${itemTitle}”的 MCP 分享吗？`
                  : `确定要将“${itemTitle}”发布为 MCP 吗？`,
                confirmLabel: project.isMcpShared ? "取消分享" : "发布",
                onConfirm: () => {
                  setProjectMcpSharing(project.id, !project.isMcpShared)
                },
              })
            },
            onRename: () => {
              setRenameAction({
                title: "重命名数据资产",
                description:
                  "更新后，侧边栏和当前数据资产标题会同步使用新名称。",
                defaultValue: itemTitle,
                placeholder: "输入数据资产名称",
                onConfirm: (nextTitle) => {
                  renameProject(project.id, nextTitle)

                  if (primarySession) {
                    renameSession(primarySession.id, nextTitle)
                  }
                },
              })
            },
            onDelete: () => {
              setDeleteAction({
                title: "删除数据资产",
                description: `确定要删除“${itemTitle}”吗？相关会话也会从侧边栏移除。`,
                onConfirm: () => {
                  deleteProject(project.id)
                  router.replace(appRoutes.newSession.path)
                },
              })
            },
          }
        }),
      },
      {
        title: "临时会话",
        collapsible: true,
        items: temporarySessions.map((session) => {
          const sessionUrl = `/sessions/${session.routeSegment}`

          return {
            title: session.title,
            url: sessionUrl,
            showAction: true,
            onSave: () => {
              setRenameAction({
                title: "保存为数据资产",
                label: null,
                defaultValue: createDataAssetTitle(session.title),
                placeholder: "输入数据资产名称",
                onConfirm: (title) => {
                  const savedSession = saveTemporarySession(session.id, {
                    title,
                  })

                  if (savedSession?.projectId) {
                    router.push(
                      `/assets/my/${savedSession.projectId}/${savedSession.routeSegment}`
                    )
                  }
                },
              })
            },
            onRename: () => {
              setRenameAction({
                title: "重命名会话",
                description: "更新后，顶部标题和侧边栏会同步使用新名称。",
                defaultValue: session.title,
                placeholder: "输入会话名称",
                onConfirm: (nextTitle) => {
                  renameSession(session.id, nextTitle)
                },
              })
            },
            onDelete: () => {
              setDeleteAction({
                title: "删除会话",
                description: `确定要删除“${session.title}”吗？此操作会将它从临时会话列表中移除。`,
                onConfirm: () => {
                  deleteSession(session.id)
                  router.replace(appRoutes.newSession.path)
                },
              })
            },
          }
        }),
      },
      {
        title: "配置调试",
        items: [
          {
            title: appRoutes.mcp.title,
            url: appRoutes.mcp.path,
            icon: <PlugIcon />,
          },
          {
            title: appRoutes.skills.title,
            url: appRoutes.skills.path,
            icon: <WrenchIcon />,
          },
        ],
      },
    ],
    [
      deleteProject,
      deleteSession,
      getSession,
      projects,
      renameProject,
      renameSession,
      router,
      saveTemporarySession,
      setProjectMcpSharing,
      temporarySessions,
    ]
  )
  const sections = navSections.map((section) => ({
    ...section,
    defaultOpen: section.collapsible ? true : undefined,
    items: section.items.map((item) => {
      const subItems = item.items?.map((subItem) => ({
        ...subItem,
        isActive: decodedPathname === subItem.url,
      }))

      return {
        ...item,
        isActive: decodedPathname === item.url,
        items: subItems,
      }
    }),
  }))
  const fixedTopSections = sections.slice(0, 1)
  const scrollableSections = sections.slice(1, 3)
  const fixedBottomSections = sections.slice(3)

  return (
    <>
      <Sidebar variant="inset" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip="数据查询中心"
                render={<Link href={appRoutes.newSession.path} />}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEndIcon />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">数据查询中心</span>
                  <span className="truncate text-xs">Agent Host</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <div className="shrink-0">
          <NavMain sections={fixedTopSections} actionIcon={<EllipsisIcon />} />
        </div>
        <SidebarContent className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <NavMain
            sections={scrollableSections}
            actionIcon={<EllipsisIcon />}
          />
        </SidebarContent>
        <SidebarFooter className="shrink-0 gap-0 p-0">
          <NavMain
            sections={fixedBottomSections}
            actionIcon={<EllipsisIcon />}
          />
        </SidebarFooter>
      </Sidebar>
      <RenameActionDialog
        action={renameAction}
        onOpenChange={(isOpen) => !isOpen && setRenameAction(null)}
      />
      <DeleteActionDialog
        action={deleteAction}
        onOpenChange={(isOpen) => !isOpen && setDeleteAction(null)}
      />
      <ConfirmActionDialog
        action={confirmAction}
        onOpenChange={(isOpen) => !isOpen && setConfirmAction(null)}
      />
      <WorkspaceSearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
      />
    </>
  )
}

function decodePathname(pathname: string) {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}
