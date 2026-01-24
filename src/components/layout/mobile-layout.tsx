import { Header } from "./header";
import { BottomNav } from "./bottom-nav";

interface MobileLayoutProps {
    children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <BottomNav />
        </div>
    );
}
