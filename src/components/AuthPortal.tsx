import React, { useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  FolderLock,
  KeyRound,
  Lock,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';
import { computeDeterministicHash, INITIAL_USER } from '../data/initialData';
import { UserAccount } from '../types/plms';

interface AuthPortalProps {
  registeredUsers: UserAccount[];
  onAuthenticated: (user: UserAccount, method: string) => void;
  onRegisterUser: (user: UserAccount) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  registeredUsers,
  onAuthenticated,
  onRegisterUser,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(INITIAL_USER.email);
  const [password, setPassword] = useState('Architect2026!');
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Senior Software Architect');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFeaturePreview, setActiveFeaturePreview] = useState<'tasks' | 'habits' | 'goals' | 'vault'>('tasks');

  const evaluatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const pwdScore = evaluatePasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (mode === 'login') {
      const matched = registeredUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );
      const hashedInput = computeDeterministicHash(password);

      if (!matched || matched.passwordHash !== hashedInput) {
        setErrorMessage(
          'Invalid credentials. Use the Demo Executive Profile button below or register a new account.'
        );
        return;
      }

      onAuthenticated(
        {
          ...matched,
          lastLoginAt: new Date().toISOString(),
        },
        'Spring Security JWT (RS256 Password Grant)'
      );
    } else {
      if (fullName.trim().length < 2) {
        setErrorMessage('Please provide your full name (minimum 2 characters).');
        return;
      }
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        return;
      }
      const existing = registeredUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );
      if (existing) {
        setErrorMessage('An account with this email already exists. Please sign in.');
        return;
      }

      const newUser: UserAccount = {
        id: `usr-${Date.now()}`,
        fullName: fullName.trim(),
        email: normalizedEmail,
        roleTitle: roleTitle.trim() || 'Executive Member',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        passwordHash: computeDeterministicHash(password),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      onRegisterUser(newUser);
    }
  };

  const handleDemoQuickSignIn = () => {
    setEmail(INITIAL_USER.email);
    setPassword('Architect2026!');
    setErrorMessage(null);
    onAuthenticated(
      {
        ...INITIAL_USER,
        lastLoginAt: new Date().toISOString(),
      },
      'Executive Demo Session (RS256 Verified)'
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Bar Contract: Zone 1 Brand | Zone 2 4 Nav Links | Zone 3 1 Primary Action */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveFeaturePreview('tasks');
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
            href="#vault"
            onClick={(e) => {
              e.preventDefault();
              setActiveFeaturePreview('vault');
            }}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Cloud Vault
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDemoQuickSignIn}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Launch Workspace
          </button>
        </div>
      </header>

      {/* Main 1440px Balanced Split Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        {/* Left Column: Architectural Overview & Interactive Mechanism Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
          <div>
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-3">
              Java 21 Spring Boot 3.4 Architecture · RS256 Session Security · SHA-256 Cloud Vault
            </p>
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white font-display leading-tight mb-4"
              style={{ textWrap: 'balance' }}
            >
              Unified executive command for tasks, habits, quantitative goals, and encrypted documents.
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mb-8">
              Built on a structured Java Spring Boot domain model with stateless JWT authentication, high-density tabular telemetry, and deterministic SHA-256 document verification.
            </p>

            {/* Interactive Module Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6 w-fit">
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
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              {activeFeaturePreview === 'tasks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        Interactive Task Tracking & Deep Work Timer
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        High-density priority queues · Subtask checklists · Integrated Pomodoro focus logger
                      </p>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-blue-600 dark:text-blue-400">
                      6 Active Tasks · 84% On-Time
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        Finalize Spring Boot 3.4 OAuth2 Resource Server & JWT Key Rotation
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                        High · 65/90m logged
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        Rebalance Q4 Tax-Advantaged Index Portfolio & Treasury Ladder
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                        High · Due Tomorrow
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        Study Java Virtual Threads (Project Loom) Structured Concurrency
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                        Medium · 40/75m logged
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeFeaturePreview === 'habits' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        14-Day Habit Consistency Spreadsheet Matrix
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Single-click daily check-in grid · Automated streak math · Category frequency targets
                      </p>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                      88.6% 14-Day Consistency
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Deep Architecture Focus (90m Uninterrupted)
                      </span>
                      <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        8 day streak · 13/14 days
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Technical Literature & Paper Reading (30 Pages)
                      </span>
                      <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        7 day streak · 12/14 days
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Strength & Zone 2 Cardiovascular Training
                      </span>
                      <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        3 day streak · 10/14 days
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeFeaturePreview === 'goals' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        Quantitative Goal Visualization & Milestone Roadmaps
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Radial progress rings · Milestone completion checkpoints · Target trajectory tracking
                      </p>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-blue-600 dark:text-blue-400">
                      4 Active Roadmaps
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Liquid Treasury & High-Yield Reserve Fund
                      </span>
                      <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        $42,500 / $50,000 USD (85.0%)
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Annual Half-Marathon & Aerobic Base Volume
                      </span>
                      <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        1,180 / 1,400 km (84.3%)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeFeaturePreview === 'vault' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        Cloud-Synced Document Storage & SHA-256 Integrity Vault
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Drag-and-drop file ingestion · Built-in Markdown editor · Cryptographic hash verification
                      </p>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                      AES-256 / SHA-256 Verified
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        2026-q4-treasury-allocation.md
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        Financial Records · v4 · Synced
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        plms-java21-architecture-rfc004.md
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        Career & Contracts · v7 · Synced
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Quantitative Architecture Metrics Strip */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Auth Protocol</span>
              </div>
              <p className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                JWT RS256 + BCrypt
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Backend Engine</span>
              </div>
              <p className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                Java 21 + Spring 3.4
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <FolderLock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Document Checksum</span>
              </div>
              <p className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                SHA-256 Digest
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication & Account Registration Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                  {mode === 'login' ? 'Sign in to Workspace' : 'Create PLMS Account'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {mode === 'login'
                    ? 'Authenticate to unlock your personal dashboards and document vault'
                    : 'Register a new encrypted profile in the Personal Life Management System'}
                </p>
              </div>
              <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
            </div>

            {/* Mode Switcher Segmented Control */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 leading-relaxed"
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label
                      htmlFor="auth-fullname"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="auth-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Marcus Sterling"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="auth-role"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Role / Title
                    </label>
                    <input
                      id="auth-role"
                      type="text"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="e.g. Principal Java Engineer"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Work or Personal Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Master Password
                  </label>
                  <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    Entropy: {pwdScore}/4
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter master password"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                {mode === 'login' ? 'Authenticate & Enter Workspace' : 'Register & Initialize Vault'}
              </button>
            </form>
          </div>

          {/* Demo Account Quick Access */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
              <span>Pre-populated Executive Workspace</span>
              <span className="font-mono tabular-nums">Elena Vance</span>
            </div>
            <button
              type="button"
              onClick={handleDemoQuickSignIn}
              className="w-full py-2.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Instant Sign-In with Demo Executive Profile</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
