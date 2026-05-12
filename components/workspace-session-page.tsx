"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

import {
  AssistantThinking,
  ChatMessage,
  Composer,
  defaultModelId,
  promptSuggestions,
} from "@/components/chat-elements"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace-provider"
import { getPendingSessionPromptKey } from "@/lib/pending-session-prompt"
import { cn } from "@/lib/utils"

export function WorkspaceSessionPage({
  projectId,
  sessionId,
}: {
  projectId?: string
  sessionId: string
}) {
  const { getProject, getSessionByRoute, isHydrated, updateSessionMessages } =
    useWorkspace()
  const session = getSessionByRoute(sessionId, projectId)
  const activeSessionId = session?.id
  const activeSessionMessages = session?.messages
  const project = session?.projectId ? getProject(session.projectId) : undefined
  const [input, setInput] = useState("")
  const [visibleError, setVisibleError] = useState<string | null>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const persistedMessagesRef = useRef("")
  const pendingPromptSessionRef = useRef<string | null>(null)
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  )

  const {
    clearError,
    error,
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat({
    id: session?.id ?? `${projectId ?? "session"}-${sessionId}`,
    messages: session?.messages ?? [],
    transport,
    experimental_throttle: 40,
    onFinish: ({ messages: finishedMessages }) => {
      if (session) {
        updateSessionMessages(session.id, finishedMessages)
      }
    },
    onError: (chatError) => setVisibleError(chatError.message),
  })

  const isBusy = status === "submitted" || status === "streaming"
  const hasMessages = messages.length > 0
  const trimmedInput = input.trim()
  const currentError = visibleError ?? error?.message ?? null

  useEffect(() => {
    if (!activeSessionId || !activeSessionMessages) {
      return
    }

    const signature = JSON.stringify(activeSessionMessages)

    if (signature === persistedMessagesRef.current) {
      return
    }

    persistedMessagesRef.current = signature
    setMessages(activeSessionMessages)
  }, [activeSessionId, activeSessionMessages, setMessages])

  useEffect(() => {
    const scrollContainer = messagesRef.current

    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [messages, status])

  useEffect(() => {
    if (!activeSessionId || !messages.length) {
      return
    }

    const signature = JSON.stringify(messages)

    if (signature === persistedMessagesRef.current) {
      return
    }

    persistedMessagesRef.current = signature
    updateSessionMessages(activeSessionId, messages)
  }, [activeSessionId, messages, updateSessionMessages])

  useEffect(() => {
    if (
      !activeSessionId ||
      activeSessionMessages?.length ||
      pendingPromptSessionRef.current === activeSessionId ||
      isBusy
    ) {
      return
    }

    const pendingPromptKey = getPendingSessionPromptKey(activeSessionId)
    const pendingPrompt = window.sessionStorage
      .getItem(pendingPromptKey)
      ?.trim()

    if (!pendingPrompt) {
      return
    }

    pendingPromptSessionRef.current = activeSessionId
    window.sessionStorage.removeItem(pendingPromptKey)
    clearError()

    void sendMessage(
      { text: pendingPrompt },
      {
        body: {
          modelId: defaultModelId,
          sessionId: activeSessionId,
        },
      }
    )
  }, [
    activeSessionId,
    activeSessionMessages?.length,
    clearError,
    isBusy,
    sendMessage,
  ])

  if (!session) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center">
        <div className="flex max-w-md flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-semibold">
            {isHydrated ? "会话不存在" : "正在加载会话"}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {isHydrated
              ? "这个会话可能已经被移动、保存或删除。"
              : "正在读取本地 workspace 状态。"}
          </p>
        </div>
      </section>
    )
  }

  const currentSession = session

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!trimmedInput || isBusy) {
      return
    }

    const prompt = trimmedInput
    setInput("")
    setVisibleError(null)
    clearError()

    await sendMessage(
      { text: prompt },
      {
        body: {
          modelId: defaultModelId,
          sessionId: currentSession.id,
        },
      }
    )
  }

  async function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  function applySuggestion(suggestion: string) {
    setInput(suggestion)
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div
        ref={messagesRef}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto px-2",
          hasMessages ? "py-4" : "flex items-center justify-center"
        )}
      >
        {hasMessages ? (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {status === "submitted" ? <AssistantThinking /> : null}
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 pb-10">
            <div className="flex flex-col gap-2 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {project?.title ?? "数据查询"}
              </p>
              <h2 className="text-2xl font-semibold tracking-normal">
                新建会话
              </h2>
            </div>
            <Composer
              input={input}
              isBusy={isBusy}
              visibleError={currentError}
              placeholder="在当前数据资产下继续发起查询、统计或摘要任务。"
              onInputChange={setInput}
              onKeyDown={handleComposerKeyDown}
              onSubmit={handleSubmit}
              onStop={stop}
            />
            <div className="flex flex-wrap items-center justify-center gap-2 px-3">
              {promptSuggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applySuggestion(suggestion)}
                  className="max-w-full"
                >
                  <span className="truncate">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {hasMessages ? (
        <div className="bg-background/95 px-2 py-4 backdrop-blur">
          <div className="mx-auto w-full max-w-4xl">
            <Composer
              compact
              input={input}
              isBusy={isBusy}
              visibleError={currentError}
              onInputChange={setInput}
              onKeyDown={handleComposerKeyDown}
              onSubmit={handleSubmit}
              onStop={stop}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
