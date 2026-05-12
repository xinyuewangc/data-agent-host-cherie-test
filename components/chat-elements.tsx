"use client"

import type { FormEvent } from "react"
import type { UIMessage } from "ai"
import { ArrowUpIcon, PlusIcon, SquareIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export const defaultModelId = "gpt-5.4"

export const promptSuggestions = [
  "帮我查一下今日各主体资金余额，并生成表格",
  "把需求明细里的异常记录找出来",
  "基于预算漏斗数据生成一份执行摘要",
]

export function Composer({
  compact = false,
  input,
  isBusy,
  visibleError,
  placeholder = "我可以帮你查明细数据、生成统计报表、分析业务趋势。告诉我你想了解什么？",
  onInputChange,
  onKeyDown,
  onStop,
  onSubmit,
}: {
  compact?: boolean
  input: string
  isBusy: boolean
  visibleError: string | null
  placeholder?: string
  onInputChange: (value: string) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onStop: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow focus-within:shadow-md",
          compact ? "rounded-xl" : "rounded-2xl"
        )}
      >
        <Textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={isBusy}
          className={cn(
            "max-h-52 min-h-24 resize-none border-0 px-5 pt-5 pb-2 text-base shadow-none focus-visible:ring-0 md:text-base",
            compact && "min-h-16 px-4 pt-4 text-sm md:text-sm"
          )}
        />
        <div className="flex min-h-14 items-center justify-between gap-3 px-4 pb-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="添加上下文"
                  />
                }
              >
                <PlusIcon />
              </TooltipTrigger>
              <TooltipContent>添加文件、数据资产或工具上下文</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            {isBusy ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      size="icon-lg"
                      variant="secondary"
                      aria-label="停止生成"
                      onClick={onStop}
                    />
                  }
                >
                  <SquareIcon />
                </TooltipTrigger>
                <TooltipContent>停止生成</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="submit"
                      size="icon-lg"
                      aria-label="发送"
                      disabled={!input.trim()}
                    />
                  }
                >
                  <ArrowUpIcon />
                </TooltipTrigger>
                <TooltipContent>发送</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {visibleError ? (
        <div className="flex min-h-6 items-center justify-end px-5">
          <p className="truncate text-xs text-destructive">{visibleError}</p>
        </div>
      ) : null}
    </form>
  )
}

export function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user"

  return (
    <article className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-card-foreground shadow-sm"
        )}
      >
        <div className="flex flex-col gap-3">
          {message.parts.map((part, index) => {
            if (part.type === "text") {
              return (
                <p
                  key={`${message.id}-${index}`}
                  className="whitespace-pre-wrap"
                >
                  {part.text}
                </p>
              )
            }

            if (part.type === "reasoning") {
              return (
                <details
                  key={`${message.id}-${index}`}
                  className="text-muted-foreground"
                >
                  <summary className="cursor-pointer text-xs">
                    Reasoning
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap">{part.text}</p>
                </details>
              )
            }

            if (part.type === "source-url") {
              return (
                <a
                  key={`${message.id}-${index}`}
                  href={part.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-xs underline underline-offset-4"
                >
                  {part.title ?? part.url}
                </a>
              )
            }

            return null
          })}
        </div>
      </div>
    </article>
  )
}

export function AssistantThinking() {
  return (
    <article className="flex justify-start">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
        <span className="size-2 animate-pulse rounded-full bg-muted-foreground" />
        <span>Thinking</span>
      </div>
    </article>
  )
}
