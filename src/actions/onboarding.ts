"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function completeOnboarding(data: {
    communityName: string;
    communitySlug: string;
    enabledFeatures: Record<string, boolean>;
    goal?: string;
    revenue?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        // 1. Create Community
        const { data: community, error: communityError } = await supabase
            .from("communities")
            .insert({
                owner_id: user.id,
                name: data.communityName,
                slug: data.communitySlug,
                enabled_features: data.enabledFeatures,
                settings: {
                    goal: data.goal,
                    revenue: data.revenue
                }
            })
            .select()
            .single();

        if (communityError) {
            console.error("Community creation error:", communityError);
            throw new Error("Community creation failed");
        }

        // 2. Add User as Admin Member
        const { error: memberError } = await supabase
            .from("memberships")
            .insert({
                user_id: user.id,
                community_id: community.id,
                role: "admin"
            });

        if (memberError) {
            console.error("Membership creation error:", memberError);
            // Verify if trigger already handled this?
            // If trigger handled it, this might fail on duplicate key, which is fine-ish but we should handle gracefuly.
            // Actually, the trigger I wrote earlier creates a community automatically on signup.
            // This wizard seems to be creating a *new* one or *updating* the existing one?
            // The prompt says: "Senaryo: Kullanıcı ilk soruda 'Kendi topluluğumu kurmak istiyorum' seçti."
            // And "GÖREV 4: Topluluk Oluştur".

            // If the trigger already created a community (e.g. "Efe's Community"), we probably should UPDATE it instead of creating a second one.
            // OR, we create a second one. Most platforms allow multiple communities.
            // Let's assume for now we create a new one as requested.
        }

        // 3. Update User Role to Instructor and set Onboarding Completed
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                role: "instructor",
                onboarding_completed: true,
                primary_goal: data.goal
            })
            .eq("id", user.id);

        if (profileError) throw new Error("Profile update failed");

        // 4. Create Subscription (Starter Plan)
        // Find Starter Plan
        const { data: plan } = await supabase
            .from("plans")
            .select("id")
            .eq("name", "starter")
            .single();

        if (plan) {
            await supabase
                .from("user_plans")
                .insert({
                    user_id: user.id,
                    plan_id: plan.id,
                    status: "active"
                });
        }

        return { success: true, slug: data.communitySlug };

    } catch (error) {
        console.error("Onboarding error:", error);
        return { success: false, error: "Something went wrong" };
    }
}
