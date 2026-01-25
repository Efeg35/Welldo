"use client";

import React from 'react';
import { X, Lock, Eye, EyeOff, Image as ImageIcon, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Course, Channel } from "@/types";
import { updateChannel } from '@/actions/community';
import { updateCourse } from "@/actions/courses";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

interface CustomizeTabProps {
    course: Course;
    channel: Channel;
    onUpdate: () => void;
}

export function CustomizeTab({ course, channel, onUpdate }: CustomizeTabProps) {
    const [name, setName] = React.useState(channel.name);
    const [category, setCategory] = React.useState(channel.category || 'Alanlar');
    const [hideMemberCount, setHideMemberCount] = React.useState(channel.settings?.hide_member_count || false);
    const [accessLevel, setAccessLevel] = React.useState<Channel['access_level'] | null>(channel.access_level || null);
    const [topics, setTopics] = React.useState<string[]>(course.topics || []);
    const [thumbnailUrl, setThumbnailUrl] = React.useState(course.thumbnail_url);
    const [newTopic, setNewTopic] = React.useState("");
    const [isSaving, setIsSaving] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const supabase = createBrowserClient();

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${course.id}-${Math.random()}.${fileExt}`;
            const filePath = `thumbnails/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('course_assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('course_assets')
                .getPublicUrl(filePath);

            setThumbnailUrl(publicUrl);
            toast.success("Görsel yüklendi");
        } catch (error) {
            console.error(error);
            toast.error("Görsel yüklenemedi");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update Channel
            await updateChannel(channel.id, {
                name,
                category,
                access_level: accessLevel || undefined,
                settings: { ...channel.settings, hide_member_count: hideMemberCount }
            });

            // Update Course
            await updateCourse(course.id, {
                title: name,
                topics,
                thumbnail_url: thumbnailUrl,
                status: accessLevel ? 'published' : 'draft'
            });

            toast.success("Değişiklikler kaydedildi");
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error("Kaydedilirken bir hata oluştu");
        } finally {
            setIsSaving(false);
        }
    };

    const addTopic = () => {
        if (newTopic.trim() && topics.length < 20) {
            setTopics([...topics, newTopic.trim()]);
            setNewTopic("");
        }
    };

    const removeTopic = (index: number) => {
        setTopics(topics.filter((_, i) => i !== index));
    };

    React.useEffect(() => {
        if (window.location.hash === '#access') {
            // Small timeout to ensure DOM is ready
            setTimeout(() => {
                const element = document.getElementById('access');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 500);
        }
    }, []);

    return (
        <div className="max-w-3xl mx-auto space-y-12 pb-20">
            {/* General Settings */}
            <section className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Genel</h3>

                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Grup ismi</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Örn. Pilates Kursu"
                        className="h-10 border-gray-200 focus-visible:ring-gray-900"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Alan grubu</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-10 border-gray-200 focus-visible:ring-gray-900">
                            <SelectValue placeholder="Grup seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Alanlar">Alanlar</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

            </section>

            {/* Access Settings */}
            <section id="access" className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Erişim</h3>

                {course.status === 'draft' && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-900">
                        <Info className="w-5 h-5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-bold mb-1">Alanınız taslak modundadır.</p>
                            <p className="text-blue-800">Canlıya geçmek için erişim ayarlarınızı seçin ve alanı yayınlayın!</p>
                            <ul className="mt-3 space-y-2 list-none">
                                <li className="flex items-center gap-2">
                                    <Lock className="w-3 h-3" /> Erişilebilirlik: Sadece siz ve diğer yöneticiler görebilir.
                                </li>
                                <li className="flex items-center gap-2">
                                    <EyeOff className="w-3 h-3" /> Görünürlük: Siz ve yöneticiler dışında kimse göremez.
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <p className="font-bold text-gray-900">Alanı yayınlayın</p>
                    <p className="text-sm text-gray-500">Alanı yayınlamaya hazır olduğunuzda, lütfen aşağıdaki erişim ayarlarından birini seçin:</p>

                    <RadioGroup
                        value={accessLevel || ""}
                        onValueChange={(val) => setAccessLevel(val as any)}
                        className="space-y-6 pt-4"
                    >
                        <div className="flex items-start gap-3">
                            <RadioGroupItem value="open" id="open" className="mt-1" />
                            <div className="space-y-1.5 cursor-pointer" onClick={() => setAccessLevel('open')}>
                                <Label htmlFor="open" className="font-bold text-base cursor-pointer">Açık</Label>
                                <div className="space-y-1 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-3 h-3" /> Erişilebilirlik: Açık. Topluluğunuzdaki herkes görebilir ve katılabilir.
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-3 h-3" /> Görünürlük: Tüm topluluk üyeleri tarafından görülebilir.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <RadioGroupItem value="private" id="private" className="mt-1" />
                            <div className="space-y-1.5 cursor-pointer" onClick={() => setAccessLevel('private')}>
                                <Label htmlFor="private" className="font-bold text-base cursor-pointer">Gizli</Label>
                                <div className="space-y-1 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-3 h-3" /> Erişilebilirlik: Kapalı. Sadece sizin tarafınızdan eklenen veya bir ödeme duvarı üzerinden satın alan üyeler erişebilir.
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <EyeOff className="w-3 h-3" /> Görünürlük: Sadece davet edilen üyeler. Üye olmayanlar kilit ekranını görecektir.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <RadioGroupItem value="secret" id="secret" className="mt-1" />
                            <div className="space-y-1.5 cursor-pointer" onClick={() => setAccessLevel('secret')}>
                                <Label htmlFor="secret" className="font-bold text-base cursor-pointer">Gizli + Kapalı</Label>
                                <div className="space-y-1 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-3 h-3" /> Erişilebilirlik: Kapalı. Sadece sizin tarafınızdan eklenen veya bir ödeme duvarı üzerinden satın alan üyeler erişebilir.
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <EyeOff className="w-3 h-3" /> Görünürlük: Sadece davet edilen üyeler. Üye olmayanlar bu alanın varlığından haberdar olmayacaktır.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RadioGroup>

                    <div className="pt-8 border-t border-gray-100">
                        <h4 className="text-lg font-bold text-gray-900 mb-4">İzinler</h4>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base font-normal text-gray-900">Üye sayısını gizle</Label>
                            </div>
                            <Switch checked={hideMemberCount} onCheckedChange={setHideMemberCount} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Topics Management */}
            <section className="space-y-6">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-gray-900">Kurs konuları</h3>
                    <p className="text-sm text-gray-500">Kursunuzu kategorize edin ve üyelerin kurs dizinindeki konu navigasyon çubuğu ile kursları filtrelemesine olanak tanıyın. Kurs başına en fazla 20 konu tanımlayabilirsiniz.</p>
                </div>

                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-gray-200 rounded-lg bg-gray-50/50">
                        {topics.map((topic, index) => (
                            <span key={index} className="bg-white border border-gray-200 px-2 py-1 rounded-md text-sm flex items-center gap-2 shadow-sm animate-in fade-in zoom-in duration-200">
                                {topic}
                                <button onClick={() => removeTopic(index)} className="hover:text-red-500">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        {topics.length === 0 && <span className="text-gray-400 text-sm p-1">Henüz konu eklenmedi...</span>}
                    </div>

                    <div className="flex gap-2">
                        <Input
                            value={newTopic}
                            onChange={(e) => setNewTopic(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                            placeholder="Konu ekleyin (örn. Yoga, Beslenme)"
                            className="h-10 border-gray-200 focus-visible:ring-gray-900"
                            disabled={topics.length >= 20}
                        />
                        <Button
                            variant="outline"
                            onClick={addTopic}
                            disabled={!newTopic.trim() || topics.length >= 20}
                            className="h-10 px-4"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Ekle
                        </Button>
                    </div>
                </div>
            </section>

            {/* Image Management */}
            <section className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Görseller</h3>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-900">Mobil küçük resim</Label>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Kurslar sekmesi için 16:9 en boy oranına sahip bir küçük resim yükleyin. Minimum görsel boyutu: 800x450 piksel.
                        </p>
                        <div className="relative aspect-video bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 group transition-colors hover:bg-gray-50 hover:border-gray-300 overflow-hidden">
                            {thumbnailUrl ? (
                                <img src={thumbnailUrl} className="absolute inset-0 w-full h-full object-cover" alt="Thumbnail" />
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center gap-2">
                                    <ImageIcon className="w-8 h-8" />
                                    <span className="text-xs font-medium">Görsel seçilmedi</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="bg-white shadow-lg"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Yükleniyor...' : 'Değiştir'}
                                </Button>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Sticky Actions Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-center gap-3 z-50">
                <Button variant="ghost" onClick={onUpdate} className="px-8">İptal</Button>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gray-900 text-white hover:bg-gray-800 px-8 h-10 shadow-lg"
                >
                    {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
                </Button>
            </div>
        </div>
    );
}
