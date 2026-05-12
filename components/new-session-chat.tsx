"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useRouter } from "next/navigation"
import { RotateCcwIcon } from "lucide-react"

import {
  AssistantThinking,
  ChatMessage,
  Composer,
  createSessionId,
  defaultModelId,
  promptSuggestions,
} from "@/components/chat-elements"
import { useWorkspace } from "@/components/workspace-provider"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function NewSessionChat() {
  const router = useRouter()
  const { ensureTemporarySession, updateSessionMessages } = useWorkspace()
  const [input, setInput] = useState("")
  const [sessionId, setSessionId] = useState(() => createSessionId())
  const [visibleError, setVisibleError] = useState<string | null>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const workspaceSessionIdRef = useRef<string | null>(null)
  const persistedMessagesRef = useRef("")
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
    id: sessionId,
    transport,
    experimental_throttle: 40,
    onFinish: ({ isAbort, isError, messages: finishedMessages }) => {
      updateSessionMessages(sessionId, finishedMessages)

      if (!isAbort && !isError) {
        router.replace(`/sessions/${sessionId}`)
      }
    },
    onError: (chatError) => setVisibleError(chatError.message),
  })

  const isBusy = status === "submitted" || status === "streaming"
  const hasMessages = messages.length > 0
  const trimmedInput = input.trim()
  const currentError = visibleError ?? error?.message ?? null

  useEffect(() => {
    const scrollContainer = messagesRef.current

    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [messages, status])

  useEffect(() => {
    if (!messages.length || workspaceSessionIdRef.current !== sessionId) {
      return
    }

    const signature = JSON.stringify(messages)

    if (signature === persistedMessagesRef.current) {
      return
    }

    persistedMessagesRef.current = signature
    updateSessionMessages(sessionId, messages)
  }, [messages, sessionId, updateSessionMessages])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!trimmedInput || isBusy) {
      return
    }

    const prompt = trimmedInput
    setInput("")
    setVisibleError(null)
    clearError()
    ensureTemporarySession({ id: sessionId, prompt })
    workspaceSessionIdRef.current = sessionId

    await sendMessage(
      { text: prompt },
      {
        body: {
          modelId: defaultModelId,
          sessionId,
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

  async function handleNewSession() {
    if (isBusy) {
      await stop()
    }

    setInput("")
    setMessages([])
    setVisibleError(null)
    clearError()
    persistedMessagesRef.current = ""
    workspaceSessionIdRef.current = null
    setSessionId(createSessionId())
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
          hasMessages ? "py-6" : "flex items-center justify-center"
        )}
      >
        {hasMessages ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  Data Agent
                </p>
                <h1 className="truncate text-xl font-semibold">
                  新建 Agent 会话
                </h1>
              </div>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleNewSession}
                    />
                  }
                >
                  <RotateCcwIcon data-icon="inline-start" />
                  新会话
                </TooltipTrigger>
                <TooltipContent>清空当前会话并重新开始</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex flex-col gap-5">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {status === "submitted" ? <AssistantThinking /> : null}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 pb-10">
            <h1 className="text-center text-4xl font-semibold tracking-normal text-balance md:text-5xl">
              miHoQuery
            </h1>
            <div className="flex w-full max-w-4xl flex-col gap-3">
              <Composer
                input={input}
                isBusy={isBusy}
                visibleError={currentError}
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
          </div>
        )}
      </div>

      {hasMessages ? (
        <div className="bg-background/95 px-2 py-4 backdrop-blur">
          <div className="mx-auto w-full max-w-3xl">
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
