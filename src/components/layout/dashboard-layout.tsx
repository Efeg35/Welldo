"use client";

import { ReactNode } from "react";
import { Header } from "@/components/layout/header";

import { Sidebar } from "./sidebar";
import { Toaster } from "@/components/ui/sonner";

interface DashboardLayoutProps {
    children: ReactNode;
    showSidebar?: boolean;
    showSecondaryNav?: boolean;
    communityName?: string;
    spaces?: any[];
    groups?: any[]; // Added groups
    links?: any[];
    user?: any;
    userRole?: string;
    enabledFeatures?: Record<string, boolean>;
}

export function DashboardLayout({
    children,
    showSidebar = true,
    showSecondaryNav = true,
    communityName,
    spaces = [],
    groups = [], // Added default
    links = [],
    user,
    userRole = "member",
    enabledFeatures
}: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top Header */}
            <Header />

            {/* Main Content Area */}
            <div className="flex flex-1">
                {/* Left Sidebar - Sticky */}
                {showSidebar && (
                    <div className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-[64px] h-[calc(100vh-64px)] border-r border-border overflow-hidden">
                            <Sidebar
                                communityName={communityName}
                                spaces={spaces}
                                groups={groups}
                                links={links}
                                user={user}
                                userRole={userRole}
                                enabledFeatures={enabledFeatures}
                            />
                        </div>
                    </div>
                )}

                {/* Main Content - Natural Flow */}
                <main className="flex-1 min-w-0 bg-[#FAFAFA]">
                    {children}
                </main>
            </div>
            <Toaster />
        </div>
    );
}
