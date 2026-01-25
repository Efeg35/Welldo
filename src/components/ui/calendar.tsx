"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-4 bg-white", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                month_caption: "flex justify-center items-center mb-4 h-[40px] gap-3",
                caption_label: "text-sm font-bold text-gray-900",
                nav: "contents",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-gray-300 order-first"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-gray-300 order-last"
                ),
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex justify-between mb-2",
                weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
                week: "flex w-full mt-2 justify-between",
                day: cn(
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                ),
                day_button: "h-full w-full",
                selected: "bg-gray-900 text-white hover:bg-black focus:bg-gray-900 focus:text-white rounded-md",
                today: "bg-gray-100 text-gray-900 font-bold",
                outside: "text-muted-foreground opacity-50",
                disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ ...props }) => {
                    if (props.orientation === 'left') return <ChevronLeft className="h-4 w-4" />
                    return <ChevronRight className="h-4 w-4" />
                }
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
