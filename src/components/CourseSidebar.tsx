import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronDown,
    CheckCircle2,
    Circle,
    Lock,
    PlayCircle,
    User,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import type { Course, Module, Step, UserProgress } from '../types';

interface CourseSidebarProps {
    course: Course | null;
    modules: Module[];
    progress: UserProgress | null;
    currentStepId: string;
    sidebarOpen: boolean;
    onToggle: () => void;
    onStepClick: (stepId: string, moduleId: string) => void;
    courseCompleted?: boolean;
}

export function CourseSidebar({
    course,
    modules,
    progress,
    currentStepId,
    sidebarOpen,
    onToggle,
    onStepClick,
    courseCompleted = false,
}: CourseSidebarProps) {
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    // Auto-expand module containing current step
    useEffect(() => {
        if (currentStepId && modules.length > 0) {
            const currentModule = modules.find(m =>
                m.steps.some(s => s.id === currentStepId)
            );
            if (currentModule) {
                setExpandedModules(prev => new Set([...prev, currentModule.id]));
            }
        }
    }, [currentStepId, modules]);

    // Auto-expand module containing current step
    useEffect(() => {
        if (currentStepId && modules.length > 0) {
            const currentModule = modules.find(m =>
                m.steps.some(s => s.id === currentStepId)
            );
            if (currentModule) {
                setExpandedModules(prev => new Set([...prev, currentModule.id]));
            }
        }
    }, [currentStepId, modules]);

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            return next;
        });
    };

    const isStepCompleted = (stepId: string) => progress?.completedSteps?.includes(stepId) || false;

    const isStepLocked = (step: Step): boolean => {
        if (courseCompleted) return false;
        const allSteps = modules.flatMap(m => m.steps);
        const currentIndex = allSteps.findIndex(s => s.id === step.id);
        if (currentIndex <= 0) return false;
        return !isStepCompleted(allSteps[currentIndex - 1].id);
    };

    const completedStepsCount = progress?.completedSteps?.length || 0;
    const totalStepsCount = course?.totalSteps || 0;
    const progressPercentage = totalStepsCount > 0 ? (completedStepsCount / totalStepsCount) * 100 : 0;

    return (
        <>
            {/* Sidebar Toggle Button (Mobile & Desktop) */}
            <div className={cn(
                "fixed top-6 md:top-20 z-50 transition-all duration-300",
                sidebarOpen ? "left-[calc(100%-4rem)] md:left-[320px]" : "left-4"
            )}>
                <button
                    onClick={onToggle}
                    className="p-1.5 bg-secondary border border-army-500/30 rounded-full shadow-lg hover:bg-secondary-dark transition-colors group"
                >
                    <ChevronLeft className={cn(
                        "w-4 h-4 text-army-500 transition-transform duration-300",
                        !sidebarOpen && "rotate-180"
                    )} />
                </button>
            </div>

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed top-0 left-0 bottom-0 z-40 bg-black border-r border-white/5 transition-all duration-300 overflow-hidden flex flex-col",
                sidebarOpen ? "w-full md:w-[300px]" : "w-0"
            )}>
                <div className="w-[calc(100%-4rem)] md:w-[300px] flex flex-col h-full">
                    {/* Logo Section */}
                    <div className="p-6 border-b border-white/5">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center">
                                <img src="/logo.png" alt="Dahar Engineer" />
                            </div>
                            <div className="">
                                <span className="text-lg font-semibold tracking-tight">DAHAR</span>
                                <span className="text-lg font-light text-muted-foreground ml-1">
                                    ENGINEER
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Course Header Info */}
                    <div className="p-6 space-y-4">
                        {course && (
                            <>
                                <div className="space-y-1">
                                    <h1 className="text-lg font-semibold text-white leading-tight line-clamp-2">
                                        {course.title}
                                    </h1>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <User className="w-3 h-3" />
                                        <span>{course.instructor}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="text-army-400 font-medium">{Math.round(progressPercentage)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-dark-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-army-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progressPercentage}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Navigation - Modules & Steps */}
                    <nav className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin">
                        <div className="pb-4">
                            <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                COURSE CONTENT
                            </span>
                        </div>

                        {modules.map((module, idx) => {
                            const isExpanded = expandedModules.has(module.id);
                            const moduleProgress = module.steps.filter(s => isStepCompleted(s.id)).length;

                            return (
                                <div key={module.id} className="space-y-1">
                                    <button
                                        onClick={() => toggleModule(module.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group text-left",
                                            isExpanded ? "bg-white/5" : "hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors",
                                                isExpanded ? "bg-army-500 text-secondary" : "bg-dark-800 text-muted-foreground group-hover:bg-army-900"
                                            )}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground leading-none">{module.title}</p>
                                                <p className="text-[10px] text-muted-foreground mt-1 lowercase">
                                                    {moduleProgress}/{module.steps.length} completed
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronDown className={cn(
                                            "w-4 h-4 text-muted-foreground transition-transform duration-200",
                                            isExpanded && "rotate-180"
                                        )} />
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="overflow-hidden space-y-1 pl-9"
                                            >
                                                {module.steps.map((step, sIdx) => {
                                                    const completed = isStepCompleted(step.id);
                                                    const locked = isStepLocked(step);
                                                    const active = step.id === currentStepId;

                                                    return (
                                                        <button
                                                            key={step.id}
                                                            onClick={() => !locked && onStepClick(step.id, module.id)}
                                                            disabled={locked}
                                                            className={cn(
                                                                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 group",
                                                                active ? "bg-army-500/10 text-army-400" : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                                                                locked && "opacity-50 cursor-not-allowed"
                                                            )}
                                                        >
                                                            <div className="relative flex items-center justify-center shrink-0">
                                                                {completed ? (
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-army-500" />
                                                                ) : locked ? (
                                                                    <Lock className="w-3.5 h-3.5" />
                                                                ) : active ? (
                                                                    <PlayCircle className="w-3.5 h-3.5 animate-pulse" />
                                                                ) : (
                                                                    <Circle className="w-3.5 h-3.5" />
                                                                )}
                                                            </div>
                                                            <span className="text-[13px] font-normal leading-tight">
                                                                {sIdx + 1}. {step.title}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )
                        })}
                    </nav>

                    {/* Bottom Info */}
                    <div className="p-4 border-t border-white/5">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className="w-8 h-8 rounded-full bg-army-500/20 flex items-center justify-center text-army-500">
                                <Activity className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-white">Course Status</p>
                                <p className="text-[10px] text-muted-foreground">
                                    {courseCompleted ? "Fully Completed" : "In Progress"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Spacer/Overlay for mobile */}
            {sidebarOpen && (
                <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={onToggle} />
            )}
        </>
    );
}
