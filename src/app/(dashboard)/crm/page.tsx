import { createClient } from "@/lib/supabase/server";
import { getMembers, getSpacesForFilter } from "@/actions/members";
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
    // So we fetch by priority: OWNED > MEMBER
    let communityId;
    let communityName = "WellDo"; // Fallback

    // First: Check if they OWN a community (Priority)
    const { data: ownedCommunity } = await supabase
        .from("communities")
        .select("id, name")
        .eq("owner_id", user.id)
        .limit(1)
        .single();

    if (ownedCommunity) {
        communityId = ownedCommunity.id;
        communityName = ownedCommunity.name;
    } else {
        // Second: Check if they are a MEMBER of a community
        const { data: membership } = await supabase
            .from("memberships")
            .select("community_id, communities(name)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true }) // Oldest membership first
            .limit(1)
            .single();

        if (membership) {
            communityId = membership.community_id;
            // @ts-ignore
            communityName = membership.communities?.name || "Topic";
        } else {
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                    <p className="text-lg text-gray-600">Henüz bir topluluğa üye veya sahip değilsiniz.</p>
                </div>
            );
        }
    }
    // Note: TypeScript might complain about joined data structure, checking usage.
    // The profile role in 'profiles' joined table is NOT the user's role in community usually?
    // Wait, roles are global in this schema per Profile, so user.role is what we want.
    // Actually schema says Profiles has 'role' field.

    // Fetch User Role from Profile directly just to be sure
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, location")
        .eq("id", user.id)
        .single();

    const userRole = profile?.role || "member";
    const userLocation = profile?.location;

    // 2. Fetch initial members and spaces
    const { members } = await getMembers(communityId);
    const spaces = await getSpacesForFilter(communityId);

    return (
        <MembersClient
            communityId={communityId}
            communityName={communityName}
            initialMembers={members}
            userRole={userRole}
            spaces={spaces}
            currentUserLocation={userLocation}
        />
    );
}
