import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Database,
  Eye,
  EyeOff,
  Globe,
  UserPlus,
} from 'lucide-react';
import { SettingsMenu } from '../components/SettingsMenu';
import { registerWithBackend } from '../services/authService';
import { SessionAuditEntry, UserAccount } from '../types/plms';

interface SignUpPageProps {
  onSignUpSuccess: (
    user: UserAccount,
    token: string,
    auditEntry?: SessionAuditEntry
  ) => void;
  onNavigateToLogin: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  selectedTimezone: string;
  onTimezoneChange: (tz: string) => void;
}

interface SignUpFieldErrors {
  fullName?: string;
  email?: string;
  roleTitle?: string;
  password?: string;
  confirmPassword?: string;
  acceptedTerms?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onSignUpSuccess,
  onNavigateToLogin,
  darkMode,
  onToggleDarkMode,
  selectedTimezone,
  onTimezoneChange,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [roleTitle, setRoleTitle] = useState('Senior Software Architect');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password policy checks
  const hasMinLength = password.length >= 8;
  const hasMixedCase = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const validateAllFields = (): SignUpFieldErrors => {
    const errors: SignUpFieldErrors = {};
    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanRole = roleTitle.trim();

    if (!cleanName) {
      errors.fullName = 'Full name is required.';
    } else if (cleanName.length < 2) {
      errors.fullName = 'Full name must be at least 2 characters long.';
    }

    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      errors.email = 'Enter a valid email address (e.g. alex.chen@domain.com).';
    }

    if (!cleanRole || cleanRole.length < 2) {
      errors.roleTitle = 'Please specify your professional role or title.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (!hasMinLength || !hasMixedCase || !hasNumber) {
      errors.password =
        'Password must be at least 8 characters and include uppercase, lowercase, and a number.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!acceptedTerms) {
      errors.acceptedTerms = 'Please acknowledge the vault encryption terms to continue.';
    }

    return errors;
  };

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setFieldErrors(validateAllFields());
    }
  }, [fullName, email, roleTitle, password, confirmPassword, acceptedTerms, touched]);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setTouched({
      fullName: true,
      email: true,
      roleTitle: true,
      password: true,
      confirmPassword: true,
      acceptedTerms: true,
    });

    const errors = validateAllFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await registerWithBackend({
        fullName,
        email,
        password,
        confirmPassword,
        roleTitle,
        timezone: selectedTimezone,
      });
      onSignUpSuccess(response.user, response.token, response.auditEntry);
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : 'Registration failed. Please verify your details and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Bar Contract: Zone 1 Brand | Zone 2 4 Nav Links | Zone 3 Settings Action */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <a
          href="/signup"
          onClick={(e) => {
            e.preventDefault();
          }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 font-display"
        >
          Personal Life Management System
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToLogin();
            }}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Task Dashboards
          </a>
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToLogin();
            }}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Habit Matrix
          </a>
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToLogin();
            }}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Cloud Vault
          </a>
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToLogin();
            }}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Log In
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <SettingsMenu
            currentUser={null}
            selectedTimezone={selectedTimezone}
            onTimezoneChange={onTimezoneChange}
            darkMode={darkMode}
            onToggleDarkMode={onToggleDarkMode}
            onNavigateToLogin={onNavigateToLogin}
            onNavigateToSignUp={() => {}}
          />
        </div>
      </header>

      {/* Main Layout: Sign Up Form Placed First at the Top (order-1) so it is never pushed down */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sign Up Form Card Placed First in DOM (order-1) */}
        <div className="lg:col-span-7 order-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs font-mono text-blue-600 dark:text-blue-400 mb-0.5">
                  /signup · Account Provisioning
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                  Create Your PLMS Account
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Register your profile in the database · Active Timezone:{' '}
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {selectedTimezone}
                  </span>{' '}
                  (Changeable via Settings icon)
                </p>
              </div>
              <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
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

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Row 1: Full Name & Email Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="signup-fullname"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="signup-fullname"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onBlur={() => markTouched('fullName')}
                    onChange={(e) => setFullName(e.target.value)}
                    aria-invalid={Boolean(touched.fullName && fieldErrors.fullName)}
                    placeholder="e.g. Marcus Sterling"
                    className={`w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                      touched.fullName && fieldErrors.fullName
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-blue-600'
                    }`}
                  />
                  {touched.fullName && fieldErrors.fullName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.fullName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onBlur={() => markTouched('email')}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(touched.email && fieldErrors.email)}
                    placeholder="marcus.sterling@domain.com"
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
              </div>

              {/* Row 2: Role / Title */}
              <div>
                <label
                  htmlFor="signup-role"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Role / Professional Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="signup-role"
                  type="text"
                  value={roleTitle}
                  onBlur={() => markTouched('roleTitle')}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  aria-invalid={Boolean(touched.roleTitle && fieldErrors.roleTitle)}
                  placeholder="e.g. Principal Java Engineer"
                  className={`w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    touched.roleTitle && fieldErrors.roleTitle
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-blue-600'
                  }`}
                />
                {touched.roleTitle && fieldErrors.roleTitle && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.roleTitle}</span>
                  </p>
                )}
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Master Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onBlur={() => markTouched('password')}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={Boolean(touched.password && fieldErrors.password)}
                      placeholder="Create strong password"
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

                <div>
                  <label
                    htmlFor="signup-confirm-password"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onBlur={() => markTouched('confirmPassword')}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      aria-invalid={Boolean(
                        touched.confirmPassword && fieldErrors.confirmPassword
                      )}
                      placeholder="Re-enter password"
                      className={`w-full pl-3.5 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                        touched.confirmPassword && fieldErrors.confirmPassword
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-blue-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={
                        showConfirmPassword
                          ? 'Hide confirm password'
                          : 'Show confirm password'
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {touched.confirmPassword && fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.confirmPassword}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Live Password Validation Rules Grid */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Password Validation Checklist
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                  <div
                    className={`flex items-center gap-1.5 ${
                      hasMinLength
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Minimum 8 characters</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      hasMixedCase
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Uppercase & lowercase letters (A-z)</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      hasNumber
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>At least one number (0-9)</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordsMatch
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : hasSpecial
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {passwordsMatch
                        ? 'Confirmation password matches'
                        : 'Confirm password must match'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms & Encryption Checkbox */}
              <div>
                <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      markTouched('acceptedTerms');
                      setAcceptedTerms(e.target.checked);
                    }}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span>
                    I understand my account credentials and SHA-256 document digests will be persisted in the Personal Life Management System database.
                  </span>
                </label>
                {touched.acceptedTerms && fieldErrors.acceptedTerms && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.acceptedTerms}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                {isSubmitting
                  ? 'Registering Account in Database...'
                  : 'Complete Sign Up & Launch Workspace'}
              </button>
            </form>
          </div>

          {/* Dedicated Login Page Navigation Footer */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Already have a registered account?
            </span>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go to Login Page</span>
            </button>
          </div>
        </div>

        {/* Account Provisioning & Security Architecture Details (5 cols, order-2) */}
        <div className="lg:col-span-5 order-2 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7">
          <div>
            <h2
              className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display leading-tight mb-3"
              style={{ textWrap: 'balance' }}
            >
              Initialize your personal command workspace and encrypted vault.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Every registered profile in the Personal Life Management System is persisted in the backend database with salted PBKDF2-SHA256 password hashing. Click the Settings icon in the top-right bar anytime to adjust your timezone (including India · IST) or switch between Sign In and Sign Up.
            </p>

            {/* What gets provisioned list */}
            <div className="space-y-3.5 pt-5 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  01. Salted Cryptographic Credentials
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Passwords undergo 10,000-iteration PBKDF2-SHA256 derivation before database persistence.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  02. Interactive Task & Pomodoro Telemetry
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  High-density priority task tables, stage boards, subtask verification steps, and real-time focus timers.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  03. 14-Day Habit Matrix & Goal Roadmaps
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Track daily protocol consistency across a 14-day rolling window and visualize quantitative goal milestones.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  04. SHA-256 Cloud Document Vault
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Upload files or compose Markdown records with automatic SHA-256 checksum calculation and version control.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
              <Database className="w-3.5 h-3.5" />
              <span>POST /api/auth/register Ready</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono">
              <Globe className="w-3.5 h-3.5" />
              <span>{selectedTimezone.split(' ')[0]}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
