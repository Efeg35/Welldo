"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Channel } from "@/types";

export async function getPosts(channelId?: string, sort: string = 'latest', topic?: string) {
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
            likes (
                user_id
            ),
            bookmarks (
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

    if (topic) {
        query = query.eq('topic', topic);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching posts:", JSON.stringify(error, null, 2));
        return [];
    }

    let posts = data.map((post: any) => ({
        ...post,
        _count: {
            likes: post.likes?.length || 0,
            comments: post.comments?.[0]?.count || 0
        }
    }));

    // In-memory sort for popular (since we can't easily order by relation count in standard Supabase select without RPC/View)
    if (sort === 'popular') {
        posts.sort((a: any, b: any) => b._count.likes - a._count.likes);
    }

    return posts;
}

export async function createPost(
    content: string,
    channelId?: string,
    communityId?: string,
    title?: string,
    imageUrl?: string,
    topic?: string
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

    // Sanitize IDs - empty strings should be null for UUID columns
    const sanitizedChannelId = channelId && channelId.trim() !== "" ? channelId : null;
    const sanitizedCommunityId = targetCommunityId && targetCommunityId.trim() !== "" ? (targetCommunityId as string) : null;

    const { error } = await supabase
        .from('posts')
        .insert({
            user_id: user.id,
            content,
            title: title || null,
            image_url: imageUrl || null,
            topic: topic || null,
            channel_id: sanitizedChannelId,
            community_id: sanitizedCommunityId
        });

    if (error) {
        console.error("Error creating post:", JSON.stringify(error, null, 2));
        throw new Error(`Gönderi oluşturulamadı: ${error.message} (${error.code})`);
    }

    revalidatePath('/community');
}

export async function toggleLike(resourceId: string, type: 'post' | 'event') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const idField = type === 'post' ? 'post_id' : 'event_id';

    // Check if like exists
    const { data: existingLike } = await supabase
        .from('likes')
        .select()
        .eq(idField, resourceId)
        .eq('user_id', user.id)
        .single();

    if (existingLike) {
        // Unlike
        await supabase
            .from('likes')
            .delete()
            .eq(idField, resourceId)
            .eq('user_id', user.id);
    } else {
        // Like
        const insertData: any = {
            user_id: user.id
        };
        insertData[idField] = resourceId;

        await supabase
            .from('likes')
            .insert(insertData);

        // Create Notification (Only for posts for now, events maybe later)
        if (type === 'post') {
            const { data: post } = await supabase
                .from('posts')
                .select('user_id')
                .eq('id', resourceId)
                .single();

            if (post && post.user_id !== user.id) {
                await supabase.from('notifications').insert({
                    user_id: post.user_id,
                    actor_id: user.id,
                    type: 'like',
                    resource_id: resourceId,
                    resource_type: 'post'
                });
            }
        }
    }

    revalidatePath('/community');
    if (type === 'event') {
        revalidatePath(`/events/${resourceId}`);
    }
}

export async function getLikes(resourceId: string, type: 'post' | 'event') {
    const supabase = await createClient();
    const idField = type === 'post' ? 'post_id' : 'event_id';

    const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq(idField, resourceId);

    const { data: { user } } = await supabase.auth.getUser();
    let isLiked = false;

    if (user) {
        const { data } = await supabase
            .from('likes')
            .select('user_id')
            .eq(idField, resourceId)
            .eq('user_id', user.id)
            .single();
        isLiked = !!data;
    }

    return { count: count || 0, isLiked };
}

export async function toggleBookmark(postId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: existing } = await supabase
        .from('bookmarks')
        .select()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

    if (existing) {
        await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
        await supabase.from('bookmarks').insert({ post_id: postId, user_id: user.id });
    }

    revalidatePath('/community');
    revalidatePath(`/community/post/${postId}`);
}

export async function getSidebarData(communityId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If no communityId provided, try to find the first one or default
    let targetedCommunityId = communityId;
    if (!targetedCommunityId) {
        const { data: firstCommunity } = await supabase.from('communities').select('id').limit(1).single();
        if (firstCommunity) targetedCommunityId = firstCommunity.id;
    }

    if (!targetedCommunityId) return { spaces: [], links: [] };

    let { data: rawSpaces } = await supabase
        .from('channels')
        .select(`
            *,
            group:channel_groups(*)
        `)
        .eq('community_id', targetedCommunityId)
        .order('order_index', { ascending: true });

    let { data: rawGroups } = await supabase
        .from('channel_groups')
        .select('*')
        .eq('community_id', targetedCommunityId)
        .order('position', { ascending: true });

    let spaces = rawSpaces || [];

    // Apply visibility filtering for 'secret' spaces
    if (user && spaces.length > 0) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const isStaff = profile?.role === 'instructor' || profile?.role === 'admin';

        if (!isStaff) {
            // Fetch user's space memberships to see which secret ones they can see
            const { data: spaceMemberships } = await supabase
                .from('space_members') // Assuming this table exists for private access
                .select('channel_id')
                .eq('user_id', user.id);

            // Note: Also need to check user_course_enrollments for courses
            const { data: enrollments } = await supabase
                .from('user_course_enrollments')
                .select('course_id, courses(channel_id)')
                .eq('user_id', user.id)
                .eq('status', 'active');

            const joinedSpaceIds = new Set([
                ...(spaceMemberships?.map(m => m.channel_id) || []),
                ...(enrollments?.map((e: any) => e.courses?.channel_id).filter(Boolean) || [])
            ]);

            spaces = spaces.filter(space => {
                if (space.access_level === 'secret') {
                    return joinedSpaceIds.has(space.id);
                }
                return true;
            });
        }
    }

    const { data: links } = await supabase
        .from('community_links')
        .select('*')
        .eq('community_id', targetedCommunityId)
        .order('order_index', { ascending: true });

    // Fetch unread counts
    let spacesWithCounts = spaces;
    if (user && spaces.length > 0) {
        // Get user's last read time for each channel
        const { data: reads } = await supabase
            .from('channel_reads')
            .select('channel_id, last_read_at')
            .eq('user_id', user.id);

        const readMap = new Map((reads || []).map(r => [r.channel_id, r.last_read_at]));

        // Calculate unread counts
        // Note: For MVP we will do individual queries or a grouped query. 
        // Grouped query is better perf.
        const channelIds = spaces.map(s => s.id);

        // Count posts after last read
        // Ideally we would do this in a single complex query or view, 
        // but for now let's try a simplified approach: 
        // We will assume "unread" means new POSTS since last visit.
        // For strict unread count we'd need:
        // SELECT channel_id, COUNT(*) FROM posts WHERE created_at > (SELECT last_read_at FROM channel_reads WHERE ...) GROUP BY channel_id

        // Let's do a loop for now or a smart query? user might have many channels.
        // Better: client-side? No, sidebar is server fetched mostly.

        // Let's fetch all relevant posts created recently (e.g. last 30 days) and count in memory? 
        // Or specific queries.

        // Let's go with a simplified approach: default 'unread' is boolean if we can't get exact count easily?
        // User asked for "number".

        // Let's iterate for now (limit 20 channels typically visible).
        spacesWithCounts = await Promise.all(spaces.map(async (space) => {
            const lastRead = readMap.get(space.id) || '2000-01-01'; // Default long ago

            // Count posts
            const { count } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('channel_id', space.id)
                .gt('created_at', lastRead);

            return {
                ...space,
                unread_count: count || 0
            };
        }));
    }

    return {
        spaces: spacesWithCounts,
        links: links || [],
        groups: rawGroups || []
    };
}

export async function createSpaceGroup(communityId: string, name: string, slug: string, settings: any = {}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Get max position
    const { data: maxPos } = await supabase
        .from('channel_groups')
        .select('position')
        .eq('community_id', communityId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

    const newPosition = (maxPos?.position || 0) + 1;

    const { data, error } = await supabase
        .from('channel_groups')
        .insert({
            community_id: communityId,
            name,
            slug,
            position: newPosition,
            settings
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating space group:", error);
        throw new Error("Failed to create space group");
    }

    revalidatePath('/community');
    return data;
}

export async function updateSpaceGroup(groupId: string, updates: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('channel_groups')
        .update(updates)
        .eq('id', groupId);

    if (error) {
        console.error("Error updating space group:", error);
        throw new Error("Failed to update space group");
    }

    revalidatePath('/community');
}

export async function markChannelAsRead(channelId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Upsert channel read
    const { error } = await supabase
        .from('channel_reads')
        .upsert({
            user_id: user.id,
            channel_id: channelId,
            last_read_at: new Date().toISOString()
        }, {
            onConflict: 'user_id, channel_id'
        });

    if (error) {
        console.error("Error marking channel as read", error);
    }
}

export async function createComment(resourceId: string, content: string, type: 'post' | 'event' = 'post') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const payload: any = {
        user_id: user.id,
        content,
    };

    if (type === 'post') {
        payload.post_id = resourceId;
    } else {
        payload.event_id = resourceId;
    }

    const { error } = await supabase
        .from('comments')
        .insert(payload);

    if (error) {
        console.error("Error creating comment:", error);
        throw new Error("Failed to create comment");
    }

    if (type === 'post') {
        // Create Notification for Post Owner
        const { data: post } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', resourceId)
            .single();

        if (post && post.user_id !== user.id) {
            await supabase.from('notifications').insert({
                user_id: post.user_id,
                actor_id: user.id,
                type: 'comment',
                resource_id: resourceId,
                resource_type: 'post'
            });
        }
        revalidatePath(`/community/post/${resourceId}`);
    } else {
        // Create Notification for Event Organizer (Future Todo)
        revalidatePath(`/events/${resourceId}`);
    }
}

export async function getComments(resourceId: string, type: 'post' | 'event' = 'post') {
    const supabase = await createClient();

    let query = supabase
        .from('comments')
        .select(`
            *,
            profiles (
                id,
                full_name,
                avatar_url,
                role
            )
        `);

    if (type === 'post') {
        query = query.eq('post_id', resourceId);
    } else {
        query = query.eq('event_id', resourceId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

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
    group_id?: string;
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
            category: params.category || 'Alanlar',
            order_index: newOrderIndex,
            access_level: params.access_level, // Remove default 'open'
            settings: params.settings || {},
            group_id: params.group_id,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating channel:", error);
        throw new Error(`Failed to create channel: ${error.message} (${error.code})`);
    }

    revalidatePath('/community');
    return data;
}

export async function getChannelBySlug(slug: string) {
    const supabase = await createClient();

    const { data: channel, error } = await supabase
        .from('channels')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error(`Error fetching channel by slug '${slug}':`, JSON.stringify(error, null, 2));
        return null;
    }

    return channel;
}

export async function updateChannelSettings(channelId: string, settings: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data: currentChannel, error: fetchError } = await supabase
        .from('channels')
        .select('settings')
        .eq('id', channelId)
        .single();

    if (fetchError) throw new Error(fetchError.message);

    const newSettings = { ...currentChannel?.settings, ...settings };

    const { data, error } = await supabase
        .from('channels')
        .update({ settings: newSettings })
        .eq('id', channelId)
        .select()
        .single();

    if (error) {
        console.error("Error updating channel settings:", error);
        throw new Error("Failed to update channel settings");
    }

    revalidatePath('/community');
    return data;
}
export async function updateChannel(channelId: string, updates: Partial<Channel>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
        .from('channels')
        .update(updates)
        .eq('id', channelId)
        .select()
        .single();

    if (error) {
        console.error("Error updating channel:", error);
        throw new Error("Failed to update channel");
    }

    revalidatePath('/community');
    return data;
}

export async function deleteChannel(channelId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

    if (error) {
        console.error("Error deleting channel:", error);
        throw new Error("Failed to delete channel");
    }

    revalidatePath('/community');
    return { success: true };
}

export async function addSpaceMember(channelId: string, userId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Check if user is already a member
    const { data: existing } = await supabase
        .from('space_members')
        .select('id')
        .eq('channel_id', channelId)
        .eq('user_id', userId)
        .single();

    if (existing) return;

    const { error } = await supabase
        .from('space_members')
        .insert({
            channel_id: channelId,
            user_id: userId
        });

    if (error) {
        console.error("Error adding space member:", error);
        throw new Error("Failed to add member");
    }

    revalidatePath('/community');
    revalidatePath(`/community/[slug]`, 'page'); // Revalidate dynamic routes if possible, or exact path
}

export async function removeSpaceMember(channelId: string, userId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('space_members')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', userId);

    if (error) {
        console.error("Error removing space member:", error);
        throw new Error("Failed to remove member");
    }

    revalidatePath('/community');
}

export async function searchUsers(query: string, communityId?: string) {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!query || query.length < 2 || !currentUser) return [];

    let dbQuery = supabase
        .from('profiles')
        .select(`
            id, 
            full_name, 
            avatar_url, 
            email,
            memberships!inner(community_id)
        `)
        .ilike('full_name', `%${query}%`)
        .neq('id', currentUser.id) // Don't search for self
        .limit(10);

    if (communityId) {
        // Filter by specific community
        dbQuery = dbQuery.eq('memberships.community_id', communityId);
    } else {
        // Fallback: Filter by any community the current user is in.
        // First, get the current user's community IDs.
        const { data: userMemberships } = await supabase
            .from('memberships')
            .select('community_id')
            .eq('user_id', currentUser.id);

        const communityIds = userMemberships?.map(m => m.community_id) || [];

        if (communityIds.length > 0) {
            dbQuery = dbQuery.in('memberships.community_id', communityIds);
        } else {
            // If user has no communities, they can't search anyone
            return [];
        }
    }

    const { data, error } = await dbQuery;

    if (error) {
        console.error("Search error:", error);
        return [];
    }

    // Remove duplicates (a user might have multiple memberships if we didn't filter strictly)
    const uniqueResults = data.reduce((acc: any[], current: any) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, []);

    return uniqueResults;
}

export async function getSpaceMembers(channelId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('space_members')
        .select(`
            user_id,
            created_at,
            profile:profiles(*)
        `)
        .eq('channel_id', channelId);

    if (error) return [];

    // Transform to match CourseMembersTab structure
    return data
        .filter((m: any) => m.profile)
        .map((m: any) => ({
            ...m.profile,
            joined_at: m.created_at
        }));
}

export async function editPost(
    postId: string,
    title: string | null,
    content: string,
    topic: string | null,
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('posts')
        .update({
            title,
            content,
            updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', user.id); // Security: only owner can edit

    if (error) {
        console.error("Error editing post:", error);
        throw new Error("Failed to edit post");
    }

    revalidatePath('/community');
    revalidatePath(`/community/post/${postId}`);
}

export async function deletePost(postId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Check if owner or staff
    const { data: post } = await supabase
        .from('posts')
        .select('user_id, community_id')
        .eq('id', postId)
        .single();

    if (!post) throw new Error("Post not found");

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isStaff = profile?.role === 'instructor' || profile?.role === 'admin';

    if (post.user_id !== user.id && !isStaff) {
        throw new Error("Unauthorized to delete this post");
    }

    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

    if (error) {
        console.error("Error deleting post:", error);
        throw new Error("Failed to delete post");
    }

    revalidatePath('/community');
}

export async function getPost(postId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:profiles!posts_user_id_fkey (
                id,
                full_name,
                avatar_url,
                role
            ),
            likes (
                user_id
            ),
            bookmarks (
                user_id
            ),
            comments (
                *,
                profiles (
                    id,
                    full_name,
                    avatar_url,
                    role
                )
            )
        `)
        .eq('id', postId)
        .single();

    if (error) {
        console.error("Error fetching post:", error);
        return null;
    }

    return {
        ...data,
        _count: {
            likes: data.likes?.length || 0,
            comments: data.comments?.length || 0
        }
    };
}

export async function getBookmarkedPosts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('bookmarks')
        .select(`
            post_id,
            posts:posts!bookmarks_post_id_fkey (
                *,
                profiles:profiles!posts_user_id_fkey (
                    id,
                    full_name,
                    avatar_url,
                    role
                ),
                likes ( user_id ),
                comments ( count ),
                channel_id (
                  id,
                  name,
                  slug
                )
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching bookmarks:", error);
        return [];
    }

    // Transform to flatten the structure slightly if needed, or return as is
    return data
        .filter((item: any) => item.posts !== null)
        .map((item: any) => {
            const post = item.posts;
            return {
                ...post,
                channel_name: post.channel_id?.name || 'Genel',
                _count: {
                    likes: post.likes?.length || 0,
                    comments: post.comments?.[0]?.count || 0
                }
            };
        });
}

export async function getBookmarkedEvents() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('bookmarks')
        .select(`
            event_id,
            events:events!bookmarks_event_id_fkey (
                *,
                community:community_id ( id, name, slug ),
                channel:channel_id ( id, name, slug )
            )
        `)
        .eq('user_id', user.id)
        .not('event_id', 'is', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching bookmarked events:", error);
        return [];
    }

    return data
        .filter((item: any) => item.events !== null)
        .map((item: any) => item.events);
}

export async function getCommunityChannels(communityId: string, type?: string) {
    const supabase = await createClient();

    let query = supabase
        .from('channels')
        .select('id, name, type, icon')
        .eq('community_id', communityId)
        .order('order_index', { ascending: true });

    if (type) {
        query = query.eq('type', type);
    }

    const { data: channels, error } = await query;

    if (error) {
        console.error("Error fetching community channels:", error);
        return [];
    }

    return channels;
}

export async function cancelEventResponse(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('event_responses')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

    if (error) {
        console.error("Error cancelling event response:", error);
        throw new Error("Katılım iptal edilemedi");
    }

    revalidatePath(`/events/${eventId}`);
}
