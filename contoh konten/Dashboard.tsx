import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LogOut,
  ChevronLeft,
  User,
  Wrench,
  Settings,
  FolderOpen,
  FileText,
  BookOpen,
  Box,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Modular Components
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ProfileTab } from '@/components/dashboard/ProfileTab';
import { BookingsTab } from '@/components/dashboard/BookingsTab';
import { RequestedFilesTab } from '@/components/dashboard/RequestedFilesTab';
import { ProductHistoryTab } from '@/components/dashboard/ProductHistoryTab';
import { RevitFilesTab } from '@/components/dashboard/RevitFilesTab';
import { ResourcesTab } from '@/components/dashboard/ResourcesTab';
import { SettingsTab } from '@/components/dashboard/SettingsTab';
import { motion } from 'framer-motion';
import type { UserProfile } from '@/types/dashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 768px)').matches;
  });
  const [ userpanelOpen, setUserpanelOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);

    // sync in case of hydration / initial mismatch
    setSidebarOpen(mq.matches);

    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  const toggleUserpanel = () => {
    setUserpanelOpen(!userpanelOpen);
  };
  const openSettingsTab = () => {
    setActiveTab('settings');
    setUserpanelOpen(false);
  };

  const getFileUrl = (record: UserProfile, fileName: string): string => {
    return `${import.meta.env.VITE_POCKETBASE_URL}/api/files/_pb_users_auth_/${record.id}/${fileName}`;
  };

  return (
    <div className="min-h-screen bg-background py-6 pb-12">
      <div className="px-6 lg:px-20">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mx-auto flex gap-0 items-end"
        >
          {/* Sidebar */}
          <div 
            className={`sticky relative top-0 right-0 bottom-0 z-20 ${
              sidebarOpen ? 'left-[100dvw] md:left-[300px]' : 'left-0'
            }`}
          >
            {/* Toggle sidebar button (selalu terlihat) */}
            <div className={`fixed bottom-0 top-0 z-20 h-full w-12 flex justify-center  ${
              sidebarOpen ? 'left-[calc(100dvw-64px)] md:left-[300px] bg-transparent md:bg-secondary rounded-r-2xl' : 'left-0 bg-transparent'} transition-all duration-300 `}>
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer w-8 h-8 mt-6 lg:mt-20 rounded-full shadow-md shadow-army-500"
                onClick={toggleSidebar}
              >
                <ChevronLeft className={`w-4 h-4 text-army-500 transition-all duration-300 ${sidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
              </Button>
            </div>

            <TabsList
              className={`fixed bottom-0 top-0 bg-secondary p-1 flex gap-2 flex-col items-center justify-between h-[100dvh] w-[100dvw] md:w-[300px] transition-all duration-300 ${
                sidebarOpen ? 'left-0' : '-left-[100dvw] md:-left-[300px]'
              }`}
            >
              <>
                <div className="flex flex-col items-start justify-center gap-1.5 px-2 w-full">
                  {/* Logo - konsisten dengan Header */}
                  <Link
                    to="/"
                    className="relative z-[110] py-6 flex items-center justify-center w-full"
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 flex items-center justify-center">
                        <img src="/logo.png" alt="Dahar Engineer" />
                      </div>
                      <div className="">
                        <span className="text-lg font-semibold tracking-tight">DAHAR</span>
                        <span className="text-lg font-light text-muted-foreground ml-1">
                          ENGINEER
                        </span>
                      </div>
                    </motion.div>
                  </Link>

                  <div className='h-1 border-t w-full'/>
                  
                  {/* Nav items - teks rapat kiri; ikon + geser teks ke kanan hanya saat hover/aktif */}
                  <TabsTrigger
                    value="overview"
                    className="group relative w-full flex items-center justify-start gap-0 py-2 px-3 -mx-1 rounded-sm text-sm
                               text-foreground/70 hover:text-foreground hover:bg-secondary/40
                               hover:gap-3 data-[state=active]:gap-3
                               data-[state=active]:text-army-400 data-[state=active]:bg-transparent
                               transition-all duration-200"
                  >
                    {activeTab === 'overview' && (
                      <motion.div
                        layoutId="dashboardTabIndicator"
                        className="absolute left-0 inset-y-0 my-auto h-6 w-1 bg-army-500 rounded-r-sm"
                        transition={{ type: 'spring', stiffness: 600, damping: 45 }}
                      />
                    )}
                    <span className="w-0 min-w-0 overflow-hidden shrink-0 flex items-center justify-center
                                   group-hover:w-4 group-hover:min-w-4 group-data-[state=active]:w-4 group-data-[state=active]:min-w-4
                                   transition-all duration-200">
                      <LayoutDashboard className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 group-data-[state=active]:opacity-100 transition-opacity" />
                    </span>
                    <span className="tracking-tight">Overview</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="profile"
                    className="group relative w-full flex items-center justify-start gap-0 py-2 px-3 -mx-1 rounded-sm text-sm
                               text-foreground/70 hover:text-foreground hover:bg-secondary/40
                               hover:gap-3 data-[state=active]:gap-3
                               data-[state=active]:text-army-400 data-[state=active]:bg-transparent
                               transition-all duration-200"
                  >
                    {activeTab === 'profile' && (
                      <motion.div
                        layoutId="dashboardTabIndicator"
                        className="absolute left-0 inset-y-0 my-auto h-6 w-1 bg-army-500 rounded-r-sm"
                        transition={{ type: 'spring', stiffness: 600, damping: 45 }}
                      />
                    )}
                    <span className="w-0 min-w-0 overflow-hidden shrink-0 flex items-center justify-center
                                   group-hover:w-4 group-hover:min-w-4 group-data-[state=active]:w-4 group-data-[state=active]:min-w-4
                                   transition-all duration-200">
                      <User className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 group-data-[state=active]:opacity-100 transition-opacity" />
                    </span>
                    <span className="tracking-tight">Profile</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="bookings"
                    className="group relative w-full flex items-center justify-start gap-0 py-2 px-3 -mx-1 rounded-sm text-sm
                               text-foreground/70 hover:text-foreground hover:bg-secondary/40
                               hover:gap-3 data-[state=active]:gap-3
                               data-[state=active]:text-army-400 data-[state=active]:bg-transparent
                               transition-all duration-200"
                  >
                    {activeTab === 'bookings' && (
                      <motion.div
                        layoutId="dashboardTabIndicator"
                        className="absolute left-0 inset-y-0 my-auto h-6 w-1 bg-army-500 rounded-r-sm"
                        transition={{ type: 'spring', stiffness: 600, damping: 45 }}
                      />
                    )}
                    <span className="w-0 min-w-0 overflow-hidden shrink-0 flex items-center justify-center
                                   group-hover:w-4 group-hover:min-w-4 group-data-[state=active]:w-4 group-data-[state=active]:min-w-4
                                   transition-all duration-200">
                      <Wrench className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 group-data-[state=active]:opacity-100 transition-opacity" />
                    </span>
                    <span className="tracking-tight">Bookings</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="files"
                    className="group relative w-full flex items-center justify-start gap-0 py-2 px-3 -mx-1 rounded-sm text-sm
                               text-foreground/70 hover:text-foreground hover:bg-secondary/40
                               hover:gap-3 data-[state=active]:gap-3
                               data-[state=active]:text-army-400 data-[state=active]:bg-transparent
                               transition-all duration-200"
                  >
                    {activeTab === 'files' && (
                      <motion.div
                        layoutId="dashboardTabIndicator"
                        className="absolute left-0 inset-y-0 my-auto h-6 w-1 bg-army-500 rounded-r-sm"
                        transition={{ type: 'spring', stiffness: 600, damping: 45 }}
                      />
                    )}
                    <span className="w-0 min-w-0 overflow-hidden shrink-0 flex items-center justify-center
                                   group-hover:w-4 group-hover:min-w-4 group-data-[state=active]:w-4 group-data-[state=active]:min-w-4
                                   transition-all duration-200">
                      <FolderOpen className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 group-data-[state=active]:opacity-100 transition-opacity" />
                    </span>
                    <span className="tracking-tight">Requested Files</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="history"
                    className="group relative w-full flex items-center justify-start gap-0 py-2 px-3 -mx-1 rounded-sm text-sm
                               text-foreground/70 hover:text-foreground hover:bg-secondary/40
                               hover:gap-3 data-[state=active]:gap-3
                               data-[state=active]:text-army-400 data-[state=active]:bg-transparent
                               transition-all duration-200"
                  >
                    {activeTab === 'history' && (
                      <motion.div
                        layoutId="dashboardTabIndicator"
                        className="absolute left-0 inset-y-0 my-auto h-6 w-1 bg-army-500 rounded-r-sm"
                        transition={{ type: 'spring', stiffness: 600, damping: 45 }}
                      />
                    )}
                    <span className="w-0 min-w-0 overflow-hidden shrink-0 flex items-center justify-center
                                   group-hover:w-4 group-hover:min-w-4 group-data-[state=active]:w-4 group-data-[state=active]:min-w-4
                                   transition-all duration-200">
                      <FileText className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 group-data-[state=active]:opacity-100 transition-opacity" />
                    </span>
                    <span className="tracking-tight">Product History</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="revit"
                    className="group relative w-full flex items-center justify-start gap-0 py-2 px-3 -mx-1 rounded-sm text-sm
                               text-foreground/70 hover:text-foreground hover:bg-secondary/40
                               hover:gap-3 data-[state=active]:gap-3
                               data-[state=active]:text-army-400 data-[state=active]:bg-transparent
                               transition-all duration-200"
                  >
                    {activeTab === 'revit' && (
                      <motion.div
                        layoutId="dashboardTabIndicator"
                        className="absolute left-0 inset-y-0 my-auto h-6 w-1 bg-army-500 rounded-r-sm"
                        transition={{ type: 'spring', stiffness: 600, damping: 45 }}
                      />
                    )}
                    <span className="w-0 min-w-0 overflow-hidden shrink-0 flex items-center justify-center
                                   group-hover:w-4 group-hover:min-w-4 group-data-[state=active]:w-4 group-data-[state=active]:min-w-4
                                   transition-all duration-200">
                      <Box className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 group-data-[state=active]:opacity-100 transition-opacity" />
                    </span>
                    <span className="tracking-tight">My Revit Files</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="resources"
                    className="group relative w-full flex items-center justify-start gap-0 py-2 px-3 -mx-1 rounded-sm text-sm
                               text-foreground/70 hover:text-foreground hover:bg-secondary/40
                               hover:gap-3 data-[state=active]:gap-3
                               data-[state=active]:text-army-400 data-[state=active]:bg-transparent
                               transition-all duration-200"
                  >
                    {activeTab === 'resources' && (
                      <motion.div
                        layoutId="dashboardTabIndicator"
                        className="absolute left-0 inset-y-0 my-auto h-6 w-1 bg-army-500 rounded-r-sm"
                        transition={{ type: 'spring', stiffness: 600, damping: 45 }}
                      />
                    )}
                    <span className="w-0 min-w-0 overflow-hidden shrink-0 flex items-center justify-center
                                   group-hover:w-4 group-hover:min-w-4 group-data-[state=active]:w-4 group-data-[state=active]:min-w-4
                                   transition-all duration-200">
                      <BookOpen className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 group-data-[state=active]:opacity-100 transition-opacity" />
                    </span>
                    <span className="tracking-tight">My Resources</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="settings"
                    className="group relative w-full flex items-center justify-start gap-0 py-2 px-3 -mx-1 rounded-sm text-sm
                               text-foreground/70 hover:text-foreground hover:bg-secondary/40
                               hover:gap-3 data-[state=active]:gap-3
                               data-[state=active]:text-army-400 data-[state=active]:bg-transparent
                               transition-all duration-200"
                  >
                    {activeTab === 'settings' && (
                      <motion.div
                        layoutId="dashboardTabIndicator"
                        className="absolute left-0 inset-y-0 my-auto h-6 w-1 bg-army-500 rounded-r-sm"
                        transition={{ type: 'spring', stiffness: 600, damping: 45 }}
                      />
                    )}
                    <span className="w-0 min-w-0 overflow-hidden shrink-0 flex items-center justify-center
                                   group-hover:w-4 group-hover:min-w-4 group-data-[state=active]:w-4 group-data-[state=active]:min-w-4
                                   transition-all duration-200">
                      <Settings className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 group-data-[state=active]:opacity-100 transition-opacity" />
                    </span>
                    <span className="tracking-tight">Settings</span>
                  </TabsTrigger>
                </div>
              </>

              <div className="border-t border-white/5 relative w-full p-4">
                <button
                  onClick={toggleUserpanel}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-army-900/60 transition-colors duration-200 group"
                >
                  <div
                    className={`relative w-10 h-10 flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-tr from-army-700 to-army-400 shadow-md shadow-black/40 ${
                      user?.avatar ? '' : 'text-white'
                    }`}
                  >
                    {user?.avatar ? (
                      <img
                        src={getFileUrl(user, user.avatar)}
                        alt={user?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    <span className="absolute inset-0 rounded-full ring-1 ring-white/10 group-hover:ring-2 group-hover:ring-army-400 transition-all duration-200" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-medium text-left truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground text-left truncate">
                      {user?.email}
                    </p>
                  </div>
                </button>

                {userpanelOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute -top-32 right-2 flex flex-col gap-2 min-w-[190px] bg-army-1000 border border-white/10 shadow-xl shadow-black/40 rounded-xl p-3 backdrop-blur-md"
                  >
                    <p className="text-xs text-muted-foreground mb-1 px-1">
                      Quick actions
                    </p>
                    <Button
                      variant="ghost"
                      className="justify-start w-full hover:bg-army-800/60"
                      onClick={openSettingsTab}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start w-full hover:bg-red-900/60 text-red-200"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </motion.div>
                )}
              </div>
            </TabsList>
          </div>

          {/* Main content */}
          <div className={`flex-1 transition-all duration-300  ${!sidebarOpen ? 'w-full' : 'w-full lg:w-[calc(100%-300px)]'}`}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 pl-12 lg:pl-0">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Welcome back, {user?.name || 'User'}
                </p>
              </div>
            </div>

            {/* Tabs content */}
            <TabsContent value="overview" className="mt-6 outline-none">
              <StatsCards />
            </TabsContent>

            <TabsContent value="profile" className="mt-6 outline-none">
              <ProfileTab />
            </TabsContent>

            <TabsContent value="bookings" className="mt-6 outline-none">
              <BookingsTab />
            </TabsContent>

            <TabsContent value="files" className="mt-6 outline-none">
              <RequestedFilesTab />
            </TabsContent>

            <TabsContent value="history" className="mt-6 outline-none">
              <ProductHistoryTab />
            </TabsContent>

            <TabsContent value="revit" className="mt-6 outline-none">
              <RevitFilesTab />
            </TabsContent>

            <TabsContent value="resources" className="mt-6 outline-none">
              <ResourcesTab />
            </TabsContent>

            <TabsContent value="settings" className="mt-6 outline-none">
              <SettingsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
