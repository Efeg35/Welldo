"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const featureTabs = [
    { href: "/community", label: "Topluluk" },
    { href: "/chat", label: "Sohbet" },
    { href: "/crm", label: "Üye Yönetimi" },
    { href: "/events", label: "Etkinlikler" },
    { href: "/live", label: "Canlı Yayın" },
    { href: "/courses", label: "Kurslar" },

    { href: "/payments", label: "Ödemeler" },
];

export function FeatureTabs() {
    const pathname = usePathname();

    return (
        <div className="border-b border-border bg-white">
            <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-hide">
                {featureTabs.map((tab) => {
                    const isActive = pathname.startsWith(tab.href);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all",
                                isActive
                                    ? "bg-black text-white"
                                    : "text-muted-foreground hover:text-black hover:bg-gray-100"
                            )}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
