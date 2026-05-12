"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { Composer, promptSuggestions } from "@/components/chat-elements"
import { useWorkspace } from "@/components/workspace-provider"
import { Button } from "@/components/ui/button"
import { getPendingSessionPromptKey } from "@/lib/pending-session-prompt"

export function NewSessionChat() {
  const router = useRouter()
  const { createTemporarySession, isHydrated } = useWorkspace()
  const [input, setInput] = useState("")
  const [isStarting, setIsStarting] = useState(false)

  const trimmedInput = input.trim()
  const isBusy = isStarting || !isHydrated

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!trimmedInput || isBusy) {
      return
    }

    const prompt = trimmedInput
    const session = createTemporarySession({ prompt })

    window.sessionStorage.setItem(
      getPendingSessionPromptKey(session.id),
      prompt
    )
    setIsStarting(true)
    setInput("")
    router.replace(`/sessions/${session.routeSegment}`)
  }

  function handleComposerKeyDown(
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
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-2">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 pb-10">
          <h1 className="text-center text-4xl font-semibold tracking-normal text-balance md:text-5xl">
            miHoQuery
          </h1>
          <div className="flex w-full max-w-4xl flex-col gap-3">
            <Composer
              input={input}
              isBusy={isBusy}
              visibleError={null}
              onInputChange={setInput}
              onKeyDown={handleComposerKeyDown}
              onSubmit={handleSubmit}
              onStop={() => undefined}
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
                  disabled={isBusy}
                >
                  <span className="truncate">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
