"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { NavMain } from "@/components/nav-main"
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
import {
  EllipsisIcon,
  FolderIcon,
  FolderOpenIcon,
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
  showAction?: boolean
  onNewSession?: () => void
  onRename?: () => void
  onDelete?: () => void
  items?: {
    title: string
    url: string
    icon?: React.ReactNode
    showAction?: boolean
    onRename?: () => void
    onDelete?: () => void
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
    createProjectSession,
    deleteProject,
    deleteSession,
    getSession,
    projects,
    renameProject,
    renameSession,
    temporarySessions,
  } = useWorkspace()
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
            url: appRoutes.search.path,
            icon: <SearchIcon />,
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
        items: projects.map((project) => ({
          title: project.title,
          url: `/assets/my/${project.id}`,
          icon: <FolderOpenIcon />,
          collapsedIcon: <FolderIcon />,
          showAction: true,
          onNewSession: () => {
            const session = createProjectSession(project.id)

            if (session) {
              router.push(`/assets/my/${project.id}/${session.routeSegment}`)
            }
          },
          onRename: () => {
            const nextTitle = window.prompt("重命名数据资产", project.title)

            if (nextTitle !== null) {
              renameProject(project.id, nextTitle)
            }
          },
          onDelete: () => {
            deleteProject(project.id)
            router.replace(appRoutes.newSession.path)
          },
          items: project.sessionIds
            .map((sessionId) => getSession(sessionId))
            .filter((session): session is NonNullable<typeof session> =>
              Boolean(session)
            )
            .map((session) => {
              const sessionUrl = `/assets/my/${project.id}/${session.routeSegment}`

              return {
                title: session.title,
                url: sessionUrl,
                showAction: true,
                onRename: () => {
                  const nextTitle = window.prompt("重命名会话", session.title)

                  if (nextTitle !== null) {
                    renameSession(session.id, nextTitle)
                  }
                },
                onDelete: () => {
                  deleteSession(session.id)
                  router.replace(appRoutes.newSession.path)
                },
              }
            }),
        })),
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
            onRename: () => {
              const nextTitle = window.prompt("重命名会话", session.title)

              if (nextTitle !== null) {
                renameSession(session.id, nextTitle)
              }
            },
            onDelete: () => {
              deleteSession(session.id)
              router.replace(appRoutes.newSession.path)
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
      createProjectSession,
      deleteProject,
      deleteSession,
      getSession,
      projects,
      renameProject,
      renameSession,
      router,
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
        <NavMain sections={scrollableSections} actionIcon={<EllipsisIcon />} />
      </SidebarContent>
      <SidebarFooter className="shrink-0 gap-0 p-0">
        <NavMain sections={fixedBottomSections} actionIcon={<EllipsisIcon />} />
      </SidebarFooter>
    </Sidebar>
  )
}

function decodePathname(pathname: string) {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}
