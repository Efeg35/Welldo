import { createClient } from "@/lib/supabase/server";
import { getMembers } from "@/actions/members";
import { MembersClient } from "./members-client";
import { redirect } from "next/navigation";

export default async function MembersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 1. Get the active community for this user
    // Ideally this comes from URL params like [communitySlug], but currently route is /crm
    // So we fetch the first community the user is a member of.
    let communityId;

    // First try to find a membership
    const { data: membership } = await supabase
        .from("memberships")
        .select("community_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

    if (membership) {
        communityId = membership.community_id;
    } else {
        // If not a member, check if they own a community
        const { data: ownedCommunity } = await supabase
            .from("communities")
            .select("id")
            .eq("owner_id", user.id)
            .limit(1)
            .single();

        if (ownedCommunity) {
            communityId = ownedCommunity.id;
        } else {
            return <div className="p-10">Bir topluluğa üye değilsiniz.</div>;
        }
    }
    // Note: TypeScript might complain about joined data structure, checking usage.
    // The profile role in 'profiles' joined table is NOT the user's role in community usually?
    // Wait, roles are global in this schema per Profile, so user.role is what we want.
    // Actually schema says Profiles has 'role' field.

    // Fetch User Role from Profile directly just to be sure
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const userRole = profile?.role || "member";

    // 2. Fetch initial members
    const { members } = await getMembers(communityId);

    return (
        <MembersClient
            communityId={communityId}
            initialMembers={members}
            userRole={userRole}
        />
    );
}
