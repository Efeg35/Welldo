"use client";

import * as React from "react";
import { format } from "date-fns";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DateTimePickerProps {
    date?: Date;
    onChange: (date: Date | undefined) => void;
    label?: string;
}

export function DateTimePicker({ date, onChange, label }: DateTimePickerProps) {
    const [dateTimeValue, setDateTimeValue] = React.useState(
        date ? format(date, "yyyy-MM-dd'T'HH:mm") : ""
    );

    const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setDateTimeValue(newVal);

        if (newVal) {
            onChange(new Date(newVal));
        } else {
            onChange(undefined);
        }
    };

    return (
        <div className="space-y-4">
            {label && <div className="font-semibold text-sm text-gray-900 uppercase">{label}</div>}
            <div className="flex flex-col gap-4">
                <div className="relative">
                    <Input
                        type="datetime-local"
                        value={dateTimeValue}
                        onChange={handleDateTimeChange}
                        className="h-10 border-gray-200 focus-visible:ring-gray-900 pl-10"
                    />
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <Button className="w-full bg-zinc-900 text-white rounded-lg h-10" onClick={() => { }}>Tamam</Button>
            </div>
        </div>
    );
}
