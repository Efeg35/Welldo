import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getPost } from "@/actions/community";
import { PostDetail } from "@/components/community/post-detail";
import { Profile } from "@/types";

export default async function PostPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { id } = await params;
    const post = await getPost(id);

    if (!post) {
        return notFound();
    }

    // Fetch Full Profile from DB
    const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const profile: Profile = {
        id: user.id,
        email: user.email || dbProfile?.email || null,
        full_name: dbProfile?.full_name || (user.user_metadata?.full_name as string) || "Bilinmeyen",
        avatar_url: dbProfile?.avatar_url || (user.user_metadata?.avatar_url as string) || null,
        role: dbProfile?.role || (user.user_metadata?.role as any) || 'member',
        iyzico_sub_merchant_key: dbProfile?.iyzico_sub_merchant_key || null,
        bio: dbProfile?.bio || null,
        created_at: dbProfile?.created_at || user.created_at,
        updated_at: dbProfile?.updated_at || user.updated_at || user.created_at
    };

    return <PostDetail post={post} user={profile} />;
}
