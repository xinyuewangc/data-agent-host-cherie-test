"use client"

import { useMemo, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { UIMessage } from "ai"
import {
  ArrowRightIcon,
  FolderIcon,
  MessageSquareIcon,
  SearchIcon,
} from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useWorkspace } from "@/components/workspace-provider"

type SearchResult = {
  id: string
  title: string
  description: string
  href: string
  searchText: string
}

export function WorkspaceSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { getSession, projects, temporarySessions } = useWorkspace()
  const [query, setQuery] = useState("")
  const normalizedQuery = normalizeSearchText(query)

  const projectResults = useMemo<SearchResult[]>(
    () =>
      projects.flatMap((project) => {
        const primarySession = project.sessionIds
          .map((sessionId) => getSession(sessionId))
          .find(Boolean)

        if (!primarySession) {
          return []
        }

        const title = primarySession.title || project.title

        return [
          {
            id: project.id,
            title,
            description: project.title,
            href: `/assets/my/${project.id}/${primarySession.routeSegment}`,
            searchText: normalizeSearchText(
              [title, project.title, project.description].join(" ")
            ),
          },
        ]
      }),
    [getSession, projects]
  )

  const sessionResults = useMemo<SearchResult[]>(
    () =>
      temporarySessions.map((session) => ({
        id: session.id,
        title: session.title,
        description: getSessionPreview(session.messages),
        href: `/sessions/${session.routeSegment}`,
        searchText: normalizeSearchText(
          [session.title, getSearchableMessageText(session.messages)].join(" ")
        ),
      })),
    [temporarySessions]
  )

  const filteredProjectResults = filterResults(projectResults, normalizedQuery)
  const filteredSessionResults = filterResults(sessionResults, normalizedQuery)
  const hasResults =
    filteredProjectResults.length > 0 || filteredSessionResults.length > 0

  function handleSelect(href: string) {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)

        if (isOpen) {
          setQuery("")
          window.requestAnimationFrame(() => inputRef.current?.focus())
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-24 max-h-[calc(100svh-4rem)] translate-y-0 overflow-hidden rounded-xl p-0 sm:max-h-[720px] sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">搜索</DialogTitle>
        <div className="border-b border-border p-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索数据资产或临时会话..."
              className="h-10 rounded-lg pl-9 text-sm"
            />
          </div>
        </div>
        <div className="max-h-[calc(100svh-9rem)] overflow-y-auto p-3 sm:max-h-[655px]">
          {hasResults ? (
            <div className="space-y-5">
              <SearchGroup
                title="我的数据资产"
                icon={<FolderIcon />}
                results={filteredProjectResults}
                onSelect={handleSelect}
              />
              <SearchGroup
                title="临时会话"
                icon={<MessageSquareIcon />}
                results={filteredSessionResults}
                onSelect={handleSelect}
              />
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              暂无匹配结果
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SearchGroup({
  icon,
  onSelect,
  results,
  title,
}: {
  icon: ReactNode
  onSelect: (href: string) => void
  results: SearchResult[]
  title: string
}) {
  if (!results.length) {
    return null
  }

  return (
    <section>
      <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1">
        {results.map((result) => (
          <button
            key={result.id}
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors outline-none hover:bg-muted focus-visible:bg-muted"
            onClick={() => onSelect(result.href)}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground [&_svg]:size-4">
              {icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {result.title}
              </span>
              {result.description ? (
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {result.description}
                </span>
              ) : null}
            </span>
            <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </section>
  )
}

function filterResults(results: SearchResult[], query: string) {
  if (!query) {
    return results
  }

  return results.filter((result) => result.searchText.includes(query))
}

function normalizeSearchText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase()
}

function getSessionPreview(messages: UIMessage[]) {
  const preview = messages
    .map(getMessageText)
    .find((text) => text.trim().length > 0)

  return preview ? preview.slice(0, 48) : "临时会话"
}

function getSearchableMessageText(messages: UIMessage[]) {
  return messages.map(getMessageText).join(" ")
}

function getMessageText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
}
