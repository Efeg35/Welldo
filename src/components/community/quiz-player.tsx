"use client";

import { useState } from "react";
import { QuizContent, QuizQuestion, QuizOption } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface QuizPlayerProps {
    quiz: QuizContent;
    onComplete: (passed: boolean, score: number) => void;
    nextLessonAvailable: boolean;
    onNextLesson: () => void;
}

export function QuizPlayer({ quiz, onComplete, nextLessonAvailable, onNextLesson }: QuizPlayerProps) {
    const [started, setStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const questions = quiz.questions;
    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    const handleStart = () => {
        setStarted(true);
    };

    const handleAnswer = (optionId: string) => {
        if (isSubmitted) return;
        setAnswers({ ...answers, [currentQuestion.id]: optionId });
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        let correctCount = 0;
        questions.forEach(q => {
            const userAnswerId = answers[q.id];
            const correctOption = q.options.find(o => o.isCorrect);
            if (userAnswerId && correctOption && userAnswerId === correctOption.id) {
                correctCount++;
            }
        });

        const calculatedScore = Math.round((correctCount / questions.length) * 100);
        setScore(calculatedScore);
        setIsSubmitted(true);

        const passed = calculatedScore >= quiz.settings.passing_grade;
        onComplete(passed, calculatedScore);

        if (passed) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    };

    const handleRetry = () => {
        setAnswers({});
        setCurrentQuestionIndex(0);
        setIsSubmitted(false);
        setScore(0);
        setStarted(false);
    };

    // --- RENDER STATES ---

    // 1. Start Screen
    if (!started) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] bg-gray-50 rounded-2xl border border-gray-200">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sınav Zamanı</h2>
                <p className="text-gray-500 max-w-md mb-8">
                    Bu dersteki başarınızı ölçmek için kısa bir sınav.
                    Devam etmek için <strong>%{quiz.settings.passing_grade}</strong> veya üzeri almalısınız.
                </p>
                <div className="flex gap-4 text-sm text-gray-500 mb-8 border-t border-b py-4 w-full max-w-xs justify-center">
                    <div className="text-center">
                        <span className="block font-bold text-gray-900 text-lg">{questions.length}</span>
                        Soru
                    </div>
                    <div className="w-px bg-gray-200" />
                    <div className="text-center">
                        <span className="block font-bold text-gray-900 text-lg">%{quiz.settings.passing_grade}</span>
                        Geçme Notu
                    </div>
                </div>
                <Button size="lg" onClick={handleStart} className="px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full">
                    Sınava Başla
                </Button>
            </div>
        );
    }

    // 2. Report Screen (Submitted)
    if (isSubmitted) {
        const passed = score >= quiz.settings.passing_grade;

        return (
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
                <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6", passed ? "bg-green-100" : "bg-red-100")}>
                    {passed ? <CheckCircle2 className="w-10 h-10 text-green-600" /> : <XCircle className="w-10 h-10 text-red-600" />}
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {passed ? "Tebrikler!" : "Maalesef Başaramadınız"}
                </h2>
                <div className="text-5xl font-black mb-6 mt-2" style={{ color: passed ? '#16a34a' : '#dc2626' }}>
                    %{score}
                </div>

                <p className="text-gray-500 max-w-md mb-8">
                    {passed
                        ? "Sınavı başarıyla tamamladınız. Bir sonraki derse geçebilirsiniz."
                        : `Geçmek için en az %${quiz.settings.passing_grade} almanız gerekiyordu. Tekrar denemek ister misiniz?`}
                </p>

                <div className="flex gap-4">
                    {!passed && (
                        <Button variant="outline" onClick={handleRetry} className="gap-2">
                            <RotateCcw className="w-4 h-4" /> Tekrar Dene
                        </Button>
                    )}

                    {/* Show Next Lesson button if passed OR if not enforced */}
                    {(passed || !quiz.settings.is_enforced) && nextLessonAvailable && (
                        <Button onClick={onNextLesson} className="gap-2 bg-gray-900 text-white hover:bg-gray-800">
                            Sonraki Ders <ChevronRight className="w-4 h-4" />
                        </Button>
                    )}

                    {/* Lock state if failed and enforced */}
                    {!passed && quiz.settings.is_enforced && (
                        <Button disabled className="gap-2 opacity-50 cursor-not-allowed">
                            <Lock className="w-4 h-4" /> Sonraki Ders Kilitli
                        </Button>
                    )}
                </div>

                {/* Result Details (Optional: show correct answers if enabled) */}
                {quiz.settings.show_answers && (
                    <div className="w-full max-w-2xl mt-12 text-left space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">Cevaplarınız</h3>
                        {questions.map((q, idx) => {
                            const userAnswerId = answers[q.id];
                            const correctOption = q.options.find(o => o.isCorrect);
                            const isCorrect = userAnswerId === correctOption?.id;

                            return (
                                <div key={idx} className={cn("p-4 rounded-lg border", isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50")}>
                                    <div className="flex gap-3">
                                        <div className="font-bold text-gray-500">{idx + 1}.</div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 mb-2">{q.text}</p>
                                            <div className="text-sm">
                                                {!isCorrect && <div className="text-red-700 flex items-center gap-2"><XCircle className="w-3 h-3" /> Sizin Cevabınız: {q.options.find(o => o.id === userAnswerId)?.text || "Boş"}</div>}
                                                <div className="text-green-700 flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> Doğru Cevap: {correctOption?.text}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        );
    }

    // 3. Question View
    return (
        <div className="max-w-2xl mx-auto py-8">
            {/* Progress */}
            <div className="mb-8">
                <div className="flex justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    <span>Soru {currentQuestionIndex + 1} / {questions.length}</span>
                    <span>%{(currentQuestionIndex / questions.length * 100).toFixed(0)} Tamamlandı</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">{currentQuestion.text}</h2>

                {currentQuestion.media_url && (
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-black">
                        {currentQuestion.media_type === 'video' ? (
                            <div className="aspect-video relative">
                                <video
                                    src={currentQuestion.media_url}
                                    className="w-full h-full"
                                    controls
                                    playsInline
                                />
                            </div>
                        ) : (
                            <img src={currentQuestion.media_url} alt="Question Media" className="w-full h-auto max-h-[400px] object-contain" />
                        )}
                    </div>
                )}

                <div className="space-y-3">
                    {currentQuestion.options.map((option) => {
                        const isSelected = answers[currentQuestion.id] === option.id;
                        return (
                            <button
                                key={option.id}
                                onClick={() => handleAnswer(option.id)}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group",
                                    isSelected
                                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                                )}
                            >
                                <span className={cn("font-medium", isSelected ? "text-blue-900" : "text-gray-700")}>
                                    {option.text}
                                </span>
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                    isSelected ? "border-blue-600" : "border-gray-300 group-hover:border-blue-400"
                                )}>
                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="flex justify-end pt-6">
                    <Button
                        size="lg"
                        onClick={handleNext}
                        disabled={!answers[currentQuestion.id]}
                        className="px-8"
                    >
                        {isLastQuestion ? 'Sınavı Bitir' : 'Sonraki Soru'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
