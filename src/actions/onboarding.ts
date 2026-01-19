"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function completeInstructorOnboarding(data: {
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
        // 1. FIRST: Update User Role to Instructor (to bypass RLS for community creation)
        console.log("Updating role to instructor for user:", user.id);
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                role: "instructor",
                onboarding_completed: true,
                primary_goal: 'creating_community'
            })
            .eq("id", user.id);

        if (profileError) {
            console.error("Profile update failed:", profileError);
            throw new Error("Profil güncellenemedi: " + profileError.message);
        }

        // 2. Create Community
        console.log("Creating community with data:", data);
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
            throw new Error("Topluluk oluşturulamadı: " + communityError.message);
        }

        // 3. Add User as Admin Member
        const { error: memberError } = await supabase
            .from("memberships")
            .insert({
                user_id: user.id,
                community_id: community.id,
                role: "admin"
            });

        if (memberError) {
            console.error("Membership creation error:", memberError);
        }

        // 4. Create Subscription (Starter Plan)
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

    } catch (error: any) {
        console.error("Onboarding error:", error);
        return { success: false, error: error.message || "Bilinmeyen bir hata oluştu" };
    }
}

export async function completeStudentOnboarding(data: {
    interests: string[];
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        // Update User Profile
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                role: "member", // Keep as member
                onboarding_completed: true,
                primary_goal: 'learning',
                interests: data.interests
            })
            .eq("id", user.id);

        if (profileError) {
            console.error("Profile update error:", profileError);
            throw new Error("Profile update failed");
        }

        return { success: true };

    } catch (error) {
        console.error("Student Onboarding error:", error);
        return { success: false, error: "Something went wrong" };
    }
}
