import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePocketBase } from '../contexts/PocketBaseContext';
import { useCourseProgress } from '../hooks/useCourseProgress';
import { CourseSidebar } from '../components/CourseSidebar';
import { StepContent } from '../components/StepContent';
import { CertificateModal } from '../components/CertificateModal';
import { cn } from '../lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { Course, Module, Step } from '../types';

export function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { pb } = usePocketBase();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    progress,
    isLoading: progressLoading,
    completeStep,
    completeCourse,
    getNextStep,
    getPreviousStep,
  } = useCourseProgress(course?.id || '', user?.id);

  // Fetch course data
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchCourse = async () => {
      if (!slug) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch course by slug
        const courseResult = await pb.collection('online_courses').getList(1, 1, {
          filter: `slug = "${slug}"`,
          expand: 'instructor',
          requestKey: null,
        });

        if (courseResult.items.length === 0) {
          setError('Course not found');
          return;
        }

        const courseData = courseResult.items[0];
        const instructorData = courseData.expand?.instructor;

        setCourse({
          id: courseData.id,
          title: courseData.title,
          slug: courseData.slug,
          description: courseData.description,
          thumbnail: courseData.thumbnail ? pb.files.getUrl(courseData, courseData.thumbnail) : undefined,
          instructor: instructorData?.name || 'Unknown Instructor',
          expand: {
            instructor: instructorData ? {
              id: instructorData.id,
              name: instructorData.name,
              specialization: instructorData.specialization,
              email: instructorData.email,
              image: instructorData.image ? pb.files.getUrl(instructorData, instructorData.image) : undefined,
              isActive: instructorData.isActive,
              created: instructorData.created,
              updated: instructorData.updated,
            } : undefined
          },
          duration: courseData.duration,
          level: courseData.level,
          totalModules: courseData.totalModules,
          totalSteps: courseData.totalSteps,
          created: courseData.created,
          updated: courseData.updated,
        });

        // Fetch modules for this course
        const modulesResult = await pb.collection('online_course_modules').getList(1, 50, {
          filter: `courseId = "${courseData.id}"`,
          sort: 'order',
          requestKey: null,
        });

        // Fetch all steps for these modules
        const moduleIds = modulesResult.items.map(m => m.id);
        const stepsResult = await pb.collection('online_course_steps').getList(1, 200, {
          filter: moduleIds.map(id => `moduleId = "${id}"`).join(' || '),
          sort: 'order',
          requestKey: null,
        });

        const stepsByModule = new Map<string, Step[]>();
        stepsResult.items.forEach(s => {
          const list = stepsByModule.get(s.moduleId) || [];
          list.push({
            id: s.id,
            moduleId: s.moduleId,
            title: s.title,
            content: s.content,
            order: s.order,
            type: s.type,
            videoUrl: s.videoUrl,
            files: s.files || [],
            created: s.created,
            updated: s.updated,
          });
          stepsByModule.set(s.moduleId, list);
        });

        const modulesWithSteps: Module[] = modulesResult.items.map(m => ({
          id: m.id,
          courseId: m.courseId,
          title: m.title,
          description: m.description,
          order: m.order,
          steps: stepsByModule.get(m.id) || [],
          created: m.created,
          updated: m.updated,
        }));

        setModules(modulesWithSteps);
      } catch (err: any) {
        if (err.status === 0) return;
        console.error('Error fetching course:', err);
        setError('Failed to load course');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [slug, pb, isAuthenticated, authLoading, navigate]);

  // Set initial step when modules are loaded
  useEffect(() => {
    if (modules.length > 0 && !currentStep) {
      const allSteps = modules.flatMap(m => m.steps);
      if (allSteps.length > 0) {
        const initialStepId = progress?.currentStepId || allSteps[0].id;
        const initialStep = allSteps.find(s => s.id === initialStepId) || allSteps[0];
        setCurrentStep(initialStep);
      }
    }
  }, [modules, currentStep, progress?.currentStepId]);

  // Handle step navigation
  const handleStepClick = useCallback((stepId: string, _moduleId: string) => {
    const step = modules.flatMap(m => m.steps).find(s => s.id === stepId);
    if (step) {
      setCurrentStep(step);
    }
  }, [modules]);

  // Handle next step
  const handleNext = async () => {
    if (!currentStep || !course || isNavigating) return;

    // Check if this is already the last step
    if (isLastStep()) {
      setIsNavigating(true);
      try {
        await completeStep(currentStep.id);
        await completeCourse();
        setShowCertificate(true);
      } catch (err) {
        console.error('Error completing course:', err);
      } finally {
        setIsNavigating(false);
      }
      return;
    }

    setIsNavigating(true);

    try {
      // Get next step
      const { step: nextStep } = getNextStep(modules, currentStep.id);

      if (nextStep) {
        // Optimistic UI: Switch step immediately
        setCurrentStep(nextStep);

        // Mark current step as complete in background
        completeStep(currentStep.id).catch(err => {
          console.error('Error saving progress in background:', err);
        });
      }
    } catch (err) {
      console.error('Error navigating to next step:', err);
    } finally {
      setIsNavigating(false);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (!currentStep || isNavigating) return;

    const { step: prevStep } = getPreviousStep(modules, currentStep.id);
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  };


  // Check if current step is last step
  const isLastStep = () => {
    const allSteps = modules.flatMap(m => m.steps);
    return allSteps.length > 0 && allSteps[allSteps.length - 1].id === currentStep?.id;
  };

  // Calculate current indices
  const getCurrentIndices = () => {
    if (!currentStep || modules.length === 0) return { mIdx: 0, sIdx: 0 };
    const mIdx = modules.findIndex(m => m.steps.some(s => s.id === currentStep.id));
    const sIdx = modules[mIdx]?.steps.findIndex(s => s.id === currentStep.id);
    return { mIdx: mIdx + 1, sIdx: sIdx + 1 };
  };

  const { mIdx, sIdx } = getCurrentIndices();

  if (authLoading || isLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-army-500" />
          <span className="text-sm font-medium">Loading your course...</span>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-dark-900 border border-white/5 rounded-2xl p-8 text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{error || 'Course not found'}</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find the course you're looking for. It might have been moved or deleted.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-army-500 text-secondary rounded-xl font-bold hover:bg-army-400 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Redesigned Sidebar */}
      <CourseSidebar
        course={course}
        modules={modules}
        progress={progress}
        currentStepId={currentStep?.id || ''}
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onStepClick={handleStepClick}
        courseCompleted={progress?.certificateIssued}
      />

      {/* Main Content Area */}
      <main className={cn(
        "transition-all duration-300 min-h-screen flex flex-col",
        sidebarOpen ? "md:pl-[300px]" : "pl-0"
      )}>
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 pt-20 pb-4 md:pt-12 md:pb-12">
          {error ? (
            <div className="flex-1 flex flex-center">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2 bg-army-500 text-white rounded-lg hover:bg-army-600 transition-colors"
                >
                  Back to Courses
                </button>
              </div>
            </div>
          ) : !currentStep ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-army-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Step Content Card */}
              <div className="bg-dark-900/50 border border-white/5 rounded-lg p-6 shadow-2xl overflow-hidden relative group">
                {/* Floating Progress Pill */}
                <div className="fixed md:absolute top-4 right-4 px-3 py-1 bg-army-500/10 border border-army-500/20 rounded-full flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-army-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-army-400 uppercase tracking-wider">
                    Step {mIdx}.{sIdx}
                  </span>
                </div>

                <StepContent step={currentStep} />
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  onClick={handlePrevious}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200",
                    "border border-white/5 text-muted-foreground hover:bg-white/5 hover:text-white",
                    !currentStep || isNavigating ? "opacity-30 cursor-not-allowed" : ""
                  )}
                  disabled={!currentStep || isNavigating}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>

                <div className="flex items-center gap-4">
                  {!isLastStep() ? (
                    <button
                      onClick={handleNext}
                      className={cn(
                        "flex items-center gap-2 px-6 py-2 bg-army-500 text-secondary rounded-lg font-bold transition-all duration-300",
                        "shadow-lg shadow-army-500/20 hover:shadow-army-500/40 hover:-translate-y-0.5",
                        isNavigating ? "opacity-70 cursor-not-allowed" : ""
                      )}
                      disabled={isNavigating}
                    >
                      {isNavigating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-tr from-army-600 to-army-400 text-secondary rounded-lg font-bold shadow-lg shadow-army-500/20 hover:shadow-army-500/40"
                    >
                      <Trophy className="w-5 h-5" />
                      Complete Course
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Certificate Modal */}
      {user && course && (
        <CertificateModal
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          course={course}
          user={user}
          completedAt={progress?.completedAt || new Date().toISOString()}
          progressId={progress?.id}
          certificate={progress?.certificate}
        />
      )}
    </div>
  );
}
