"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Eye, EyeOff, Plus, HelpCircle, Columns, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Channel } from "@/types";
import { updateChannel } from "@/actions/community";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { SpaceMembers } from "./space-members";
import { ChannelPaywallTab } from "@/components/courses/course-paywall-tab";
import { Profile } from "@/types";

interface ChannelSettingsOverlayProps {
    channel: Channel;
    members?: Profile[];
    isAdmin?: boolean;
    onClose: () => void;
}

type Tab = 'customize' | 'paywalls' | 'members';

const tabs: { id: Tab; label: string }[] = [
    { id: 'customize', label: 'Özelleştir' },
    { id: 'paywalls', label: 'Ödeme Duvarları' },
    { id: 'members', label: 'Üyeler' },
];

export function ChannelSettingsOverlay({ channel, members = [], isAdmin = false, onClose }: ChannelSettingsOverlayProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>(isAdmin ? 'customize' : 'members');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mobileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [name, setName] = useState(channel.name);
    const [slug, setSlug] = useState(channel.slug);
    const [category, setCategory] = useState(channel.category || "Alanlar");
    const [accessLevel, setAccessLevel] = useState<Channel['access_level']>(channel.access_level || 'open');

    // Settings JSONB State
    const settings = channel.settings || {};
    const [hideFromSidebar, setHideFromSidebar] = useState(settings.hide_from_sidebar || false);
    const [layout, setLayout] = useState(settings.layout || 'feed'); // feed, list, card
    const [showRightSidebar, setShowRightSidebar] = useState(settings.show_right_sidebar !== false); // Default true
    const [showMemberBlock, setShowMemberBlock] = useState(settings.show_member_block !== false); // Default true
    const [topics, setTopics] = useState<string[]>(settings.topics || []);
    const [forceTopicSelection, setForceTopicSelection] = useState(settings.force_topic_selection || false);
    const [coverImageUrl, setCoverImageUrl] = useState(settings.cover_image_url || "");
    const [mobileThumbnailUrl, setMobileThumbnailUrl] = useState(settings.mobile_thumbnail_url || "");

    const [newTopic, setNewTopic] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Permissions State
    const [allowMembersToInvite, setAllowMembersToInvite] = useState(settings.allow_members_to_invite !== false); // Default true
    const [allowMembersToCreatePosts, setAllowMembersToCreatePosts] = useState(settings.allow_members_to_create_posts !== false); // Default true
    const [allowPostTitle, setAllowPostTitle] = useState(settings.allow_post_title !== false); // Default true
    const [allowCoverImages, setAllowCoverImages] = useState(settings.allow_cover_images !== false); // Default true
    const [hideMemberCount, setHideMemberCount] = useState(settings.hide_member_count || false); // Default false

    // Prevent body scroll when open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'mobile') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const supabase = createBrowserClient();

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${channel.id}-${type}-${Math.random()}.${fileExt}`;
            const filePath = `channel-assets/${fileName}`;

            // We use 'course_assets' bucket for now as a shared asset bucket, or 'public' if available
            // Assuming 'course_assets' is public-read
            const { error: uploadError } = await supabase.storage
                .from('course_assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('course_assets')
                .getPublicUrl(filePath);

            if (type === 'cover') setCoverImageUrl(publicUrl);
            else setMobileThumbnailUrl(publicUrl);

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
            await updateChannel(channel.id, {
                name,
                slug,
                category,
                access_level: accessLevel,
                settings: {
                    ...settings,
                    hide_from_sidebar: hideFromSidebar,
                    layout,
                    show_right_sidebar: showRightSidebar,
                    show_member_block: showMemberBlock,
                    topics,
                    force_topic_selection: forceTopicSelection,
                    cover_image_url: coverImageUrl,
                    mobile_thumbnail_url: mobileThumbnailUrl,
                    // Permissions
                    allow_members_to_invite: allowMembersToInvite,
                    allow_members_to_create_posts: allowMembersToCreatePosts,
                    allow_post_title: allowPostTitle,
                    allow_cover_images: allowCoverImages,
                    hide_member_count: hideMemberCount
                }
            });
            toast.success("Ayarlar kaydedildi");
            router.refresh();
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

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-50 bg-white flex flex-col"
            >
                {/* Header */}
                <div className="h-16 border-b flex items-center justify-between px-4 bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
                            <X className="w-5 h-5 text-gray-500" />
                        </Button>
                        <h2 className="font-bold text-lg hidden md:block">{channel.name}</h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar mx-4">
                        <div className="flex items-center space-x-1">
                            {tabs.filter(t => isAdmin || t.id === 'members').map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
                                        activeTab === tab.id
                                            ? "bg-gray-100 text-gray-900"
                                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-[100px] flex justify-end"></div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-white">
                    {activeTab === 'customize' && (
                        <div className="max-w-3xl mx-auto py-10 px-6 pb-32 space-y-12">

                            {/* General */}
                            <section className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900">Genel</h3>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold text-gray-700">Alan adı</Label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="h-10 border-gray-200 focus-visible:ring-gray-900"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold text-gray-700">Alan grubu</Label>
                                        <Select value={category} onValueChange={setCategory}>
                                            <SelectTrigger className="h-10 border-gray-200 focus-visible:ring-gray-900">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Alanlar">Alanlar</SelectItem>
                                                <SelectItem value="Genel">Genel</SelectItem>
                                                <SelectItem value="Üyeler">Üyeler</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>


                                    <div className="space-y-1.5 pt-2">
                                        <Label className="text-sm font-semibold text-gray-700">URL Kısa Adı (Slug)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">/community/</span>
                                            <Input
                                                value={slug}
                                                onChange={(e) => setSlug(e.target.value)}
                                                className="h-10 pl-24 border-gray-200 focus-visible:ring-gray-900"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <hr className="border-gray-100" />

                            {/* Access */}
                            <section className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900">Erişim</h3>

                                <RadioGroup value={accessLevel} onValueChange={(val) => setAccessLevel(val as any)} className="space-y-6">
                                    {/* Open */}
                                    <div className="flex items-start gap-3">
                                        <RadioGroupItem value="open" id="open" className="mt-1" />
                                        <div className="space-y-1.5" onClick={() => setAccessLevel('open')}>
                                            <Label htmlFor="open" className="font-bold text-base cursor-pointer">Açık</Label>
                                            <div className="space-y-1 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Lock className="w-3 h-3" /> <span className="text-gray-600">Erişim:</span> Açık. Topluluğunuzdaki herkes bu alanı görebilir ve katılabilir.
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Eye className="w-3 h-3" /> <span className="text-gray-600">Görünürlük:</span> Tüm topluluk üyeleri tarafından görülebilir.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Private */}
                                    <div className="flex items-start gap-3">
                                        <RadioGroupItem value="private" id="private" className="mt-1" />
                                        <div className="space-y-1.5" onClick={() => setAccessLevel('private')}>
                                            <Label htmlFor="private" className="font-bold text-base cursor-pointer">Gizli</Label>
                                            <div className="space-y-1 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Lock className="w-3 h-3" /> <span className="text-gray-600">Erişim:</span> Kapalı. Sadece sizin eklediğiniz veya ödeme yapan üyeler erişebilir.
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <EyeOff className="w-3 h-3" /> <span className="text-gray-600">Görünürlük:</span> Sadece davetli üyeler. Üye olmayanlar kilit ekranını görür.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Secret */}
                                    <div className="flex items-start gap-3">
                                        <RadioGroupItem value="secret" id="secret" className="mt-1" />
                                        <div className="space-y-1.5" onClick={() => setAccessLevel('secret')}>
                                            <Label htmlFor="secret" className="font-bold text-base cursor-pointer">Tam Gizli</Label>
                                            <div className="space-y-1 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Lock className="w-3 h-3" /> <span className="text-gray-600">Erişim:</span> Kapalı. Sadece sizin eklediğiniz veya ödeme yapan üyeler erişebilir.
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <EyeOff className="w-3 h-3" /> <span className="text-gray-600">Görünürlük:</span> Sadece davetli üyeler. Diğerleri bu alanın varlığını göremez.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </RadioGroup>
                            </section>

                            <hr className="border-gray-100" />

                            {/* Permissions */}
                            <section className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900">İzinler & Etiketler</h3>

                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-semibold text-gray-900">Üyelerin başkalarını eklemesine izin ver</Label>
                                        </div>
                                        <Switch checked={allowMembersToInvite} onCheckedChange={setAllowMembersToInvite} />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-semibold text-gray-900">Üyelerin gönderi oluşturmasına izin ver</Label>
                                        </div>
                                        <Switch checked={allowMembersToCreatePosts} onCheckedChange={setAllowMembersToCreatePosts} />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-semibold text-gray-900">Gönderi başlığına izin ver</Label>
                                        </div>
                                        <Switch checked={allowPostTitle} onCheckedChange={setAllowPostTitle} />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-semibold text-gray-900">Kapak görsellerine izin ver</Label>
                                        </div>
                                        <Switch checked={allowCoverImages} onCheckedChange={setAllowCoverImages} />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-semibold text-gray-900">Üye sayısını gizle</Label>
                                        </div>
                                        <Switch checked={hideMemberCount} onCheckedChange={setHideMemberCount} />
                                    </div>
                                </div>
                            </section>

                            <hr className="border-gray-100" />
                            {/* Topic Navigation */}
                            <section className="space-y-6">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-gray-900">Konu navigasyonu</h3>
                                    <p className="text-sm text-gray-500">Gönderilerinizi kategorize edin ve üyelerin konu çubuğu ile filtrelemesine izin verin. Alan başına 20 konu tanımlayabilirsiniz.</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2 min-h-[44px] p-2 border border-gray-200 rounded-lg bg-white focus-within:ring-1 focus-within:ring-gray-900 focus-within:border-gray-900">
                                        {topics.map((topic, index) => (
                                            <span key={index} className="bg-gray-100 border border-gray-200 px-2 py-1 rounded-md text-sm flex items-center gap-2 font-medium">
                                                {topic}
                                                <button onClick={() => removeTopic(index)} className="hover:text-red-500 text-gray-500">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                        {topics.length < 20 && (
                                            <input
                                                value={newTopic}
                                                onChange={(e) => setNewTopic(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                                                placeholder={topics.length === 0 ? "Konu seçin (örn. Duyurular)" : ""}
                                                className="flex-1 min-w-[120px] outline-none text-sm bg-transparent h-7"
                                            />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">Enter tuşuna basarak konuyu ekleyin.</p>

                                    <div className="flex items-center gap-2 pt-2">
                                        <Switch
                                            checked={forceTopicSelection}
                                            onCheckedChange={setForceTopicSelection}
                                            id="force-topic"
                                        />
                                        <div className="flex items-center gap-1">
                                            <Label htmlFor="force-topic" className="text-sm text-gray-700 font-medium cursor-pointer">Üyeleri konu seçmeye zorunlu kıl</Label>
                                            <HelpCircle className="w-3 h-3 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <hr className="border-gray-100" />

                            {/* Images */}
                            <section className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900">Görseller</h3>

                                <div className="space-y-6">
                                    {/* Cover Image */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold text-gray-700">Kapak görseli</Label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="h-8"
                                            >
                                                Yükle
                                            </Button>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Önerilen boyutlar: 1600x500px (16:5 en boy oranı).
                                        </p>

                                        {coverImageUrl && (
                                            <div className="relative w-full aspect-[16/5] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                                                <img src={coverImageUrl} className="w-full h-full object-cover" alt="Cover" />
                                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>Değiştir</Button>
                                                </div>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'cover')}
                                        />
                                    </div>

                                    {/* Mobile Thumbnail */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold text-gray-700">Mobil küçük resim</Label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => mobileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="h-8"
                                            >
                                                Yükle
                                            </Button>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Mobil web ve uygulamalar için kapak görseli. 16:9 en boy oranı, min 800x450px.
                                        </p>

                                        {mobileThumbnailUrl && (
                                            <div className="relative w-48 aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                                                <img src={mobileThumbnailUrl} className="w-full h-full object-cover" alt="Mobile Thumbnail" />
                                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button variant="secondary" size="sm" onClick={() => mobileInputRef.current?.click()}>Değiştir</Button>
                                                </div>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={mobileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'mobile')}
                                        />
                                    </div>
                                </div>
                            </section>

                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="max-w-4xl mx-auto py-10 px-6 pb-32">
                            <SpaceMembers
                                channelId={channel.id}
                                initialMembers={members}
                                hideMemberCount={hideMemberCount}
                                allowInvite={allowMembersToInvite}
                                isAdmin={isAdmin}
                            />
                        </div>
                    )}

                    {activeTab === 'paywalls' && (
                        <div className="max-w-4xl mx-auto py-10 px-6 pb-32">
                            <ChannelPaywallTab channelId={channel.id} />
                        </div>
                    )}

                </div>

                {/* Sticky Footer */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-center gap-3 z-50">
                    {isAdmin ? (
                        <>
                            <Button variant="outline" onClick={onClose} className="px-8 rounded-full border-gray-300">İptal</Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-gray-900 text-white hover:bg-gray-800 px-8 h-10 shadow-lg rounded-full"
                            >
                                {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={onClose} className="bg-gray-900 text-white hover:bg-gray-800 px-12 h-10 shadow-lg rounded-full">
                            Kapat
                        </Button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
