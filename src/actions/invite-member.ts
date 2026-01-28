"use server";

import { createClient } from "@/lib/supabase/server";

export async function inviteMembers(
    communityId: string,
    emails: string[],
    role: string,
    message?: string
) {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // In a real implementation, we would:
    // 1. Create invitation records in DB
    // 2. Send emails via Resend or similar provider
    // 3. Prevent duplicates

    // For this MVP/V1, we will mock the success but simulate the DB interaction

    // Check permissions (mock)
    const { data: membership } = await supabase
        .from("memberships")
        .select("role")
        .eq("user_id", user.id)
        .eq("community_id", communityId)
        .single();

    if (!membership || !['admin', 'instructor'].includes(membership.role || '')) {
        // Allow owners too (who might not have explicit membership entry in some cases as per previous fix)
        const { data: community } = await supabase
            .from("communities")
            .select("owner_id")
            .eq("id", communityId)
            .single();

        if (community?.owner_id !== user.id) {
            throw new Error("Only admins can invite members");
        }
    }

    // Simulate sending
    console.log(`Inviting ${emails.join(", ")} to community ${communityId} as ${role}`);
    if (message) console.log(`Message: ${message}`);

    // Return success
    return { success: true, count: emails.length };
}
