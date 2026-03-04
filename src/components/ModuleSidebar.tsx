import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Lock, PlayCircle } from 'lucide-react';
import type { Module, Step, UserProgress } from '../types';

interface ModuleSidebarProps {
  modules: Module[];
  progress: UserProgress | null;
  currentStepId: string;
  onStepClick: (stepId: string, moduleId: string) => void;
  courseCompleted?: boolean;
}

export function ModuleSidebar({
  modules,
  progress,
  currentStepId,
  onStepClick,
  courseCompleted = false,
}: ModuleSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    // Expand module containing current step
    const currentModule = modules.find(m => 
      m.steps.some(s => s.id === currentStepId)
    );
    return currentModule ? new Set([currentModule.id]) : new Set();
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const isStepCompleted = (stepId: string) => {
    return progress?.completedSteps?.includes(stepId) || false;
  };

  const isStepLocked = (step: Step, moduleIndex: number, stepIndex: number): boolean => {
    if (courseCompleted) return false;
    
    // First step of first module is always unlocked
    if (moduleIndex === 0 && stepIndex === 0) return false;
    
    // Check if previous step is completed
    const allSteps = modules.flatMap(m => m.steps);
    const currentIndex = allSteps.findIndex(s => s.id === step.id);
    
    if (currentIndex <= 0) return false;
    
    const previousStep = allSteps[currentIndex - 1];
    return !isStepCompleted(previousStep.id);
  };

  const isModuleCompleted = (module: Module) => {
    return module.steps.every(step => isStepCompleted(step.id));
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Course Content
        </h2>
      </div>
      
      <div className="py-2">
        {modules.map((module, moduleIndex) => {
          const isExpanded = expandedModules.has(module.id);
          const moduleCompleted = isModuleCompleted(module);
          const completedStepsCount = module.steps.filter(s => isStepCompleted(s.id)).length;
          
          return (
            <div key={module.id} className="border-b border-gray-800/50 last:border-b-0">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-dark-800/30 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  {moduleCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-army-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 border border-gray-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-gray-500">{moduleIndex + 1}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-200">{module.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {completedStepsCount}/{module.steps.length} steps
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
              </button>

              {/* Module Steps */}
              {isExpanded && (
                <div className="bg-dark-900/50">
                  {module.steps.map((step, stepIndex) => {
                    const completed = isStepCompleted(step.id);
                    const locked = isStepLocked(step, moduleIndex, stepIndex);
                    const isCurrent = step.id === currentStepId;

                    return (
                      <button
                        key={step.id}
                        onClick={() => !locked && onStepClick(step.id, module.id)}
                        disabled={locked}
                        className={`
                          w-full px-4 py-2.5 pl-12 flex items-center gap-3 text-left transition-colors
                          ${isCurrent ? 'bg-dark-800 border-l-2 border-army-500' : 'hover:bg-dark-800/30 border-l-2 border-transparent'}
                          ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        {completed ? (
                          <CheckCircle2 className="w-4 h-4 text-army-500 flex-shrink-0" />
                        ) : locked ? (
                          <Lock className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        ) : isCurrent ? (
                          <PlayCircle className="w-4 h-4 text-army-400 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        )}
                        <span className={`
                          text-sm truncate
                          ${isCurrent ? 'text-army-400 font-medium' : completed ? 'text-gray-300' : 'text-gray-500'}
                        `}>
                          {stepIndex + 1}. {step.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
