export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: string;
}

export interface Mentor {
  id: string;
  name: string;
  specialization: string;
  email: string;
  image?: string;
  isActive: boolean;
  tags?: string[];
  dayAvail?: string[];
  startTimeActive?: string;
  endTimeActive?: string;
  created: string;
  updated: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  instructor: string; // ID of the mentor
  expand?: {
    instructor?: Mentor;
  };
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  totalModules: number;
  totalSteps: number;
  price?: number;
  created: string;
  updated: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  steps: Step[];
  created: string;
  updated: string;
}

export interface Step {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  order: number;
  type: 'text' | 'video' | 'quiz' | 'assignment';
  videoUrl?: string;
  files?: string[];
  created: string;
  updated: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  completedSteps: string[];
  completedModules: string[];
  currentStepId: string | null;
  currentModuleId: string | null;
  startedAt: string;
  completedAt: string | null;
  lastAccessedAt: string;
  certificateIssued: boolean;
  certificate?: string;
  certificateUrl?: string;
  created: string;
  updated: string;
}

export interface CourseWithProgress extends Course {
  progress: UserProgress | null;
  progressPercentage: number;
  isStarted: boolean;
  isCompleted: boolean;
}

export interface ModuleWithProgress extends Module {
  steps: Step[];
  isCompleted: boolean;
  completedStepsCount: number;
  totalStepsCount: number;
  progressPercentage: number;
}

export interface StepWithStatus extends Step {
  isCompleted: boolean;
  isLocked: boolean;
  isCurrent: boolean;
}

export interface OnlineCourseAccess {
  id: string;
  user_id: string;
  online_course_id: string;
  payment_status: string;
  course_id?: string;
  course_name?: string;
  access_granted_at?: string;
  expires_at?: string;
  payment_amount?: number;
  payment_currency?: string;
  xendit_payment_id?: string;
  external_id?: string;
  old_user_id?: string;
  created: string;
  updated: string;
}
