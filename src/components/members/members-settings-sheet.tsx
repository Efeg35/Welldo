"use client";

import { useState, useRef } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Image, Upload, X, Loader2 } from "lucide-react";
import { updateCommunityBanner, WelcomeBannerSettings, updateCoverPhoto } from "@/actions/community-settings";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type SettingsTab = "banner" | "cover" | null;

interface MembersSettingsSheetProps {
    openTab: SettingsTab;
    onClose: () => void;
    communityName?: string;
    communityId: string;
}

export function MembersSettingsSheet({ openTab, onClose, communityName = "WellDo", communityId }: MembersSettingsSheetProps) {
    // Banner States
    const [bannerTitle, setBannerTitle] = useState(`${communityName} Ailesine Hoş Geldin!`);
    const [bannerDescription, setBannerDescription] = useState("İlk iş etkinliklere göz at.");
    const [showCta, setShowCta] = useState(true);
    const [bannerImage, setBannerImage] = useState<string | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Cover States
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);

    // Refs
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const isOpen = openTab !== null;
    const isBanner = openTab === "banner";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string | null) => void, setFile: (file: File | null) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
            const url = URL.createObjectURL(file);
            setUrl(url);
        }
    };

    const uploadImage = async (file: File) => {
        const supabase = createClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `community-${communityId}-${Math.random()}.${fileExt}`;
        const filePath = `community-assets/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('community-assets')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('community-assets')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (isBanner) {
                let finalBannerUrl = bannerImage;

                if (bannerFile) {
                    finalBannerUrl = await uploadImage(bannerFile);
                }

                const settings: WelcomeBannerSettings = {
                    title: bannerTitle,
                    description: bannerDescription,
                    image_url: finalBannerUrl,
                    show_button: showCta,
                    button_text: "Etkinlikleri Gör"
                };
                await updateCommunityBanner(communityId, settings);
                toast.success("Hoşgeldin panosu kaydedildi");
                onClose();
            } else {
                let finalCoverUrl = coverImage;

                if (coverFile) {
                    finalCoverUrl = await uploadImage(coverFile);
                }

                // Cover photo is saved separately
                await updateCoverPhoto(communityId, finalCoverUrl);
                toast.success("Kapak fotoğrafı kaydedildi");
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error("Kaydedilirken bir hata oluştu");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="text-xl font-bold">
                        {isBanner ? "Hoşgeldin Panosu" : "Kapak Fotoğrafı"}
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                    {/* Hidden Inputs */}
                    <input
                        type="file"
                        ref={bannerInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setBannerImage, setBannerFile)}
                    />
                    <input
                        type="file"
                        ref={coverInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setCoverImage, setCoverFile)}
                    />

                    {isBanner ? (
                        // BANNER SETTINGS
                        <div className="space-y-6">
                            {/* Preview */}
                            <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                                <div className="p-2 border-b border-gray-100 text-xs font-medium text-gray-500">Önizleme</div>
                                <div className="relative h-48 w-full bg-gray-900 flex items-center justify-center text-center p-6 text-white bg-cover bg-center"
                                    style={bannerImage ? { backgroundImage: `url(${bannerImage})` } : {}}
                                >
                                    {bannerImage && <div className="absolute inset-0 bg-black/50" />}
                                    <div className="relative z-10 space-y-2 max-w-sm">
                                        <h3 className="font-bold text-lg leading-tight">{bannerTitle || "Başlık"}</h3>
                                        <p className="text-sm opacity-90">{bannerDescription || "Açıklama"}</p>
                                        {showCta && (
                                            <Button size="sm" variant="secondary" className="mt-2 h-7 text-xs">
                                                Etkinlikleri Gör
                                            </Button>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => { setBannerImage(null); setBannerFile(null); }}
                                        className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                                    >
                                        <X className="w-4 h-4 text-white/70" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-gray-900">Başlık</Label>
                                    <Input
                                        value={bannerTitle}
                                        onChange={(e) => setBannerTitle(e.target.value)}
                                        placeholder="Panonuzun başlığı"
                                        className="h-10 rounded-lg border-gray-200"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-gray-900">Açıklama</Label>
                                    <Textarea
                                        value={bannerDescription}
                                        onChange={(e) => setBannerDescription(e.target.value)}
                                        placeholder="Kısa bir açıklama yazın"
                                        rows={3}
                                        className="rounded-lg border-gray-200 resize-none"
                                    />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label className="text-sm font-semibold text-gray-900">Arka Plan Görseli</Label>
                                    <div
                                        onClick={() => bannerInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-gray-500"
                                    >
                                        <Image className="w-8 h-8 opacity-50" />
                                        <span className="text-sm">Görsel yüklemek için tıklayın</span>
                                    </div>
                                    {bannerImage && (
                                        <Button variant="outline" size="sm" onClick={() => { setBannerImage(null); setBannerFile(null); }} className="w-full text-red-600 hover:text-red-700 h-9">
                                            Görseli Kaldır
                                        </Button>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-semibold text-gray-900">Buton Göster</Label>
                                        <div className="text-xs text-muted-foreground">Etkinliklere yönlendiren butonu göster.</div>
                                    </div>
                                    <Switch checked={showCta} onCheckedChange={setShowCta} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        // COVER SETTINGS
                        <div className="space-y-6">
                            {/* Preview */}
                            <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                                <div className="p-2 border-b border-gray-100 text-xs font-medium text-gray-500">Önizleme</div>
                                <div className="h-32 w-full bg-gray-200 flex items-center justify-center text-gray-400 bg-cover bg-center"
                                    style={coverImage ? { backgroundImage: `url(${coverImage})` } : {}}
                                >
                                    {!coverImage && <span className="text-sm">Kapak Görseli Yok</span>}
                                </div>
                                <div className="h-16 bg-white border-t border-gray-200 relative">
                                    <div className="absolute -top-8 left-6 w-16 h-16 bg-gray-300 rounded-full border-4 border-white" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-gray-900">Kapak Görseli</Label>
                                <div
                                    onClick={() => coverInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-lg p-8 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 text-gray-500"
                                >
                                    <Upload className="w-8 h-8 opacity-50" />
                                    <div className="text-center">
                                        <span className="text-sm font-medium text-gray-900">Yüklemek için tıklayın</span>
                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (Max 2MB)</p>
                                    </div>
                                </div>
                                {coverImage && (
                                    <Button variant="outline" size="sm" onClick={() => { setCoverImage(null); setCoverFile(null); }} className="w-full text-red-600 hover:text-red-700 h-9">
                                        Görseli Kaldır
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 mt-auto border-t bg-white">
                    <Button
                        className="w-full bg-[#1c1c1c] hover:bg-black text-white h-11 rounded-lg font-medium transition-all"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Kaydediliyor...
                            </>
                        ) : (
                            "Ayarları kaydet"
                        )}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
