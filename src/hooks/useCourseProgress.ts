import { useState, useEffect, useCallback } from 'react';
import { usePocketBase } from '../contexts/PocketBaseContext';
import type { Module, Step, UserProgress } from '../types';

interface UseCourseProgressReturn {
  progress: UserProgress | null;
  isLoading: boolean;
  error: string | null;
  completeStep: (stepId: string) => Promise<void>;
  completeCourse: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  canAccessStep: (stepId: string, modules: Module[]) => boolean;
  getNextStep: (modules: Module[], currentStepId: string) => { step: Step | null; module: Module | null; isLastStep: boolean };
  getPreviousStep: (modules: Module[], currentStepId: string) => { step: Step | null; module: Module | null };
}

export function useCourseProgress(courseId: string, userId: string | undefined): UseCourseProgressReturn {
  const { pb } = usePocketBase();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!userId || !courseId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Try to find existing progress
      const records = await pb.collection('online_course_progress').getList(1, 1, {
        filter: `userId = "${userId}" && courseId = "${courseId}"`,
      });

      if (records.items.length > 0) {
        const record = records.items[0];
        setProgress({
          id: record.id,
          userId: record.userId,
          courseId: record.courseId,
          completedSteps: record.completedSteps || [],
          completedModules: record.completedModules || [],
          currentStepId: record.currentStepId,
          currentModuleId: record.currentModuleId,
          startedAt: record.startedAt,
          completedAt: record.completedAt,
          lastAccessedAt: record.lastAccessedAt,
          certificateIssued: record.certificateIssued || false,
          certificate: record.certificate,
          certificateUrl: record.certificateUrl,
          created: record.created,
          updated: record.updated,
        });
      } else {
        // Create new progress record
        const newRecord = await pb.collection('online_course_progress').create({
          userId,
          courseId,
          completedSteps: [],
          completedModules: [],
          currentStepId: null,
          currentModuleId: null,
          startedAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
          certificateIssued: false,
        });

        setProgress({
          id: newRecord.id,
          userId: newRecord.userId,
          courseId: newRecord.courseId,
          completedSteps: [],
          completedModules: [],
          currentStepId: null,
          currentModuleId: null,
          startedAt: newRecord.startedAt,
          completedAt: null,
          lastAccessedAt: newRecord.lastAccessedAt,
          certificateIssued: false,
          created: newRecord.created,
          updated: newRecord.updated,
        });
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError('Failed to load course progress');
    } finally {
      setIsLoading(false);
    }
  }, [pb, courseId, userId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const completeStep = useCallback(async (stepId: string) => {
    if (!progress || !userId) return;

    try {
      const updatedCompletedSteps = [...new Set([...progress.completedSteps, stepId])];

      const updated = await pb.collection('online_course_progress').update(progress.id, {
        completedSteps: updatedCompletedSteps,
        currentStepId: stepId,
        lastAccessedAt: new Date().toISOString(),
      });

      setProgress(prev => prev ? {
        ...prev,
        completedSteps: updatedCompletedSteps,
        currentStepId: stepId,
        lastAccessedAt: updated.lastAccessedAt,
        updated: updated.updated,
      } : null);
    } catch (err) {
      console.error('Error completing step:', err);
      throw err;
    }
  }, [pb, progress, userId]);

  const completeCourse = useCallback(async () => {
    if (!progress || !userId) return;

    try {
      const updated = await pb.collection('online_course_progress').update(progress.id, {
        completedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        certificateIssued: true,
      });

      setProgress(prev => prev ? {
        ...prev,
        completedAt: updated.completedAt,
        lastAccessedAt: updated.lastAccessedAt,
        certificateIssued: true,
        updated: updated.updated,
      } : null);
    } catch (err) {
      console.error('Error completing course:', err);
      throw err;
    }
  }, [pb, progress, userId]);

  const canAccessStep = useCallback((stepId: string, modules: Module[]): boolean => {
    if (!progress) return false;

    const allSteps = modules.flatMap(m => m.steps);
    const stepIndex = allSteps.findIndex(s => s.id === stepId);

    if (stepIndex <= 0) return true;

    const previousStep = allSteps[stepIndex - 1];
    return progress.completedSteps.includes(previousStep.id);
  }, [progress]);

  const getNextStep = useCallback((modules: Module[], currentStepId: string) => {
    const allSteps = modules.flatMap(m => m.steps);
    const currentIndex = allSteps.findIndex(s => s.id === currentStepId);

    if (currentIndex === -1 || currentIndex >= allSteps.length - 1) {
      return { step: null, module: null, isLastStep: true };
    }

    const nextStep = allSteps[currentIndex + 1];
    const nextModule = modules.find(m => m.steps.some(s => s.id === nextStep.id));

    return {
      step: nextStep,
      module: nextModule || null,
      isLastStep: currentIndex === allSteps.length - 2
    };
  }, []);

  const getPreviousStep = useCallback((modules: Module[], currentStepId: string) => {
    const allSteps = modules.flatMap(m => m.steps);
    const currentIndex = allSteps.findIndex(s => s.id === currentStepId);

    if (currentIndex <= 0) {
      return { step: null, module: null };
    }

    const prevStep = allSteps[currentIndex - 1];
    const prevModule = modules.find(m => m.steps.some(s => s.id === prevStep.id));

    return { step: prevStep, module: prevModule || null };
  }, []);

  return {
    progress,
    isLoading,
    error,
    completeStep,
    completeCourse,
    refreshProgress: fetchProgress,
    canAccessStep,
    getNextStep,
    getPreviousStep,
  };
}
