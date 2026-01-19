import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refreshing the auth token
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protected routes - redirect to login if not authenticated
    const protectedPaths = [
        "/chat",
        "/store",
        "/profile",
        "/community",
        "/crm",
        "/courses",
        "/events",
        "/live",
        "/email",
        "/payments",
        "/dashboard"
    ];
    const isProtectedPath = protectedPaths.some((path) =>
        request.nextUrl.pathname.startsWith(path)
    );

    if (isProtectedPath && !user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Redirect logged-in users away from auth pages
    const authPaths = ["/login", "/register"];
    const isAuthPath = authPaths.some((path) =>
        request.nextUrl.pathname.startsWith(path)
    );

    if (isAuthPath && user) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard"; // Redirect to dashboard instead of root
        return NextResponse.redirect(url);
    }

    // ONBOARDING CHECK
    if (user && !request.nextUrl.pathname.startsWith('/onboarding') && !request.nextUrl.pathname.includes('/api/')) {
        // Fetch profile to check onboarding status
        // Note: Middleware usually shouldn't do database queries for performance, 
        // but for critical onboarding gates it's acceptable or we use custom claims.
        // For now we query the profile table.
        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

        // If onboarding is NOT completed, force redirect to /onboarding
        if (profile && !profile.onboarding_completed) {
            const url = request.nextUrl.clone();
            url.pathname = "/onboarding";
            return NextResponse.redirect(url);
        }
    }

    // Loop Prevention: If onboarding IS completed but user tries to go to /onboarding, redirect to dashboard
    if (user && request.nextUrl.pathname.startsWith('/onboarding')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

        if (profile && profile.onboarding_completed) {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
