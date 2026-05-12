"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FolderOpenIcon, MessageSquareTextIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace-provider"

export function WorkspaceProjectPage({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { createProjectSession, getProject, getSession, isHydrated } =
    useWorkspace()
  const project = getProject(projectId)

  if (!project) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center">
        <div className="flex max-w-md flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-semibold">
            {isHydrated ? "项目不存在" : "正在加载项目"}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {isHydrated
              ? "这个项目可能已经被删除，或当前 workspace 状态尚未包含它。"
              : "正在读取本地 workspace 状态。"}
          </p>
        </div>
      </section>
    )
  }

  const currentProject = project
  const sessions = currentProject.sessionIds
    .map((sessionId) => getSession(sessionId))
    .filter((session): session is NonNullable<typeof session> =>
      Boolean(session)
    )

  function handleCreateSession() {
    const session = createProjectSession(currentProject.id)

    if (session) {
      router.push(`/assets/my/${currentProject.id}/${session.routeSegment}`)
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FolderOpenIcon />
              我的数据资产
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {currentProject.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {currentProject.description}
              </p>
            </div>
          </div>
          <Button type="button" onClick={handleCreateSession}>
            <PlusIcon data-icon="inline-start" />
            新建会话
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium">项目会话</h2>
          </div>
          <div className="divide-y divide-border">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/assets/my/${currentProject.id}/${session.routeSegment}`}
                className="flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
              >
                <MessageSquareTextIcon className="shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {session.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {session.messages.length
                      ? (getFirstUserText(session.messages) ??
                        "已有数据查询上下文")
                      : "空白会话"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function WorkspaceProjectsPage() {
  const { projects } = useWorkspace()

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            我的数据资产
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            保存后的项目会以 folder
            的形式出现在这里，每个项目可以继续沉淀多个查询会话。
          </p>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="divide-y divide-border">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/assets/my/${project.id}`}
                className="flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
              >
                <FolderOpenIcon className="shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {project.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {project.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
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
