"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon, MessageSquarePlusIcon } from "lucide-react"

type NavItem = {
  title: string
  url?: string
  icon?: ReactNode
  collapsedIcon?: ReactNode
  actionType?: "project" | "session"
  isActive?: boolean
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
    icon?: ReactNode
    isActive?: boolean
    showAction?: boolean
    onSave?: () => void
    onToggleMcp?: () => void
    onRename?: () => void
    onDelete?: () => void
    mcpActionLabel?: string
  }[]
}

type NavSection = {
  title?: string
  collapsible?: boolean
  defaultOpen?: boolean
  items: NavItem[]
}

export function NavMain({
  sections,
  actionIcon,
}: {
  sections: NavSection[]
  actionIcon?: ReactNode
}) {
  return (
    <>
      {sections.map((section, index) =>
        section.collapsible ? (
          <Collapsible
            key={section.title}
            defaultOpen={section.defaultOpen ?? true}
            className="group/collapsible"
            render={<SidebarGroup />}
          >
            <CollapsibleTrigger
              nativeButton={false}
              render={
                <SidebarGroupLabel className="cursor-pointer justify-between text-sidebar-foreground/60" />
              }
            >
              <span>{section.title}</span>
              <ChevronRightIcon className="transition-transform duration-200 group-data-open/collapsible:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <NavMenuItem
                    key={item.url ?? item.title}
                    item={item}
                    actionIcon={actionIcon}
                  />
                ))}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <SidebarGroup key={section.title ?? `section-${index}`}>
            {section.title ? (
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            ) : null}
            <SidebarMenu>
              {section.items.map((item) => (
                <NavMenuItem
                  key={item.url ?? item.title}
                  item={item}
                  actionIcon={actionIcon}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )
      )}
    </>
  )
}

function NavMenuItem({
  item,
  actionIcon,
}: {
  item: NavItem
  actionIcon?: ReactNode
}) {
  const hasSubItems = Boolean(item.items?.length)
  const usesProjectActions = item.actionType === "project"
  const menuButton = (
    <SidebarMenuButton
      tooltip={item.title}
      isActive={item.isActive}
      onClick={item.onSelect}
      render={
        item.onSelect ? (
          <button type="button" />
        ) : (
          <Link href={item.url ?? "#"} />
        )
      }
    >
      {item.icon}
      <span>{item.title}</span>
    </SidebarMenuButton>
  )

  if (hasSubItems) {
    return (
      <Collapsible
        defaultOpen
        className="group/project"
        render={<SidebarMenuItem />}
      >
        <CollapsibleTrigger
          render={
            <SidebarMenuButton
              tooltip={item.title}
              isActive={item.isActive}
              className={
                item.showAction && item.onNewSession ? "pr-12" : undefined
              }
            />
          }
        >
          {item.collapsedIcon ? (
            <>
              <span className="group-data-open/project:hidden">
                {item.collapsedIcon}
              </span>
              <span className="hidden group-data-open/project:inline-flex">
                {item.icon}
              </span>
            </>
          ) : (
            item.icon
          )}
          <span>{item.title}</span>
        </CollapsibleTrigger>
        {item.showAction ? (
          <ProjectActions
            itemTitle={item.title}
            actionIcon={actionIcon}
            onNewSession={item.onNewSession}
            onRename={item.onRename}
            onDelete={item.onDelete}
          />
        ) : null}
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.url}>
                <SidebarMenuSubButton
                  isActive={subItem.isActive}
                  className={subItem.showAction ? "pr-8" : undefined}
                  render={<Link href={subItem.url} />}
                >
                  {subItem.icon}
                  <span>{subItem.title}</span>
                </SidebarMenuSubButton>
                {subItem.showAction ? (
                  <SessionActions
                    isSubItem
                    itemTitle={subItem.title}
                    actionIcon={actionIcon}
                    onSave={subItem.onSave}
                    onRename={subItem.onRename}
                    onDelete={subItem.onDelete}
                  />
                ) : null}
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <SidebarMenuItem>
      {menuButton}
      {item.showAction ? (
        usesProjectActions ? (
          <ProjectActions
            itemTitle={item.title}
            actionIcon={actionIcon}
            onNewSession={item.onNewSession}
            onToggleMcp={item.onToggleMcp}
            onRename={item.onRename}
            onDelete={item.onDelete}
            mcpActionLabel={item.mcpActionLabel}
          />
        ) : (
          <SessionActions
            itemTitle={item.title}
            actionIcon={actionIcon}
            onSave={item.onSave}
            onRename={item.onRename}
            onDelete={item.onDelete}
          />
        )
      ) : null}
    </SidebarMenuItem>
  )
}

function SessionActions({
  itemTitle,
  actionIcon,
  isSubItem = false,
  onDelete,
  onRename,
  onSave,
}: {
  itemTitle: string
  actionIcon?: ReactNode
  isSubItem?: boolean
  onDelete?: () => void
  onRename?: () => void
  onSave?: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuAction
            aria-label={`${itemTitle} 更多操作`}
            className={
              isSubItem
                ? "top-1 right-1 z-10 opacity-0 group-hover/menu-sub-item:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
                : "opacity-0 peer-hover/menu-button:opacity-100 hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
            }
          />
        }
      >
        {actionIcon}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-36">
        <DropdownMenuGroup>
          {onSave ? (
            <DropdownMenuItem onClick={onSave}>保存为数据资产</DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={onRename}>重命名</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            删除
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ProjectActions({
  itemTitle,
  actionIcon,
  onNewSession,
  onRename,
  onDelete,
  onToggleMcp,
  mcpActionLabel = "发布MCP",
}: {
  itemTitle: string
  actionIcon?: ReactNode
  onNewSession?: () => void
  onRename?: () => void
  onDelete?: () => void
  onToggleMcp?: () => void
  mcpActionLabel?: string
}) {
  return (
    <div className="absolute top-1.5 right-1 z-10 flex items-center gap-1 opacity-0 transition-opacity group-has-[>[data-sidebar=menu-button]:hover]/menu-item:opacity-100 group-data-[collapsible=icon]:hidden peer-hover/menu-button:opacity-100 focus-within:opacity-100 hover:opacity-100">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuAction
              aria-label={`${itemTitle} 更多操作`}
              className="static opacity-100"
            />
          }
        >
          {actionIcon}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-32">
          <DropdownMenuGroup>
            {onToggleMcp ? (
              <DropdownMenuItem onClick={onToggleMcp}>
                {mcpActionLabel}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={onRename}>重命名</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              删除
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {onNewSession ? (
        <SidebarMenuAction
          aria-label={`${itemTitle} 新建会话`}
          className="static opacity-100"
          onClick={onNewSession}
        >
          <MessageSquarePlusIcon />
        </SidebarMenuAction>
      ) : null}
    </div>
  )
}
