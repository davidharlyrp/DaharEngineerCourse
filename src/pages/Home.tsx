import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Clock, BarChart3, PlayCircle, CheckCircle2, ArrowRight, User as UserIcon, LineChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { usePocketBase } from '../contexts/PocketBaseContext';
import type { Course, UserProgress } from '../types';

interface CourseWithProgress extends Course {
  progress: UserProgress | null;
  progressPercentage: number;
  isStarted: boolean;
  isCompleted: boolean;
}

export function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { pb } = usePocketBase();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchCourses = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        const accessResult = await pb.collection('online_course_access').getList(1, 50, {
          filter: `user_id = "${user.id}" && payment_status = "paid"`,
          expand: 'online_course_id,online_course_id.instructor',
          sort: '-created',
          requestKey: null,
        });

        const enrolledCourses = accessResult.items
          .map(record => record.expand?.online_course_id)
          .filter(Boolean);

        if (enrolledCourses.length === 0) {
          setCourses([]);
          return;
        }

        const progressResult = await pb.collection('online_course_progress').getList(1, 100, {
          filter: `userId = "${user.id}"`,
          requestKey: null,
        });

        const progressMap = new Map(
          progressResult.items.map(p => [p.courseId, p])
        );

        const coursesWithProgress: CourseWithProgress[] = enrolledCourses.map(course => {
          const progress = progressMap.get(course.id);
          const totalSteps = course.totalSteps || 1;
          const completedSteps = progress?.completedSteps?.length || 0;
          const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

          return {
            ...course,
            thumbnail: course.thumbnail ? pb.files.getUrl(course, course.thumbnail) : undefined,
            progress: progress ? {
              ...progress,
              completedSteps: progress.completedSteps || [],
              completedModules: progress.completedModules || [],
            } : null,
            progressPercentage,
            isStarted: !!progress,
            isCompleted: !!progress?.completedAt,
          } as CourseWithProgress;
        });

        setCourses(coursesWithProgress);
      } catch (error: any) {
        if (error.status === 0) return;
        console.error('Error fetching enrolled courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [pb, user, isAuthenticated, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-army-500 border-t-transparent animate-spin rounded-full" />
          <span className="text-army-400 font-bold tracking-widest uppercase text-xs">Memuat Kursus...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary text-white font-sans selection:bg-army-500/30">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-secondary/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/logo.png" alt="Dahar Engineer" className="w-8 h-8" />
            </div>

            <div className=" flex items-center">
              <span className="text-2xl font-semibold tracking-tight">DAHAR</span>
              <span className="text-2xl font-light text-muted-foreground ml-1">
                ENGINEER
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-4 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-army-500/10 flex items-center justify-center border border-army-500/20">
                {user?.avatar ? (
                  <img src={pb.files.getUrl(user, user.avatar)} alt="Avatar" className="w-8 h-8 rounded-full" />
                ) : (
                  <UserIcon className="w-4 h-4 text-army-500" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-none">{user?.name}</span>
                <span className="text-[10px] text-muted-foreground">{user?.email}</span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-transparent hover:border-red-400/20"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8"
          >
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-[0.9]">
                Welcome back,<br />
                <span className="text-army-400">{user?.name?.split(' ')[0]}</span>.
              </h1>
              <p className="text-muted-foreground text-lg max-w-lg leading-relaxed">
                Access all course materials and monitor your progress in one prestigious place.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-8 py-4 bg-white/5 border border-white/5 rounded-lg text-center min-w-[100px] backdrop-blur-sm">
                <p className="text-[10px] font-bold text-army-400 uppercase tracking-widest mb-2 opacity-60">Enrolled</p>
                <p className="text-2xl font-black leading-none">{courses.length}</p>
              </div>
              <div className="px-8 py-4 bg-army-500 border border-army-500 rounded-lg text-center min-w-[100px] shadow-2xl shadow-army-500/20">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2 opacity-60">Completed</p>
                <p className="text-2xl font-black text-secondary leading-none">
                  {courses.filter(c => c.isCompleted).length}
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Course Grid */}
        <section>
          {courses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 bg-white/5 border border-dashed border-white/10 rounded-xl"
            >
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8">
                <BookOpen className="w-10 h-10 text-army-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">You don't have any courses yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-10 px-6 leading-relaxed">
                You don't have any courses yet. Please contact the admin or find a course in the catalog.
              </p>
              <button onClick={() => window.open("https://daharengineer.com/courses/online-courses", "_blank")} className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:bg-army-500 hover:text-white transition-all shadow-xl shadow-white/5 hover:shadow-army-500/20 active:scale-95">
                Explore Available Courses
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {courses.map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  whileHover={{ y: -12 }}
                  onClick={() => navigate(`/course/${course.slug}`)}
                  className="group relative flex flex-col bg-dark-900 border border-white/5 rounded-lg overflow-hidden hover:border-army-500/40 transition-all duration-500 cursor-pointer shadow-2xl hover:shadow-army-500/20"
                >
                  {/* Thumbnail Container */}
                  <div className="aspect-[16/10] relative overflow-hidden m-2 rounded-lg">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                    ) : (
                      <div className="w-full h-full bg-dark-800 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-white/5" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent opacity-40" />
                  </div>

                  <div className="px-8 pb-2 pt-2 flex-1 flex flex-col">
                    <div className="mb-6">
                      <h3 className="text-lg font-black leading-tight mb-3 group-hover:text-army-400 transition-colors tracking-tight">
                        {course.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed opacity-80">
                        {course.description}
                      </p>
                    </div>

                    {/* Stats Icons */}
                    <div className="flex flex-col items-start gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <BarChart3 className="w-4 h-4 text-army-500" />
                        <span className="text-xs font-bold">{course.totalModules}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Modules</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-army-500" />
                        <span className="text-xs font-bold">{course.duration}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Duration</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <LineChart className="w-4 h-4 text-army-500" />
                        <span className="text-xs font-bold">{course.level}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Level</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-2 border-t border-white/5">
                      {/* Progress Section */}
                      <div className="mb-2">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">Progress</span>
                          <span className="text-sm font-bold text-army-400 leading-none">{Math.round(course.progressPercentage)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progressPercentage}%` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className="h-full bg-army-500 rounded-full shadow-[0_0_20px_rgba(134,142,42,0.4)]"
                          />
                        </div>
                      </div>

                      {/* Footer Interaction */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {course.isCompleted ? (
                            <div className="flex items-center gap-2.5 text-army-400">
                              <div className="p-2 bg-army-400/10 rounded-full border border-army-400/20">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold uppercase tracking-[0.1em]">Finished</span>
                            </div>
                          ) : course.isStarted ? (
                            <div className="flex items-center gap-2.5 text-white">
                              <div className="p-2 bg-army-500/20 rounded-full border border-army-500/30 animate-pulse">
                                <PlayCircle className="w-4 h-4 text-army-400" />
                              </div>
                              <span className="text-xs font-bold uppercase tracking-[0.1em]">Continue</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5 text-muted-foreground">
                              <div className="p-2 bg-white/5 rounded-full border border-white/5">
                                <PlayCircle className="w-4 h-4 opacity-40" />
                              </div>
                              <span className="text-xs font-bold uppercase tracking-[0.1em]">Start</span>
                            </div>
                          )}
                        </div>
                        <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-[18px] flex items-center justify-center group-hover:bg-army-500 group-hover:border-army-500 group-hover:shadow-lg group-hover:shadow-army-500/20 transition-all duration-500">
                          <ArrowRight className="w-4 h-4 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aesthetic highlight sweep */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="py-12 border-t border-white/5 bg-dark-950/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.3em] opacity-40">
            &copy; {new Date().getFullYear()} Dahar Engineer Consultant • Elevating Excellence
          </p>
        </div>
      </footer>
    </div>
  );
}
