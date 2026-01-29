"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export interface InviteMemberInput {
    email: string;
    name?: string;
}

export async function inviteMembers(
    communityId: string,
    members: InviteMemberInput[],
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
    // console.log(`Inviting ${emails.join(", ")} to community ${communityId} as ${role}`);
    // if (message) console.log(`Message: ${message}`);

    // Send actual emails
    const { data: community } = await supabase
        .from("communities")
        .select("name")
        .eq("id", communityId)
        .single();

    const communityName = community?.name || "WellDo Topluluğu";

    const results = await Promise.allSettled(members.map(async (member) => {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join/${communityId}`; // This would be a unique token in a real app

        await sendEmail({
            to: member.email,
            subject: `${member.name ? member.name + ', ' : ''}${communityName} topluluğuna davet edildiniz!`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #111;">${communityName}</h2>
                    <p>Merhaba ${member.name || ''},</p>
                    <p>Sizi aramıza katılmaya davet ediyoruz.</p>
                    ${message ? `<p style="background: #f9f9f9; padding: 15px; border-radius: 8px; font-style: italic;">"${message}"</p>` : ''}
                    <div style="margin: 30px 0;">
                        <a href="${inviteLink}" style="background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Topluluğa Katıl</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Veya bu linki tarayıcınıza yapıştırın: <br>${inviteLink}</p>
                </div>
            `
        });
    }));

    const successCount = results.filter(r => r.status === 'fulfilled').length;

    // Return success
    return { success: true, count: successCount };
}
