"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Channel, Profile } from "@/types";
import { updateChannel, updateChannelSettings } from "@/actions/community";
import { toast } from "sonner";
import { SpaceMembers } from "./space-members";
import { Lock, Eye, EyeOff, Info, Globe, X, Layout } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface SpaceSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    channel: Channel;
    members?: Profile[];
    isAdmin?: boolean;
}

export function SpaceSettingsDialog({ open, onOpenChange, channel, members = [], isAdmin = false }: SpaceSettingsDialogProps) {
    const [name, setName] = useState(channel.name);
    const [description, setDescription] = useState(channel.description || "");
    const [category, setCategory] = useState(channel.category || "Alanlar");
    const [accessLevel, setAccessLevel] = useState<Channel['access_level']>(channel.access_level || 'open');
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'customize' | 'members'>('customize');

    // Prevent body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [open]);

    // Save All Settings
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update Core Channel Data
            await updateChannel(channel.id, {
                name,
                description,
                category,
                access_level: accessLevel
            });

            toast.success("Ayarlar güncellendi");
            onOpenChange(false);
        } catch (error) {
            toast.error("Güncellenemedi");
        } finally {
            setIsSaving(false);
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            {open && (
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
                            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full hover:bg-gray-100">
                                <X className="w-5 h-5 text-gray-500" />
                            </Button>
                            <h2 className="font-bold text-lg hidden md:block">{channel.name}</h2>
                        </div>

                        {/* Tabs */}
                        <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar mx-4">
                            <div className="flex items-center space-x-1">
                                {[
                                    { id: 'customize', label: 'Özelleştir' },
                                    { id: 'members', label: 'Üyeler' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
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

                        {/* Actions Placeholder */}
                        <div className="w-[100px] flex justify-end">
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto bg-gray-50/30">
                        <div className="max-w-4xl mx-auto p-6 md:p-10 pb-[400px]">

                            {activeTab === 'customize' && (
                                <div className="space-y-12">
                                    {/* General Section */}
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-gray-900">Genel</h2>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-gray-900">Grup ismi</Label>
                                                <Input
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder=""
                                                    className="max-w-xl bg-white"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-gray-900">Açıklama</Label>
                                                <Textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    placeholder="Alan açıklaması..."
                                                    className="max-w-xl bg-white min-h-[100px] resize-none"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-gray-900">Alan grubu</Label>
                                                <div className="max-w-xs">
                                                    <Select value={category} onValueChange={setCategory}>
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue placeholder="Grup seçin" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Alanlar">Alanlar</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Access Section */}
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-gray-900">Erişim</h2>

                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-semibold text-gray-900">Alanı yayınlayın</Label>
                                                <p className="text-sm text-gray-500">Alanı yayınlamaya hazır olduğunuzda, lütfen aşağıdaki erişim ayarlarından birini seçin:</p>
                                            </div>

                                            <RadioGroup value={accessLevel} onValueChange={(v) => setAccessLevel(v as Channel['access_level'])} className="space-y-6 pt-2">
                                                {/* Open */}
                                                <div className="flex items-start gap-3">
                                                    <RadioGroupItem value="open" id="open" className="mt-1" />
                                                    <div className="space-y-1">
                                                        <Label htmlFor="open" className="font-bold text-gray-900 cursor-pointer">Açık</Label>
                                                        <div className="text-sm text-gray-500 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <Lock className="w-3 h-3 text-gray-400" />
                                                                Erişilebilirlik: Açık. Topluluğunuzdaki herkes görebilir ve katılabilir.
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Eye className="w-3 h-3 text-gray-400" />
                                                                Görünürlük: Tüm topluluk üyeleri tarafından görülebilir.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Private */}
                                                <div className="flex items-start gap-3">
                                                    <RadioGroupItem value="private" id="private" className="mt-1" />
                                                    <div className="space-y-1">
                                                        <Label htmlFor="private" className="font-bold text-gray-900 cursor-pointer">Özel</Label>
                                                        <div className="text-sm text-gray-500 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <Lock className="w-3 h-3 text-gray-400" />
                                                                Erişilebilirlik: Kilitli. Sadece üyeler erişebilir.
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Eye className="w-3 h-3 text-gray-400" />
                                                                Görünürlük: Herkes görebilir ancak içerik kilitlidir.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Secret */}
                                                <div className="flex items-start gap-3">
                                                    <RadioGroupItem value="secret" id="secret" className="mt-1" />
                                                    <div className="space-y-1">
                                                        <Label htmlFor="secret" className="font-bold text-gray-900 cursor-pointer">Gizli</Label>
                                                        <div className="text-sm text-gray-500 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <Lock className="w-3 h-3 text-gray-400" />
                                                                Erişilebilirlik: Kapalı. Sadece sizin tarafınızdan eklenen veya bir ödeme duvarı üzerinden satın alan üyeler erişebilir.
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <EyeOff className="w-3 h-3 text-gray-400" />
                                                                Görünürlük: Sadece üyeler görebilir. Listelerde görünmez.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'members' && (
                                <SpaceMembers
                                    channelId={channel.id}
                                    initialMembers={members}
                                    hideMemberCount={channel.settings?.hide_member_count}
                                    allowInvite={channel.settings?.allow_members_to_invite}
                                    isAdmin={isAdmin}
                                />
                            )}

                        </div>
                    </div>

                    {/* Footer Action Bar */}
                    <div className="h-20 border-t bg-white flex items-center justify-center px-10 shrink-0 z-10 sticky bottom-0">
                        <div className="max-w-4xl w-full flex items-center justify-center gap-4">
                            <Button variant="ghost" onClick={() => onOpenChange(false)}>
                                İptal
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving} className="bg-gray-900 text-white hover:bg-gray-800 px-8">
                                {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
