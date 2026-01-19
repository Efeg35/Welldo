"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPosts(channelId?: string, sort: string = 'latest') {
    const supabase = await createClient();

    let query = supabase
        .from('posts')
        .select(`
            *,
            profiles:profiles!posts_user_id_fkey (
                id,
                full_name,
                avatar_url,
                role
            ),
            post_likes (
                user_id
            ),
            comments (count)
        `);

    // Apply sorting
    switch (sort) {
        case 'oldest':
            query = query.order('created_at', { ascending: true });
            break;
        case 'alphabetical':
            // Fallback to content if title is null
            query = query.order('title', { ascending: true, nullsFirst: false }).order('content', { ascending: true });
            break;
        case 'popular':
            // Sort by likes is tricky without a computed column or view. 
            // For now, we'll fetch latest and sort in memory (not efficient for large datasets but works for MVP)
            // Or just order by created_at for now.
            // Let's rely on in-memory sort for 'popular' below
            query = query.order('created_at', { ascending: false });
            break;
        case 'latest':
        default:
            query = query.order('created_at', { ascending: false });
            break;
    }

    if (channelId) {
        query = query.eq('channel_id', channelId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching posts:", JSON.stringify(error, null, 2));
        return [];
    }

    let posts = data.map((post: any) => ({
        ...post,
        _count: {
            post_likes: post.post_likes?.length || 0,
            comments: post.comments?.[0]?.count || 0
        }
    }));

    // In-memory sort for popular (since we can't easily order by relation count in standard Supabase select without RPC/View)
    if (sort === 'popular') {
        posts.sort((a: any, b: any) => b._count.post_likes - a._count.post_likes);
    }

    return posts;
}

export async function createPost(
    content: string,
    channelId?: string,
    communityId?: string,
    title?: string,
    imageUrl?: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    let targetCommunityId = communityId;

    // If communityId not provided but channelId is, fetch it from channel
    if (!targetCommunityId && channelId) {
        const { data: channel } = await supabase
            .from('channels')
            .select('community_id')
            .eq('id', channelId)
            .single();
        if (channel) targetCommunityId = channel.community_id;
    }

    // Fallback: fetch user's first community membership
    if (!targetCommunityId) {
        const { data: membership } = await supabase
            .from('memberships')
            .select('community_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();

        if (membership) targetCommunityId = membership.community_id;
    }

    // If still no community ID, we can't create the post (constraint violation)
    if (!targetCommunityId) {
        // Last resort: check if owner of any community
        const { data: ownedCommunity } = await supabase
            .from('communities')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1)
            .single();
        if (ownedCommunity) targetCommunityId = ownedCommunity.id;
    }

    if (!targetCommunityId) {
        throw new Error("Community context required to create a post");
    }

    const { error } = await supabase
        .from('posts')
        .insert({
            user_id: user.id,
            content,
            title: title || null,
            image_url: imageUrl || null,
            channel_id: channelId || null,
            community_id: targetCommunityId
        });

    if (error) {
        console.error("Error creating post:", error);
        throw new Error("Failed to create post");
    }

    revalidatePath('/community');
}

export async function toggleLike(postId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Check if like exists
    const { data: existingLike } = await supabase
        .from('post_likes')
        .select()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

    if (existingLike) {
        // Unlike
        await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);
    } else {
        // Like
        await supabase
            .from('post_likes')
            .insert({
                post_id: postId,
                user_id: user.id,
            });
    }

    revalidatePath('/community');
}

export async function getSidebarData(communityId?: string) {
    const supabase = await createClient();

    // If no communityId provided, try to find the first one or default
    let targetedCommunityId = communityId;
    if (!targetedCommunityId) {
        const { data: firstCommunity } = await supabase.from('communities').select('id').limit(1).single();
        if (firstCommunity) targetedCommunityId = firstCommunity.id;
    }

    if (!targetedCommunityId) return { spaces: [], links: [] };

    const { data: spaces } = await supabase
        .from('channels')
        .select('*')
        .eq('community_id', targetedCommunityId)
        .order('order_index', { ascending: true });

    const { data: links } = await supabase
        .from('community_links')
        .select('*')
        .eq('community_id', targetedCommunityId)
        .order('order_index', { ascending: true });

    return {
        spaces: spaces || [],
        links: links || []
    };
}

export async function createComment(postId: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from('comments')
        .insert({
            user_id: user.id,
            post_id: postId,
            content,
        });

    if (error) {
        console.error("Error creating comment:", error);
        throw new Error("Failed to create comment");
    }

    revalidatePath(`/community/post/${postId}`);
}

export async function getComments(postId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('comments')
        .select(`
            *,
            profiles (
                id,
                full_name,
                avatar_url,
                role
            )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching comments:", error);
        return [];
    }

    return data;
}

interface CreateChannelParams {
    name: string;
    slug: string;
    description?: string;
    type: string; // 'post', 'chat', 'event', 'course', 'member'
    icon?: string;
    category?: string;
    access_level?: string; // 'open', 'private', 'secret'
    settings?: any; // { notifications: { email: boolean, in_app: boolean } }
    communityId?: string;
}

export async function createChannel(params: CreateChannelParams) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    let communityId = params.communityId;

    if (!communityId) {
        // Get the first community (or handle selection if multiple)
        const { data: community } = await supabase.from('communities').select('id').limit(1).single();
        if (!community) {
            throw new Error("Community not found");
        }
        communityId = community.id;
    }

    // Get max order_index to append to the end
    const { data: maxOrder } = await supabase
        .from('channels')
        .select('order_index')
        .eq('community_id', communityId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

    const newOrderIndex = (maxOrder?.order_index || 0) + 1;

    const { data, error } = await supabase
        .from('channels')
        .insert({
            community_id: communityId,
            name: params.name,
            slug: params.slug,
            description: params.description,
            type: params.type,
            icon: params.icon || 'circle', // Default icon
            category: params.category || 'Spaces',
            order_index: newOrderIndex,
            access_level: params.access_level || 'open',
            settings: params.settings || {},
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating channel:", error);
        throw new Error("Failed to create channel");
    }

    revalidatePath('/community');
    return data;
}
