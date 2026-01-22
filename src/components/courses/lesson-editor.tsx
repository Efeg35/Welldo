import { useState, useRef } from "react";
import { ArrowLeft, PlayCircle, Eye, ChevronRight, Loader2, Upload, X, FileText, Plus, Trash2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { updateLesson } from "@/actions/courses";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CourseLesson } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface LessonEditorProps {
    lesson: CourseLesson;
    onBack: () => void;
    onUpdate: (updatedLesson: CourseLesson) => void;
}

export function LessonEditor({ lesson, onBack, onUpdate }: LessonEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState(lesson.title);
    const [content, setContent] = useState(lesson.content || "");
    const [status, setStatus] = useState<'draft' | 'published'>(lesson.status);
    const [videoUrl, setVideoUrl] = useState(lesson.video_url || "");
    const [tempVideoUrl, setTempVideoUrl] = useState(lesson.video_url || "");
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [attachments, setAttachments] = useState<any[]>(lesson.attachments || []);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
    const attachmentInputRef = useRef<HTMLInputElement>(null);

    // Settings state
    const [settings, setSettings] = useState({
        enable_featured_media: lesson.settings?.enable_featured_media ?? true,
        enable_comments: lesson.settings?.enable_comments ?? true,
        enforce_video_completion: lesson.settings?.enforce_video_completion ?? false,
        auto_advance: lesson.settings?.auto_advance ?? false
    });

    const [isSaving, setIsSaving] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState("general");
    const [mediaTab, setMediaTab] = useState<'upload' | 'embed'>('embed');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedData = {
                title,
                content,
                status,
                video_url: videoUrl,
                settings,
                attachments
            };

            await updateLesson(lesson.id, updatedData);
            onUpdate({ ...lesson, ...updatedData });
            toast.success("Ders kaydedildi");
        } catch (error) {
            toast.error("Kaydedilirken bir hata oluştu");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingMedia(true);
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${lesson.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('lesson_media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('lesson_media')
                .getPublicUrl(filePath);

            setVideoUrl(publicUrl);
            setTempVideoUrl(publicUrl);
            setIsMediaModalOpen(false);
            toast.success("Medya yüklendi");
        } catch (error) {
            console.error("Failed to upload media", error);
            toast.error("Yükleme başarısız oldu");
        } finally {
            setIsUploadingMedia(false);
        }
    };

    const handleEmbed = () => {
        setVideoUrl(tempVideoUrl);
        setIsMediaModalOpen(false);
        toast.success("Medya bağlantısı eklendi");
    };

    const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingAttachment(true);
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${lesson.id}/attachments/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('lesson_media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('lesson_media')
                .getPublicUrl(filePath);

            const newAttachment = {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                url: publicUrl,
                type: file.type,
                size: file.size,
                path: filePath
            };

            setAttachments([...attachments, newAttachment]);
            toast.success("Dosya eklendi");
        } catch (error) {
            console.error("Failed to upload attachment", error);
            toast.error("Dosya yüklenemedi");
        } finally {
            setIsUploadingAttachment(false);
        }
    };

    const handleRemoveAttachment = async (id: string, path: string) => {
        try {
            const supabase = createClient();
            await supabase.storage.from('lesson_media').remove([path]);
            setAttachments(attachments.filter(a => a.id !== id));
            toast.success("Dosya silindi");
        } catch (error) {
            console.error(error);
            toast.error("Dosya silinemedi");
        }
    };

    return (
        <div className="flex h-full bg-white animate-in slide-in-from-right duration-300">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-200 flex flex-col h-full bg-gray-50/30">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-500 gap-2 pl-0 hover:pl-2 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                        Ders listesine dön
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Tabs (Visual only for now matching screenshot) */}
                    <div className="flex items-center gap-6 border-b border-gray-200 pb-2 mb-6">
                        <button
                            className={cn("text-sm font-medium pb-2 -mb-2.5 border-b-2 transition-colors", activeSidebarTab === "general" ? "border-black text-black" : "border-transparent text-gray-500")}
                            onClick={() => setActiveSidebarTab("general")}
                        >
                            Genel
                        </button>
                        <button
                            className={cn("text-sm font-medium pb-2 -mb-2.5 border-b-2 transition-colors", activeSidebarTab === "files" ? "border-black text-black" : "border-transparent text-gray-500")}
                            onClick={() => setActiveSidebarTab("files")}
                        >
                            Dosyalar
                        </button>
                    </div>

                    {/* Main Sidebar Content */}
                    {activeSidebarTab === "general" ? (
                        <div className="space-y-8">
                            {/* Status */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900">Durum</h3>
                                <RadioGroup value={status} onValueChange={(v: 'draft' | 'published') => setStatus(v)}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="draft" id="draft" />
                                        <Label htmlFor="draft" className="font-medium text-gray-700">Taslak</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="published" id="published" />
                                        <Label htmlFor="published" className="font-medium text-gray-700">Yayınlandı</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <Separator />

                            {/* Settings */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900">Ayarlar</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="featured_media"
                                            checked={settings.enable_featured_media}
                                            onCheckedChange={(checked) => setSettings({ ...settings, enable_featured_media: !!checked })}
                                        />
                                        <Label htmlFor="featured_media" className="text-gray-600 font-normal">Öne çıkan medya etkin</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="comments"
                                            checked={settings.enable_comments}
                                            onCheckedChange={(checked) => setSettings({ ...settings, enable_comments: !!checked })}
                                        />
                                        <Label htmlFor="comments" className="text-gray-600 font-normal">Yorumlar etkin</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="enforce_video"
                                            checked={settings.enforce_video_completion}
                                            onCheckedChange={(checked) => setSettings({ ...settings, enforce_video_completion: !!checked })}
                                        />
                                        <Label htmlFor="enforce_video" className="text-gray-600 font-normal group flex items-center gap-1">
                                            Video tamamlamayı zorunlu kıl
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="auto_advance"
                                            checked={settings.auto_advance}
                                            onCheckedChange={(checked) => setSettings({ ...settings, auto_advance: !!checked })}
                                        />
                                        <Label htmlFor="auto_advance" className="text-gray-600 font-normal">Videodan sonra otomatik ilerle</Label>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Default Tab */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900">Varsayılan sekme</h3>
                                <RadioGroup defaultValue="curriculum">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="comments" id="tab_comments" disabled />
                                        <Label htmlFor="tab_comments" className="text-gray-400">Yorumlar</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="curriculum" id="tab_curriculum" />
                                        <Label htmlFor="tab_curriculum" className="text-gray-700">Müfredat</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="files" id="tab_files" disabled />
                                        <Label htmlFor="tab_files" className="text-gray-400">Dosyalar</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {attachments.length === 0 ? "Dosya Yok" : `${attachments.length} Dosya`}
                                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs px-2 gap-1 rounded-md border-gray-200 hover:bg-gray-50 shadow-sm"
                                    onClick={() => attachmentInputRef.current?.click()}
                                    disabled={isUploadingAttachment}
                                >
                                    {isUploadingAttachment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                    Dosya ekle
                                </Button>
                                <input
                                    type="file"
                                    ref={attachmentInputRef}
                                    className="hidden"
                                    onChange={handleAttachmentUpload}
                                />
                            </div>

                            {attachments.length > 0 ? (
                                <div className="space-y-2">
                                    {attachments.map((file) => (
                                        <div key={file.id} className="group flex items-center justify-between p-2 pl-3 rounded-lg border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="bg-gray-50 p-2 rounded-md">
                                                    <FileText className="w-4 h-4 text-gray-400" />
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-sm font-medium text-gray-900 truncate">{file.name}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase">{(file.size / 1024).toFixed(1)} KB</span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleRemoveAttachment(file.id, file.path)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-white/50 rounded-xl border border-dashed border-gray-200">
                                    <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400">Henüz dosya eklenmemiş</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                {/* Header Actions */}
                <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-end gap-3">
                    <Button variant="outline" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Önizle
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-gray-900 text-white hover:bg-gray-800 min-w-[100px]">
                        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 max-w-4xl mx-auto w-full">
                    {/* Breadcrumb-ish */}
                    <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                        Ders 1 / 1
                        <ChevronRight className="w-4 h-4" />
                    </div>

                    {/* Title */}
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-3xl font-bold border-none px-0 shadow-none focus-visible:ring-0 placeholder:text-gray-300 mb-8 h-auto"
                        placeholder="Ders başlığı..."
                    />

                    {/* Featured Media Block */}
                    {settings.enable_featured_media && (
                        <div className="mb-8">
                            {!videoUrl ? (
                                <div className="border border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center bg-gray-50/50 text-center">
                                    <div className="flex items-center gap-2 mb-4 text-gray-400">
                                        <PlayCircle className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Öne çıkan medya</h3>
                                    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                                        Videonuzu/ses dosyanızı sürükleyin veya Vimeo, YouTube, Wistia, Typeform ve daha fazlasını gömün.
                                    </p>
                                    <Button variant="outline" onClick={() => setIsMediaModalOpen(true)} className="bg-white">
                                        Medya yükle veya göm
                                    </Button>
                                </div>
                            ) : (
                                <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-900 aspect-video flex items-center justify-center">
                                    {/* Simple Embed Preview */}
                                    <div className="text-white text-center">
                                        <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-80" />
                                        <p className="text-sm text-gray-300 max-w-md truncate px-4">{videoUrl}</p>
                                    </div>

                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <Button variant="secondary" onClick={() => setIsMediaModalOpen(true)}>Değiştir</Button>
                                        <Button variant="destructive" onClick={() => setVideoUrl("")}>Kaldır</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Editor Placeholder */}
                    <div className="min-h-[200px] text-gray-500">
                        <p className="mb-2 text-sm text-gray-400">Komutlar için '/' yazmaya başlayın</p>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="İçeriğinizi buraya yazın..."
                            className="min-h-[300px] border-none focus-visible:ring-0 px-0 resize-none text-lg leading-relaxed"
                        />
                    </div>
                </div>
            </div>

            {/* Media Modal */}
            <Dialog open={isMediaModalOpen} onOpenChange={setIsMediaModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Medya ekle</DialogTitle>
                    </DialogHeader>
                    <div className="w-full">
                        <div className="grid w-full grid-cols-2 mb-4 bg-gray-100 p-1 rounded-lg">
                            <button
                                className={cn("text-sm font-medium py-1.5 rounded-md transition-all", mediaTab === 'upload' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700")}
                                onClick={() => setMediaTab('upload')}
                            >
                                Yükle
                            </button>
                            <button
                                className={cn("text-sm font-medium py-1.5 rounded-md transition-all", mediaTab === 'embed' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700")}
                                onClick={() => setMediaTab('embed')}
                            >
                                Göm (Embed)
                            </button>
                        </div>

                        {mediaTab === 'upload' ? (
                            <div className="space-y-4 py-4 text-center">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept="video/*,audio/*,image/*"
                                />
                                <div
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {isUploadingMedia ? (
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                                    ) : (
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    )}
                                    <p className="text-sm font-medium text-gray-900">Dosya seçin veya sürükleyin</p>
                                    <p className="text-xs text-gray-500 mt-1">Video, Ses veya Görsel</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="url">Video URL</Label>
                                    <Input
                                        id="url"
                                        placeholder="https://youtube.com/..."
                                        value={tempVideoUrl}
                                        onChange={(e) => setTempVideoUrl(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">Vimeo, YouTube, Wistia, ve diğer embed destekleyen servisler.</p>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleEmbed}>Ekle</Button>
                                </DialogFooter>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
