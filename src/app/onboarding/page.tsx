"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Check, Rocket, BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "@/actions/onboarding";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Step = 'goal' | 'interests' | 'community-name';

const INTERESTS = [
    "Software Development", "Design", "Marketing", "Business",
    "Health & Fitness", "Personal Development", "Music", "Art",
    "Writing", "Technology", "Education", "Other"
];

export default function OnboardingPage() {
    const [step, setStep] = useState<Step>('goal');
    const [goal, setGoal] = useState<'teaching' | 'learning' | null>(null);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [communityName, setCommunityName] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleNext = () => {
        if (step === 'goal') {
            if (!goal) return;
            setStep('interests');
        } else if (step === 'interests') {
            if (goal === 'teaching') {
                setStep('community-name');
            } else {
                handleSubmit();
            }
        }
    };

    const handleBack = () => {
        if (step === 'interests') setStep('goal');
        if (step === 'community-name') setStep('interests');
    };

    const handleSubmit = () => {
        if (!goal) return;

        startTransition(async () => {
            try {
                await completeOnboarding({
                    goal,
                    interests: selectedInterests,
                    communityName: goal === 'teaching' ? communityName : undefined
                });

                toast.success("All set! Welcome to WellDo.");

                // Redirect based on goal
                if (goal === 'teaching') {
                    // Force refresh to update layout with new role
                    // Note: Middleware or layout should ideally check role and redirect
                    window.location.href = '/community';
                } else {
                    window.location.href = '/community';
                }

            } catch (error) {
                console.error(error);
                toast.error("Something went wrong. Please try again.");
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-2xl">

                {/* Progress Bar */}
                <div className="mb-8 flex items-center justify-center gap-2">
                    <div className={cn("h-1 w-12 rounded-full transition-colors", step === 'goal' ? "bg-primary" : "bg-primary/50")} />
                    <div className={cn("h-1 w-12 rounded-full transition-colors", step === 'interests' ? "bg-primary" : (step === 'goal' ? "bg-muted" : "bg-primary/50"))} />
                    {goal === 'teaching' && (
                        <div className={cn("h-1 w-12 rounded-full transition-colors", step === 'community-name' ? "bg-primary" : "bg-muted")} />
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {step === 'goal' && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center space-y-2">
                                <h1 className="text-3xl font-bold tracking-tight">How do you want to use WellDo?</h1>
                                <p className="text-muted-foreground">Select your primary goal to get started.</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 pt-4">
                                <button
                                    onClick={() => setGoal('teaching')}
                                    className={cn(
                                        "p-6 border-2 rounded-xl text-left transition-all hover:border-primary group relative overflow-hidden",
                                        goal === 'teaching' ? "border-primary bg-primary/5" : "border-muted hover:bg-muted/50"
                                    )}
                                >
                                    <div className="mb-4 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <Rocket className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">Create a Community</h3>
                                    <p className="text-sm text-muted-foreground">I want to build my own space, teach courses, and gather members.</p>
                                    {goal === 'teaching' && <div className="absolute top-4 right-4 text-primary"><Check className="w-5 h-5" /></div>}
                                </button>

                                <button
                                    onClick={() => setGoal('learning')}
                                    className={cn(
                                        "p-6 border-2 rounded-xl text-left transition-all hover:border-primary group relative overflow-hidden",
                                        goal === 'learning' ? "border-primary bg-primary/5" : "border-muted hover:bg-muted/50"
                                    )}
                                >
                                    <div className="mb-4 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">Join Communities</h3>
                                    <p className="text-sm text-muted-foreground">I want to discover spaces, join discussions, and learn from others.</p>
                                    {goal === 'learning' && <div className="absolute top-4 right-4 text-primary"><Check className="w-5 h-5" /></div>}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'interests' && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center space-y-2">
                                <h1 className="text-3xl font-bold tracking-tight">What are you interested in?</h1>
                                <p className="text-muted-foreground">Pick a few topics to help us personalize your experience.</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4">
                                {INTERESTS.map(interest => (
                                    <button
                                        key={interest}
                                        onClick={() => {
                                            if (selectedInterests.includes(interest)) {
                                                setSelectedInterests(selectedInterests.filter(i => i !== interest));
                                            } else {
                                                setSelectedInterests([...selectedInterests, interest]);
                                            }
                                        }}
                                        className={cn(
                                            "p-3 rounded-lg border text-sm font-medium transition-all",
                                            selectedInterests.includes(interest)
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background border-border hover:border-primary/50"
                                        )}
                                    >
                                        {interest}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 'community-name' && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center space-y-2">
                                <h1 className="text-3xl font-bold tracking-tight">Name your community</h1>
                                <p className="text-muted-foreground">Give your new space a name. You can change this later.</p>
                            </div>

                            <div className="pt-8 max-w-md mx-auto">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Community Name</Label>
                                        <Input
                                            placeholder="e.g. Design Masters, Yoga with Sarah..."
                                            className="h-12 text-lg"
                                            value={communityName}
                                            onChange={(e) => setCommunityName(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg flex items-start gap-3">
                                        <Users className="w-5 h-5 text-primary mt-0.5" />
                                        <div className="text-sm text-muted-foreground">
                                            <p className="font-medium text-foreground mb-1">You're making a great choice!</p>
                                            Creating a community gives you the power to bring people together.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Navigation */}
                <div className="flex justify-between mt-12 pt-6 border-t">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === 'goal' || isPending}
                        className={step === 'goal' ? "invisible" : ""}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <Button
                        onClick={handleNext}
                        disabled={
                            (step === 'goal' && !goal) ||
                            (step === 'community-name' && !communityName) ||
                            isPending
                        }
                        className="min-w-[120px]"
                    >
                        {isPending ? (
                            "Setting up..."
                        ) : (
                            step === 'community-name' || (step === 'interests' && goal === 'learning') ? (
                                "Finish"
                            ) : (
                                <>
                                    Next
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )
                        )}
                    </Button>
                </div>

            </div>
        </div>
    );
}
