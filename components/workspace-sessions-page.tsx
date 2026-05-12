"use client"

import Link from "next/link"
import { MessageSquareTextIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace-provider"

export function WorkspaceSessionsPage() {
  const { temporarySessions } = useWorkspace()

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">会话</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              尚未保存为项目的临时会话会出现在这里，保存后会移动到“我的数据资产”。
            </p>
          </div>
          <Button render={<Link href="/sessions/new" />}>
            <PlusIcon data-icon="inline-start" />
            新建会话
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {temporarySessions.length ? (
            <div className="divide-y divide-border">
              {temporarySessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.routeSegment}`}
                  className="flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                >
                  <MessageSquareTextIcon className="shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {session.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {getFirstUserText(session.messages) ?? "临时数据查询会话"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              暂无临时会话
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function getFirstUserText(
  messages: { role: string; parts: { type: string }[] }[]
) {
  const textPart = messages
    .find((message) => message.role === "user")
    ?.parts.find(
      (part): part is { type: "text"; text: string } => part.type === "text"
    )

  return textPart?.text
}
