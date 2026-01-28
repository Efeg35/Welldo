"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserLocation(location: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("profiles")
        .update({ location })
        .eq("id", user.id);

    if (error) {
        console.error("Error updating location:", error);
        throw new Error("Failed to update location");
    }

    revalidatePath("/crm");
    return true;
}
