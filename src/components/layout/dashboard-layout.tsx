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
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                {showSidebar && (
                    <div className="hidden lg:block w-64 shrink-0">
                        <Sidebar
                            communityName={communityName}
                            spaces={spaces}
                            links={links}
                            user={user}
                            userRole={userRole}
                            enabledFeatures={enabledFeatures}
                        />
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-hidden">
                        {children}
                    </div>
                </main>
            </div>
            <Toaster />
        </div>
    );
}
