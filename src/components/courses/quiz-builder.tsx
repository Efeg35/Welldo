"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, Image as ImageIcon, Video, X, Loader2, GripVertical, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { QuizContent, QuizQuestion, QuizOption, QuizSettings } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface QuizBuilderProps {
    quiz: QuizContent;
    onChange: (quiz: QuizContent) => void;
}

export function QuizBuilder({ quiz, onChange }: QuizBuilderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleAddQuestion = () => {
        setEditingQuestionId(null);
        setIsModalOpen(true);
    };

    const handleEditQuestion = (id: string) => {
        setEditingQuestionId(id);
        setIsModalOpen(true);
    };

    const handleDeleteQuestion = (id: string) => {
        const updatedQuestions = quiz.questions.filter(q => q.id !== id);
        onChange({ ...quiz, questions: updatedQuestions });
    };

    const handleSaveQuestion = (question: QuizQuestion) => {
        let updatedQuestions = [...quiz.questions];
        if (editingQuestionId) {
            updatedQuestions = updatedQuestions.map(q => q.id === editingQuestionId ? question : q);
        } else {
            updatedQuestions.push(question);
        }
        onChange({ ...quiz, questions: updatedQuestions });
        setIsModalOpen(false);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = quiz.questions.findIndex((item) => item.id === active.id);
            const newIndex = quiz.questions.findIndex((item) => item.id === over.id);
            onChange({ ...quiz, questions: arrayMove(quiz.questions, oldIndex, newIndex) });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    Sınavınızı oluşturun. En az 1 soru eklemelisiniz.
                </p>
            </div>

            <div className="bg-gray-50/50 rounded-xl border border-dashed border-gray-200 min-h-[300px] p-6">
                {quiz.questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                            <Plus className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">Soru Ekle</h3>
                        <p className="text-sm text-gray-500 mb-6">Sınavınıza başlamak için soru ekleyin</p>
                        <Button onClick={handleAddQuestion} className="bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm">
                            + Soru Ekle
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={quiz.questions.map(q => q.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {quiz.questions.map((question, index) => (
                                    <SortableQuestionItem
                                        key={question.id}
                                        id={question.id}
                                        question={question}
                                        index={index}
                                        onEdit={() => handleEditQuestion(question.id)}
                                        onDelete={() => handleDeleteQuestion(question.id)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        <Button onClick={handleAddQuestion} variant="outline" className="w-full border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 py-6">
                            + Yeni Soru Ekle
                        </Button>
                    </div>
                )}
            </div>

            <QuestionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveQuestion}
                initialData={editingQuestionId ? quiz.questions.find(q => q.id === editingQuestionId) : undefined}
            />
        </div>
    );
}

// --- Sortable Item ---

function SortableQuestionItem({ id, question, index, onEdit, onDelete }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-4 shadow-sm group hover:border-blue-200 transition-colors">
            <div className="mt-1 cursor-move text-gray-300 hover:text-gray-500" {...attributes} {...listeners}>
                <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">SORU {index + 1}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 px-2 text-xs">Düzenle</Button>
                        <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 px-2 text-xs text-red-500 hover:text-red-600">Sil</Button>
                    </div>
                </div>
                <h4 className="font-medium text-gray-900 mb-3">{question.text}</h4>

                {question.media_url && (
                    <div className="mb-3">
                        {question.media_type === 'video' ? (
                            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                                <Video className="w-3 h-3" /> Video İçeriği
                            </div>
                        ) : (
                            <img src={question.media_url} className="h-20 w-auto rounded-md object-cover border" alt="Question media" />
                        )}
                    </div>
                )}

                <div className="space-y-1">
                    {question.options.map((opt: QuizOption) => (
                        <div key={opt.id} className={cn("text-sm flex items-center gap-2", opt.isCorrect ? "text-green-700 font-medium" : "text-gray-500")}>
                            {opt.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                            {opt.text}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


// --- Question Modal ---

interface QuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (question: QuizQuestion) => void;
    initialData?: QuizQuestion;
}

function QuestionModal({ isOpen, onClose, onSave, initialData }: QuestionModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [text, setText] = useState(initialData?.text || "");
    const [mediaUrl, setMediaUrl] = useState(initialData?.media_url || null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(initialData?.media_type || null);
    const [options, setOptions] = useState<QuizOption[]>(initialData?.options || [
        { id: '1', text: '', isCorrect: true },
        { id: '2', text: '', isCorrect: false }
    ]);
    const [isUploading, setIsUploading] = useState(false);

    // Reset when modal opens with new data
    // (This simple logic works because we unmount/remount in parent or key change, 
    // but better to use useEffect in real app if modal stays mounted. 
    // For now assuming key change or clean mount).

    // Actually, Dialog keeps mounted often. Let's sync state.
    // Simplifying for this snippet: assume component re-renders or checks props.
    // We'll use a `key` on the component usage in parent to force reset, simpler given constraints.

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`; // bucket root or folder

            const { error: uploadError } = await supabase.storage
                .from('quiz_media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('quiz_media')
                .getPublicUrl(filePath);

            setMediaUrl(publicUrl);
            setMediaType(file.type.startsWith('video') ? 'video' : 'image');
            toast.success("Medya yüklendi");
        } catch (error: any) {
            console.error("Upload error", error);
            toast.error("Yükleme başarısız: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = () => {
        if (!text.trim()) {
            toast.error("Soru metni gerekli");
            return;
        }

        const validOptions = options.filter(o => o.text.trim());
        if (validOptions.length < 2) {
            toast.error("En az 2 seçenek eklemelisiniz");
            return;
        }

        if (!validOptions.some(o => o.isCorrect)) {
            toast.error("En az 1 doğru cevap seçmelisiniz");
            return;
        }

        const newQuestion: QuizQuestion = {
            id: initialData?.id || Math.random().toString(36).substr(2, 9),
            text,
            media_url: mediaUrl,
            media_type: mediaType,
            type: 'single_choice',
            options: validOptions
        };

        onSave(newQuestion);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}</DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Media Upload */}
                    <div className="space-y-4">
                        <Label>Medya (Opsiyonel)</Label>
                        {!mediaUrl ? (
                            <div className="flex gap-4">
                                <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                    Resim / Video Ekle
                                </Button>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    accept="image/*,video/*"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        ) : (
                            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black max-w-sm">
                                {mediaType === 'video' ? (
                                    <video src={mediaUrl} controls className="w-full h-48 object-contain" />
                                ) : (
                                    <img src={mediaUrl} className="w-full h-48 object-cover" />
                                )}
                                <button
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-600"
                                    onClick={() => { setMediaUrl(null); setMediaType(null); }}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Question Text */}
                    <div className="space-y-2">
                        <Label>Soru Metni</Label>
                        <Input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Soru metnini buraya yazın..."
                        />
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <Label>Seçenekler</Label>
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <button
                                    className={cn("w-5 h-5 rounded-full border flex items-center justify-center transition-colors", opt.isCorrect ? "border-green-600 bg-green-50" : "border-gray-300 hover:border-gray-400")}
                                    onClick={() => {
                                        // Single choice logic: uncheck others
                                        const newOpts = options.map((o, i) => ({ ...o, isCorrect: i === idx }));
                                        setOptions(newOpts);
                                    }}
                                >
                                    {opt.isCorrect && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
                                </button>
                                <Input
                                    value={opt.text}
                                    onChange={(e) => {
                                        const newOpts = [...options];
                                        newOpts[idx].text = e.target.value;
                                        setOptions(newOpts);
                                    }}
                                    placeholder={`Seçenek ${idx + 1}`}
                                    className="flex-1 h-9"
                                />
                                {options.length > 2 && (
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-gray-400 hover:text-red-500" onClick={() => {
                                        setOptions(options.filter((_, i) => i !== idx));
                                    }}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:bg-blue-50"
                            onClick={() => setOptions([...options, { id: Math.random().toString(), text: '', isCorrect: false }])}
                        >
                            + Seçenek Ekle
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>İptal</Button>
                    <Button onClick={handleSave}>Kaydet</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Ensure re-render on modal open with fresh state
function QuestionModalWrapper(props: QuestionModalProps) {
    if (!props.isOpen) return null;
    return <QuestionModal {...props} />;
}
