/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  CalendarCheck2,
  Check,
  CheckSquare,
  Code2,
  FolderLock,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Target,
} from 'lucide-react';
import { CloudDocumentVault } from './components/CloudDocumentVault';
import { GoalVisualizer } from './components/GoalVisualizer';
import { HabitMatrix } from './components/HabitMatrix';
import { JavaSpringInspector } from './components/JavaSpringInspector';
import { SettingsMenu } from './components/SettingsMenu';
import { TaskDashboard } from './components/TaskDashboard';
import {
  getPastDateStrings,
  INITIAL_AUDIT_LOGS,
  INITIAL_DOCUMENTS,
  INITIAL_GOALS,
  INITIAL_HABITS,
  INITIAL_TASKS,
} from './data/initialData';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import {
  getStoredSessionToken,
  logoutFromBackend,
  updateUserTimezone,
  verifyStoredSession,
} from './services/authService';
import {
  CloudDocument,
  GoalItem,
  HabitItem,
  SessionAuditEntry,
  TaskItem,
  TaskStatus,
  UserAccount,
} from './types/plms';

type WorkspaceSection =
  | 'overview'
  | 'tasks'
  | 'habits'
  | 'goals'
  | 'vault'
  | 'java-architecture';

type AuthPageRoute = 'login' | 'signup';

const STORAGE_KEYS = {
  CURRENT_USER: 'plms_active_user_v1',
  TASKS: 'plms_tasks_v1',
  HABITS: 'plms_habits_v1',
  GOALS: 'plms_goals_v1',
  DOCUMENTS: 'plms_documents_v1',
  THEME: 'plms_theme_v1',
  TIMEZONE: 'plms_timezone_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getInitialAuthRoute(): AuthPageRoute {
  if (typeof window !== 'undefined' && window.location.pathname === '/signup') {
    return 'signup';
  }
  return 'login';
}

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    loadFromStorage(STORAGE_KEYS.THEME, false)
  );
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() =>
    loadFromStorage(STORAGE_KEYS.TIMEZONE, 'Asia/Kolkata')
  );
  const [authRoute, setAuthRoute] = useState<AuthPageRoute>(getInitialAuthRoute);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const token = getStoredSessionToken();
    if (!token) return null;
    return loadFromStorage<UserAccount | null>(STORAGE_KEYS.CURRENT_USER, null);
  });
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('overview');

  const [tasks, setTasks] = useState<TaskItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS)
  );
  const [habits, setHabits] = useState<HabitItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.HABITS, INITIAL_HABITS)
  );
  const [goals, setGoals] = useState<GoalItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.GOALS, INITIAL_GOALS)
  );
  const [documents, setDocuments] = useState<CloudDocument[]>(() =>
    loadFromStorage(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS)
  );
  const [auditLogs, setAuditLogs] = useState<SessionAuditEntry[]>(INITIAL_AUDIT_LOGS);

  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>('Just now');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [newTaskTrigger, setNewTaskTrigger] = useState<number>(0);

  // Verify stored token with backend on initial mount
  useEffect(() => {
    const token = getStoredSessionToken();
    if (!token) return;
    verifyStoredSession().then(({ user, auditLogs: serverLogs }) => {
      if (user) {
        setCurrentUser(user);
        if (user.timezone) {
          setSelectedTimezone(user.timezone.split(' ')[0] || 'Asia/Kolkata');
        }
        if (serverLogs && serverLogs.length > 0) {
          setAuditLogs(serverLogs);
        }
      } else {
        setCurrentUser(null);
      }
    });
  }, []);

  // Sync browser popstate navigation for /login and /signup
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/signup') {
        setAuthRoute('signup');
      } else if (path === '/login') {
        setAuthRoute('login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync Dark Mode with <html> element
  useEffect(() => {
    const rootEl = document.documentElement;
    if (darkMode) {
      rootEl.classList.add('dark');
    } else {
      rootEl.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIMEZONE, JSON.stringify(selectedTimezone));
  }, [selectedTimezone]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
  }, [documents]);

  const navigateToAuthPage = (route: AuthPageRoute) => {
    setAuthRoute(route);
    const nextPath = route === 'signup' ? '/signup' : '/login';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  };

  const handleTimezoneChange = async (newTz: string) => {
    setSelectedTimezone(newTz);
    if (currentUser) {
      const updated = await updateUserTimezone(currentUser, newTz);
      setCurrentUser(updated);
      setAuditLogs((prev) => [
        {
          id: `aud-${Date.now().toString().slice(-4)}`,
          event: `Timezone Updated in Settings (${newTz})`,
          ipAddress: '192.0.2.44',
          device: 'Workstation Settings Menu',
          timestamp: 'Just now',
          status: 'Verified',
        },
        ...prev,
      ]);
    }
  };

  const handleAuthSuccess = (
    user: UserAccount,
    _token: string,
    auditEntry?: SessionAuditEntry
  ) => {
    setCurrentUser(user);
    if (user.timezone) {
      setSelectedTimezone(user.timezone.split(' ')[0] || 'Asia/Kolkata');
    }
    if (auditEntry) {
      setAuditLogs((prev) => [auditEntry, ...prev]);
    }
    if (
      window.location.pathname === '/login' ||
      window.location.pathname === '/signup'
    ) {
      window.history.pushState({}, '', '/');
    }
  };

  const handleSignOut = async () => {
    await logoutFromBackend();
    setCurrentUser(null);
    navigateToAuthPage('login');
  };

  const handleSwitchToSignUpFromSettings = async () => {
    await logoutFromBackend();
    setCurrentUser(null);
    navigateToAuthPage('signup');
  };

  // Task Handlers
  const handleAddTask = (task: TaskItem) => {
    setTasks((prev) => [task, ...prev]);
    setLastCloudSyncTime('Just now');
  };

  const handleUpdateTask = (updated: TaskItem) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setLastCloudSyncTime('Just now');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setLastCloudSyncTime('Just now');
  };

  // Habit Handlers
  const handleToggleHabitDate = (habitId: string, dateStr: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.completedDates.includes(dateStr);
        const nextDates = exists
          ? h.completedDates.filter((d) => d !== dateStr)
          : [...h.completedDates, dateStr];
        return { ...h, completedDates: nextDates };
      })
    );
    setLastCloudSyncTime('Just now');
  };

  const handleAddHabit = (habit: HabitItem) => {
    setHabits((prev) => [...prev, habit]);
    setLastCloudSyncTime('Just now');
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setLastCloudSyncTime('Just now');
  };

  // Goal Handlers
  const handleUpdateGoal = (updated: GoalItem) => {
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setLastCloudSyncTime('Just now');
  };

  const handleAddGoal = (goal: GoalItem) => {
    setGoals((prev) => [goal, ...prev]);
    setLastCloudSyncTime('Just now');
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setLastCloudSyncTime('Just now');
  };

  // Document Vault Handlers
  const handleAddDocument = (doc: CloudDocument) => {
    setDocuments((prev) => [doc, ...prev]);
    setLastCloudSyncTime('Just now');
  };

  const handleUpdateDocument = (updated: CloudDocument) => {
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setLastCloudSyncTime('Just now');
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setLastCloudSyncTime('Just now');
  };

  const handleTriggerCloudSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const timeStr = new Date().toTimeString().slice(0, 8);
      setLastCloudSyncTime(`Today at ${timeStr}`);
      setAuditLogs((prev) => [
        {
          id: `aud-${Date.now().toString().slice(-4)}`,
          event: `Manual Cloud Vault SHA-256 Sync (${documents.length} objects verified)`,
          ipAddress: '192.0.2.44',
          device: 'PLMS Sync Service',
          timestamp: 'Just now',
          status: 'Verified',
        },
        ...prev,
      ]);
    }, 350);
  };

  // If unauthenticated, render separate dedicated LoginPage or SignUpPage
  if (!currentUser) {
    if (authRoute === 'signup') {
      return (
        <SignUpPage
          onSignUpSuccess={handleAuthSuccess}
          onNavigateToLogin={() => navigateToAuthPage('login')}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          selectedTimezone={selectedTimezone}
          onTimezoneChange={handleTimezoneChange}
        />
      );
    }

    return (
      <LoginPage
        onLoginSuccess={handleAuthSuccess}
        onNavigateToSignUp={() => navigateToAuthPage('signup')}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        selectedTimezone={selectedTimezone}
        onTimezoneChange={handleTimezoneChange}
      />
    );
  }

  // Computed KPI Metrics for Executive Overview
  const completedTasksCount = tasks.filter(
    (t) => t.status === TaskStatus.COMPLETED
  ).length;
  const taskCompletionRate = Math.round(
    (completedTasksCount / Math.max(1, tasks.length)) * 100
  );
  const totalLoggedMinutes = tasks.reduce((acc, t) => acc + t.loggedMinutes, 0);

  const past14 = getPastDateStrings(14);
  const todayStr = past14[past14.length - 1];
  const habitsCompletedToday = habits.filter((h) =>
    h.completedDates.includes(todayStr)
  ).length;
  const habit14DayChecks = habits.reduce(
    (acc, h) => acc + past14.filter((d) => h.completedDates.includes(d)).length,
    0
  );
  const habit14DayRate = Math.round(
    (habit14DayChecks / Math.max(1, habits.length * 14)) * 100
  );

  const avgGoalCompletion = Math.round(
    goals.reduce(
      (acc, g) =>
        acc + Math.min(100, (g.currentValue / Math.max(1, g.targetValue)) * 100),
      0
    ) / Math.max(1, goals.length)
  );

  const totalVaultKB = (
    documents.reduce((acc, d) => acc + d.sizeBytes, 0) / 1024
  ).toFixed(1);

  const sectionLabels: Record<WorkspaceSection, string> = {
    overview: 'Executive Overview',
    tasks: 'Task Tracking Dashboards',
    habits: '14-Day Habit Matrix',
    goals: 'Goal Visualization',
    vault: 'Cloud Document Vault',
    'java-architecture': 'Java 21 Spring Boot Architecture',
  };

  const userInitials = currentUser.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Left Workspace Navigation Sidebar (256px Fixed) */}
      <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-5 space-y-6">
          {/* Brand Title */}
          <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className="text-left group cursor-pointer"
            >
              <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white font-display">
                Personal Life Management
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Java 21 · Spring Boot 3.4
              </div>
            </button>
          </div>

          {/* Signed-in User Summary Card at Top of Sidebar */}
          <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="w-8 h-8 rounded-md bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {currentUser.fullName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                {selectedTimezone}
              </div>
            </div>
          </div>

          {/* Primary Navigation Links */}
          <nav className="space-y-1">
            {(
              [
                { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
                { id: 'tasks', label: 'Task Dashboards', icon: CheckSquare },
                { id: 'habits', label: 'Habit Matrix', icon: CalendarCheck2 },
                { id: 'goals', label: 'Goal Visualization', icon: Target },
                { id: 'vault', label: 'Cloud Document Vault', icon: FolderLock },
                { id: 'java-architecture', label: 'Java 21 Backend & Audit', icon: Code2 },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* SaaS Top Bar Contract: Breadcrumb Trail Left | Primary Actions + Settings Icon Right */}
        <header className="flex items-center justify-between gap-8 px-6 lg:px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
            <span className="text-slate-900 dark:text-white font-semibold font-display">
              Personal Life Management System
            </span>
            <span aria-hidden="true">/</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold truncate">
              {sectionLabels[activeSection]}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleTriggerCloudSync}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isSyncing ? 'Syncing Vault...' : 'Sync Cloud Vault'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSection('tasks');
                setNewTaskTrigger((n) => n + 1);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>

            {/* Settings Icon housing Sign Out, Sign Up, Timezone (including India), and Theme */}
            <SettingsMenu
              currentUser={currentUser}
              selectedTimezone={selectedTimezone}
              onTimezoneChange={handleTimezoneChange}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              onSignOut={handleSignOut}
              onNavigateToSignUp={handleSwitchToSignUpFromSettings}
            />
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* 4-Column Quantitative KPI Strip (Tabular Numerals) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveSection('tasks')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Task Execution Rate
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {taskCompletionRate}%
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {completedTasksCount}/{tasks.length} Done · {totalLoggedMinutes}m
                </span>
              </div>
            </div>

            <div
              onClick={() => setActiveSection('habits')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400">
                14-Day Habit Consistency
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {habit14DayRate}%
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  Today: {habitsCompletedToday}/{habits.length} Checked
                </span>
              </div>
            </div>

            <div
              onClick={() => setActiveSection('goals')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Goal Roadmap Trajectory
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
                  {avgGoalCompletion}%
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {goals.length} Active Roadmaps
                </span>
              </div>
            </div>

            <div
              onClick={() => setActiveSection('vault')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Cloud Document Vault
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {documents.length} Docs
                </span>
                <span className="text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {totalVaultKB} KB · SHA-256
                </span>
              </div>
            </div>
          </div>

          {/* Section View Router */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Row 1: Priority Task Queue (7 cols) + Today's Habit Check-ins (5 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Active Priority Tasks */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                          Priority Execution Queue
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Click any task check box to complete immediately
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSection('tasks')}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer whitespace-nowrap"
                      >
                        Open Full Task Dashboard →
                      </button>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs mt-2">
                      {tasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="py-3 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateTask({
                                  ...task,
                                  status:
                                    task.status === TaskStatus.COMPLETED
                                      ? TaskStatus.IN_PROGRESS
                                      : TaskStatus.COMPLETED,
                                })
                              }
                              aria-label={`Toggle ${task.title}`}
                              className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 cursor-pointer ${
                                task.status === TaskStatus.COMPLETED
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {task.status === TaskStatus.COMPLETED && (
                                <Check className="w-3 h-3" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <div
                                className={`font-medium truncate ${
                                  task.status === TaskStatus.COMPLETED
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {task.title}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono tabular-nums">{task.id}</span>
                                <span aria-hidden="true">·</span>
                                <span>{task.category}</span>
                                <span aria-hidden="true">·</span>
                                <span>{task.priority} Priority</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                            <div>Due {task.dueDate}</div>
                            <div className="text-[11px]">
                              {task.loggedMinutes}/{task.estimatedMinutes}m
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Today's Habit Protocol Check-In */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                          Today&apos;s Habit Check-In ({todayStr})
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Toggle daily adherence directly from the overview
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSection('habits')}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer whitespace-nowrap"
                      >
                        14-Day Matrix →
                      </button>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs mt-2">
                      {habits.map((habit) => {
                        const doneToday = habit.completedDates.includes(todayStr);
                        return (
                          <div
                            key={habit.id}
                            onClick={() => handleToggleHabitDate(habit.id, todayStr)}
                            className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900 dark:text-white truncate">
                                {habit.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {habit.category} · {habit.unitLabel}
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded font-mono text-[11px] tabular-nums shrink-0 ${
                                doneToday
                                  ? 'bg-emerald-600 text-white font-semibold'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {doneToday ? 'Completed' : 'Mark Done'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Quantitative Goal Roadmaps (7 cols) + Recent Cloud Vault Documents (5 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Goal Progress Summary */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                        Quantitative Goal Trajectory
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Real-time progress against annual and quarterly benchmarks
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('goals')}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer whitespace-nowrap"
                    >
                      Manage Roadmaps →
                    </button>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-slate-800 mt-2">
                    {goals.map((goal) => {
                      const pct = Math.min(
                        100,
                        Math.round(
                          (goal.currentValue / Math.max(1, goal.targetValue)) * 100
                        )
                      );
                      return (
                        <div key={goal.id} className="py-3.5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {goal.title}
                            </span>
                            <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                              {goal.currentValue.toLocaleString()} /{' '}
                              {goal.targetValue.toLocaleString()} {goal.unit} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cloud Vault Quick Access */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                          Cloud-Synced Document Vault
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          SHA-256 verified records & architecture notes
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSection('vault')}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer whitespace-nowrap"
                      >
                        Open Vault →
                      </button>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs mt-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => setActiveSection('vault')}
                          className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {doc.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                              {doc.folder} · v{doc.version} · {doc.syncState}
                            </div>
                          </div>
                          <span className="font-mono text-[11px] tabular-nums text-slate-400 shrink-0">
                            {(doc.sizeBytes / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Last Sync: {lastCloudSyncTime}</span>
                    <button
                      type="button"
                      onClick={() => setActiveSection('java-architecture')}
                      className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Inspect Java 21 Source →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'tasks' && (
            <TaskDashboard
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              externalNewTaskTrigger={newTaskTrigger}
            />
          )}

          {activeSection === 'habits' && (
            <HabitMatrix
              habits={habits}
              onToggleHabitDate={handleToggleHabitDate}
              onAddHabit={handleAddHabit}
              onDeleteHabit={handleDeleteHabit}
            />
          )}

          {activeSection === 'goals' && (
            <GoalVisualizer
              goals={goals}
              onUpdateGoal={handleUpdateGoal}
              onAddGoal={handleAddGoal}
              onDeleteGoal={handleDeleteGoal}
            />
          )}

          {activeSection === 'vault' && (
            <CloudDocumentVault
              documents={documents}
              onAddDocument={handleAddDocument}
              onUpdateDocument={handleUpdateDocument}
              onDeleteDocument={handleDeleteDocument}
              onTriggerCloudSync={handleTriggerCloudSync}
              lastCloudSyncTime={lastCloudSyncTime}
              isSyncing={isSyncing}
            />
          )}

          {activeSection === 'java-architecture' && (
            <JavaSpringInspector
              currentUser={currentUser}
              tasks={tasks}
              habits={habits}
              goals={goals}
              documents={documents}
              auditLogs={auditLogs}
            />
          )}
        </main>
      </div>
    </div>
  );
}
