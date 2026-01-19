import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateCourseButton } from "@/components/courses/create-course-button";

export default async function CoursesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user role
    let isInstructor = false;
    let mainCommunityId = null;
    let mainCommunitySlug = null;

    if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'instructor' || profile?.role === 'admin') {
            isInstructor = true;
        }

        // Get first community (assumption: working with one community context for now)
        const { data: community } = await supabase.from('communities').select('id, slug').limit(1).single();
        if (community) {
            mainCommunityId = community.id;
            mainCommunitySlug = community.slug;
        }
    }

    // Fetch existing courses
    const { data: courses } = await supabase
        .from('channels')
        .select('*')
        .eq('type', 'course')
        .order('created_at', { ascending: false });

    return (
        <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
            {/* Header */}
            <div className="border-b px-6 py-4 flex items-center justify-between bg-card">
                <h1 className="text-2xl font-bold tracking-tight">Kurslar</h1>
                {isInstructor && mainCommunityId && (
                    <CreateCourseButton
                        communityId={mainCommunityId}
                        communitySlug={mainCommunitySlug!}
                    />
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {courses && courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <div key={course.id} className="group relative bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                <div className="aspect-video bg-muted relative">
                                    {/* Cover Image Placeholder */}
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50 text-sm font-medium">
                                        Kapak Görseli Yok
                                    </div>
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isInstructor && (
                                            <Button variant="secondary" size="sm" className="h-8 text-xs" asChild>
                                                <a href={`/community/${mainCommunitySlug}/${course.slug}/dashboard`}>Yönet</a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold truncate">{course.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {course.description || "Açıklama yok."}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                            <Plus className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold">İlk kursunuzu oluşturun</h2>
                        <p className="text-muted-foreground max-w-md">
                            Topluluğunuzda ilgi çekici öğrenme deneyimleri sunun.
                        </p>
                        {isInstructor && mainCommunityId && (
                            <CreateCourseButton
                                communityId={mainCommunityId}
                                communitySlug={mainCommunitySlug!}
                                label="Kurs oluştur"
                                size="lg"
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
