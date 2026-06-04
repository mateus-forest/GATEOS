"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  initialFocus?: boolean
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  initialFocus: _initialFocus,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "w-fit",
        months: "flex flex-col gap-4 sm:flex-row",
        month: "space-y-4",
        month_caption: "flex h-8 items-center justify-center px-8 text-sm font-medium",
        nav: "absolute inset-x-3 top-3 flex items-center justify-between",
        button_previous:
          "inline-flex size-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
        button_next:
          "inline-flex size-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
        chevron: "size-4",
        weekdays: "grid grid-cols-7 gap-1",
        weekday: "w-8 text-center text-xs font-normal text-muted-foreground",
        week: "mt-1 grid grid-cols-7 gap-1",
        day: "size-8",
        day_button:
          "inline-flex size-8 items-center justify-center rounded-md text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
        today: "[&>button]:border [&>button]:border-primary/50",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeft {...chevronProps} />
          ) : (
            <ChevronRight {...chevronProps} />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
