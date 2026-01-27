import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type EventResponse } from "@/types";

interface AttendeeListProps {
    responses?: EventResponse[];
    maxDisplay?: number;
}

export function AttendeeList({ responses, maxDisplay = 10 }: AttendeeListProps) {
    if (!responses) return null;

    const attendees = responses
        .filter(r => r.status === 'attending')
        .map(r => r.user)
        .filter(u => u !== undefined);

    if (attendees.length === 0) return null;

    const displayedAttendees = attendees.slice(0, maxDisplay);
    const remainingCount = Math.max(0, attendees.length - maxDisplay);

    return (
        <div>
            <h2 className="mb-3 font-semibold text-lg">Katılımcılar ({attendees.length})</h2>
            <div className="flex items-center gap-2">
                <div className="flex -space-x-3 rtl:space-x-reverse">
                    {displayedAttendees.map((user, i) => (
                        <div key={user?.id || i} className="group relative">
                            <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-transparent transition-transform hover:scale-110 hover:z-10 hover:ring-violet-500">
                                <AvatarImage src={user?.avatar_url || ""} />
                                <AvatarFallback className="bg-violet-100 text-violet-700 font-medium">
                                    {(user?.full_name || "K").charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {user?.full_name && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden px-2 py-1 text-xs text-white bg-black rounded whitespace-nowrap group-hover:block z-20">
                                    {user.full_name}
                                </div>
                            )}
                        </div>
                    ))}
                    {remainingCount > 0 && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-slate-100 text-xs font-medium text-slate-600 ring-2 ring-transparent hover:z-10">
                            +{remainingCount}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
