"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export type RenameAction = {
  title: string
  description?: string
  label?: string | null
  placeholder?: string
  defaultValue: string
  onConfirm: (value: string) => void
}

export type DeleteAction = {
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
}

export type ConfirmAction = {
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
}

export function RenameActionDialog({
  action,
  onOpenChange,
}: {
  action: RenameAction | null
  onOpenChange: (isOpen: boolean) => void
}) {
  return (
    <Dialog open={Boolean(action)} onOpenChange={onOpenChange}>
      {action ? (
        <RenameActionDialogContent
          key={`${action.title}:${action.defaultValue}`}
          action={action}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  )
}

function RenameActionDialogContent({
  action,
  onOpenChange,
}: {
  action: RenameAction
  onOpenChange: (isOpen: boolean) => void
}) {
  const [value, setValue] = useState(action.defaultValue)
  const canSubmit = value.trim().length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextValue = value.trim()

    if (!nextValue) {
      return
    }

    action.onConfirm(nextValue)
    onOpenChange(false)
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{action.title}</DialogTitle>
        </DialogHeader>
        <label>
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={action.placeholder ?? "输入名称"}
            autoFocus
          />
        </label>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            取消
          </DialogClose>
          <Button
            type="submit"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
          >
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

export function DeleteActionDialog({
  action,
  onOpenChange,
}: {
  action: DeleteAction | null
  onOpenChange: (isOpen: boolean) => void
}) {
  return (
    <Dialog open={Boolean(action)} onOpenChange={onOpenChange}>
      {action ? (
        <DeleteActionDialogContent
          key={`${action.title}:${action.description}`}
          action={action}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  )
}

function DeleteActionDialogContent({
  action,
  onOpenChange,
}: {
  action: DeleteAction
  onOpenChange: (isOpen: boolean) => void
}) {
  function handleConfirm() {
    action.onConfirm()
    onOpenChange(false)
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{action.title}</DialogTitle>
        <DialogDescription>{action.description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          取消
        </DialogClose>
        <Button
          type="button"
          variant="destructive"
          onClick={handleConfirm}
        >
          {action.confirmLabel ?? "删除"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function ConfirmActionDialog({
  action,
  onOpenChange,
}: {
  action: ConfirmAction | null
  onOpenChange: (isOpen: boolean) => void
}) {
  function handleConfirm() {
    if (!action) {
      return
    }

    action.onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={Boolean(action)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{action?.title ?? "确认操作"}</DialogTitle>
          <DialogDescription>{action?.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            取消
          </DialogClose>
          <Button type="button" onClick={handleConfirm}>
            {action?.confirmLabel ?? "确定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
