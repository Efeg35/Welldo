import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Clock, BarChart3, Edit3, Settings, MoreHorizontal } from "lucide-react";

interface CourseDashboardPageProps {
    params: Promise<{
        slug: string; // Community slug
        channelSlug: string; // Course slug
    }>;
}

export default async function CourseDashboardPage({ params }: CourseDashboardPageProps) {
    const { slug, channelSlug } = await params;
    const supabase = await createClient();

    // Verify user is instructor/admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'instructor' && profile?.role !== 'admin') {
        redirect(`/community/${slug}/${channelSlug}`); // Redirect to student view
    }

    // Fetch Course
    const { data: course } = await supabase
        .from('channels')
        .select('*')
        .eq('slug', channelSlug)
        .eq('type', 'course')
        .single();

    if (!course) notFound();

    const stats = [
        { label: "Waitlist", value: "0", icon: Clock },
        { label: "Average completion rate", value: "0%", icon: BarChart3 },
    ];

    return (
        <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto">
            {/* Header */}
            <div className="border-b px-6 py-4 flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <h1 className="font-semibold text-lg">{course.name}</h1>
                </div>
                <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </Button>
            </div>

            <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
                {/* Title & Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Course dashboard</h2>
                        <div className="flex items-center gap-3 mt-2 text-muted-foreground text-sm">
                            <span className="flex items-center gap-1.5">
                                Status: <span className="text-foreground font-medium capitalize">{course.settings?.status || 'Draft'}</span>
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span className="flex items-center gap-1.5">
                                Course type: <span className="text-foreground font-medium capitalize border-b border-dotted border-muted-foreground">{course.settings?.course_type || 'Self-paced'}</span>
                            </span>
                        </div>
                    </div>
                    <Button>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit lessons
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="bg-card border rounded-xl p-6 flex flex-col justify-between h-32">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-muted-foreground">{stat.label}</span>
                                    <Icon className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <span className="text-3xl font-bold">{stat.value}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State / Content */}
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <h3 className="text-xl font-semibold">This course is in draft mode.</h3>
                    <p className="text-muted-foreground max-w-md">
                        Engagement data will show up here once you publish your course.
                    </p>
                </div>
            </div>
        </div>
    );
}
