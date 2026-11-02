import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  FolderLock,
  KeyRound,
  Lock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { SettingsMenu } from '../components/SettingsMenu';
import { INITIAL_USER } from '../data/initialData';
import { checkBackendHealth, loginWithBackend } from '../services/authService';
import { SessionAuditEntry, UserAccount } from '../types/plms';

interface LoginPageProps {
  onLoginSuccess: (
    user: UserAccount,
    token: string,
    auditEntry?: SessionAuditEntry
  ) => void;
  onNavigateToSignUp: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  selectedTimezone: string;
  onTimezoneChange: (tz: string) => void;
}

interface LoginFieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToSignUp,
  darkMode,
  onToggleDarkMode,
  selectedTimezone,
  onTimezoneChange,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberSession, setRememberSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeFeaturePreview, setActiveFeaturePreview] = useState<
    'tasks' | 'habits' | 'goals' | 'vault'
  >('tasks');
  const [dbHealth, setDbHealth] = useState<{
    online: boolean;
    registeredUsersCount: number;
  }>({ online: true, registeredUsersCount: 1 });

  useEffect(() => {
    checkBackendHealth().then(setDbHealth);
  }, []);

  const validateFields = (
    currentEmail: string,
    currentPassword: string
  ): LoginFieldErrors => {
    const errors: LoginFieldErrors = {};
    const trimmedEmail = currentEmail.trim();

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address (e.g. name@domain.com).';
    }

    if (!currentPassword) {
      errors.password = 'Password is required.';
    } else if (currentPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    return errors;
  };

  useEffect(() => {
    if (touched.email || touched.password) {
      setFieldErrors(validateFields(email, password));
    }
  }, [email, password, touched]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setTouched({ email: true, password: true });

    const errors = validateFields(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await loginWithBackend(email, password);
      onLoginSuccess(response.user, response.token, response.auditEntry);
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : 'Unable to authenticate with the database. Please verify your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoQuickSignIn = async () => {
    const demoEmail = INITIAL_USER.email;
    const demoPwd = 'Architect2026!';
    setEmail(demoEmail);
    setPassword(demoPwd);
    setFieldErrors({});
    setServerError(null);
    setIsSubmitting(true);

    try {
      const response = await loginWithBackend(demoEmail, demoPwd);
      onLoginSuccess(response.user, response.token, response.auditEntry);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Bar Contract: Zone 1 Brand | Zone 2 4 Nav Links | Zone 3 Settings Action */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault();
          }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 font-display"
        >
          Personal Life Management System
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a
            href="#tasks"
            onClick={(e) => {
              e.preventDefault();
              setActiveFeaturePreview('tasks');
            }}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Task Dashboards
          </a>
          <a
            href="#habits"
            onClick={(e) => {
              e.preventDefault();
              setActiveFeaturePreview('habits');
            }}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Habit Matrix
          </a>
          <a
            href="#goals"
            onClick={(e) => {
              e.preventDefault();
              setActiveFeaturePreview('goals');
            }}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Goal Roadmaps
          </a>
          <a
            href="/signup"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToSignUp();
            }}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Sign Up
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <SettingsMenu
            currentUser={null}
            selectedTimezone={selectedTimezone}
            onTimezoneChange={onTimezoneChange}
            darkMode={darkMode}
            onToggleDarkMode={onToggleDarkMode}
            onNavigateToLogin={() => {}}
            onNavigateToSignUp={onNavigateToSignUp}
          />
        </div>
      </header>

      {/* Main Layout: Login Card First at the Top (order-1) so it is never pushed down */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Login Form Card Placed First in DOM (order-1 on mobile & desktop left/right) */}
        <div className="lg:col-span-5 order-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs font-mono text-blue-600 dark:text-blue-400 mb-0.5">
                  /login · Authentication Gateway
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                  Log In to Your Account
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter your registered email and master password
                </p>
              </div>
              <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
            </div>

            {serverError && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2 leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
              {/* Email Field with Validation */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(touched.email && fieldErrors.email)}
                  placeholder="elena.vance@plms-enterprise.io"
                  className={`w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    touched.email && fieldErrors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-blue-600'
                  }`}
                />
                {touched.email && fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Password Field with Validation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <span className="font-mono text-[11px] tabular-nums text-slate-400">
                    Min 8 characters
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={Boolean(touched.password && fieldErrors.password)}
                    placeholder="Enter your password"
                    className={`w-full pl-3.5 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                      touched.password && fieldErrors.password
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-blue-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {touched.password && fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Session Persistence Checkbox & DB Status */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span>Keep session active</span>
                </label>

                <span className="flex items-center gap-1 text-[11px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  <Database className="w-3 h-3" />
                  <span>DB Connected · {selectedTimezone.split(' ')[0]}</span>
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                {isSubmitting ? 'Verifying Credentials...' : 'Log In to Workspace'}
              </button>
            </form>

            {/* Quick Demo Account Sign-In */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Demo Executive Account</span>
                <span className="font-mono tabular-nums">elena.vance@plms-enterprise.io</span>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDemoQuickSignIn}
                className="w-full py-2 px-4 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Instant Login with Demo Executive Profile</span>
              </button>
            </div>
          </div>

          {/* Dedicated Sign Up Page Navigation Footer */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Don&apos;t have a PLMS account yet?
            </span>
            <button
              type="button"
              onClick={onNavigateToSignUp}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Go to Sign Up Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Architectural Overview & Interactive Mechanism Preview (7 cols, order-2) */}
        <div className="lg:col-span-7 order-2 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7">
          <div>
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
              Java 21 Spring Boot 3.4 Architecture · RS256 Session Security · SHA-256 Cloud Vault
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-display leading-tight mb-3"
              style={{ textWrap: 'balance' }}
            >
              Unified executive command for tasks, habits, quantitative goals, and encrypted documents.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mb-6">
              Sign in to your Personal Life Management System account to synchronize task execution queues, 14-day habit matrices, quantitative goal trajectories, and SHA-256 verified cloud documents. Use the Settings icon in the top bar anytime to change your timezone or switch accounts.
            </p>

            {/* Interactive Module Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-5 w-fit">
              <button
                type="button"
                onClick={() => setActiveFeaturePreview('tasks')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeFeaturePreview === 'tasks'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                01. Task Execution
              </button>
              <button
                type="button"
                onClick={() => setActiveFeaturePreview('habits')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeFeaturePreview === 'habits'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                02. 14-Day Habit Matrix
              </button>
              <button
                type="button"
                onClick={() => setActiveFeaturePreview('goals')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeFeaturePreview === 'goals'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                03. Goal Visualization
              </button>
              <button
                type="button"
                onClick={() => setActiveFeaturePreview('vault')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeFeaturePreview === 'vault'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                04. Cloud Document Vault
              </button>
            </div>

            {/* Mechanism-to-Outcome Live Preview Surface */}
            <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
              {activeFeaturePreview === 'tasks' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Interactive Task Tracking & Deep Work Timer
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        High-density priority queues · Subtask checklists · Integrated Pomodoro focus logger
                      </p>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-blue-600 dark:text-blue-400">
                      6 Active Tasks · 84% On-Time
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    <div className="py-2 flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        Finalize Spring Boot 3.4 OAuth2 Resource Server & JWT Key Rotation
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                        High · 65/90m logged
                      </span>
                    </div>
                    <div className="py-2 flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        Rebalance Q4 Tax-Advantaged Index Portfolio & Treasury Ladder
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                        High · Due Tomorrow
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeFeaturePreview === 'habits' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        14-Day Habit Consistency Spreadsheet Matrix
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Single-click daily check-in grid · Automated streak math · Category frequency targets
                      </p>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                      88.6% 14-Day Consistency
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    <div className="py-2 flex items-center justify-between">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Deep Architecture Focus (90m Uninterrupted)
                      </span>
                      <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        8 day streak · 13/14 days
                      </span>
                    </div>
                    <div className="py-2 flex items-center justify-between">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Technical Literature & Paper Reading (30 Pages)
                      </span>
                      <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        7 day streak · 12/14 days
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeFeaturePreview === 'goals' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Quantitative Goal Visualization & Milestone Roadmaps
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Radial progress rings · Milestone completion checkpoints · Target trajectory tracking
                      </p>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-blue-600 dark:text-blue-400">
                      4 Active Roadmaps
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    <div className="py-2 flex items-center justify-between">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Liquid Treasury & High-Yield Reserve Fund
                      </span>
                      <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        $42,500 / $50,000 USD (85.0%)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeFeaturePreview === 'vault' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Cloud-Synced Document Storage & SHA-256 Integrity Vault
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Drag-and-drop file ingestion · Built-in Markdown editor · Cryptographic hash verification
                      </p>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                      AES-256 / SHA-256 Verified
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    <div className="py-2 flex items-center justify-between">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        2026-q4-treasury-allocation.md
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        Financial Records · v4 · Synced
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Quantitative Architecture Metrics Strip */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Auth Protocol</span>
              </div>
              <p className="font-mono text-xs sm:text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                PBKDF2 + JWT
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Backend Engine</span>
              </div>
              <p className="font-mono text-xs sm:text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                Java 21 + Spring 3.4
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <FolderLock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Registered Profiles</span>
              </div>
              <p className="font-mono text-xs sm:text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                {dbHealth.registeredUsersCount} Active in DB
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
