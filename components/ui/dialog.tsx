"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type DialogContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  titleId: string
  descriptionId: string
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialog() {
  const context = React.useContext(DialogContext)

  if (!context) {
    throw new Error("Dialog components must be used within Dialog")
  }

  return context
}

function Dialog({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const titleId = React.useId()
  const descriptionId = React.useId()
  const isControlled = open !== undefined
  const actualOpen = isControlled ? open : internalOpen

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }

      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange]
  )

  return (
    <DialogContext.Provider
      value={{ open: actualOpen, setOpen, titleId, descriptionId }}
    >
      {children}
    </DialogContext.Provider>
  )
}

function DialogTrigger({
  asChild,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
  children: React.ReactElement
}) {
  const { setOpen } = useDialog()

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (event: React.MouseEvent) => {
        children.props.onClick?.(event)
        props.onClick?.(event as React.MouseEvent<HTMLButtonElement>)

        if (!event.defaultPrevented) {
          setOpen(true)
        }
      },
    } as React.HTMLAttributes<HTMLElement>)
  }

  return (
    <button type="button" {...props} onClick={() => setOpen(true)}>
      {children}
    </button>
  )
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open, setOpen, titleId, descriptionId } = useDialog()

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        data-slot="dialog-content"
        className={cn(
          "relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-background p-6 text-foreground shadow-lg",
          className
        )}
        {...props}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-3 top-3"
          onClick={() => setOpen(false)}
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </Button>
        {children}
      </div>
    </div>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("mb-4 flex flex-col gap-1.5 pr-8", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  const { titleId } = useDialog()

  return (
    <h2
      id={titleId}
      data-slot="dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const { descriptionId } = useDialog()

  return (
    <p
      id={descriptionId}
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}
