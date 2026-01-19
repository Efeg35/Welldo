import { DashboardLayout } from "@/components/layout";
import { getSidebarData } from "@/actions/community";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch dynamic sidebar data
    const { spaces, links } = await getSidebarData();

    // Fetch user profile role and onboarding status
    let userRole = "member";
    let enabledFeatures = {};

    if (user) {
        // Fetch profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, onboarding_completed')
            .eq('id', user.id)
            .single();

        if (profile) {
            userRole = profile.role;

            // Redirect to onboarding if not completed
            if (profile.onboarding_completed === false) {
                // We need to import redirect from next/navigation
                const { redirect } = await import("next/navigation");
                redirect('/onboarding');
            }
        }

        // Fetch community features (assuming user is a member of at least one)
        const { data: membership } = await supabase
            .from("memberships")
            .select("communities(enabled_features)")
            .eq("user_id", user.id)
            .single();

        if (membership && membership.communities) {
            enabledFeatures = (membership.communities as any).enabled_features || {};
        }
    }

    return (
        <DashboardLayout
            communityName="WellDo Topluluğu"
            spaces={spaces}
            links={links}
            user={user}
            userRole={userRole}
            enabledFeatures={enabledFeatures}
        >
            {children}
        </DashboardLayout>
    );
}
