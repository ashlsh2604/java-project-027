import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Clock,
  Globe,
  LogIn,
  LogOut,
  Moon,
  Settings,
  Sun,
  UserPlus,
  X,
} from 'lucide-react';
import { TIMEZONE_OPTIONS } from '../services/authService';
import { UserAccount } from '../types/plms';

interface SettingsMenuProps {
  currentUser: UserAccount | null;
  selectedTimezone: string;
  onTimezoneChange: (newTimezone: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSignOut?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToSignUp?: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  currentUser,
  selectedTimezone,
  onTimezoneChange,
  darkMode,
  onToggleDarkMode,
  onSignOut,
  onNavigateToLogin,
  onNavigateToSignUp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [formattedClock, setFormattedClock] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateClock = () => {
      try {
        const cleanTz = selectedTimezone.split(' ')[0] || 'Asia/Kolkata';
        const now = new Date();
        const str = new Intl.DateTimeFormat('en-US', {
          timeZone: cleanTz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(now);
        setFormattedClock(str);
      } catch {
        setFormattedClock(new Date().toLocaleTimeString());
      }
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [selectedTimezone]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectTimezone = (tz: string) => {
    onTimezoneChange(tz);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open Settings Menu"
        title="Settings (Account, Sign In/Out & Timezone)"
        className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0 ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Settings</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-5 space-y-5 text-left">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                System & Account Settings
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Manage authentication, session state, and timezone
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Settings"
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Timezone Settings Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Timezone Configuration</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formattedClock}</span>
              </span>
            </div>

            <select
              aria-label="Select Timezone"
              value={
                TIMEZONE_OPTIONS.some((o) => o.value === selectedTimezone)
                  ? selectedTimezone
                  : 'Asia/Kolkata'
              }
              onChange={(e) => handleSelectTimezone(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>

            {savedNotice && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Timezone saved and synced to database</span>
              </div>
            )}
          </div>

          {/* 2. Theme Appearance Toggle */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Workspace Theme
            </span>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Switch to Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Switch to Dark</span>
                </>
              )}
            </button>
          </div>

          {/* 3. Sign In / Sign Up / Sign Out Section */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Account & Session Controls
            </div>

            {currentUser ? (
              <div className="space-y-3">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {currentUser.email}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {currentUser.roleTitle} · {currentUser.timezone}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {onNavigateToSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigateToSignUp();
                      }}
                      className="py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Sign Up New</span>
                    </button>
                  )}

                  {onSignOut && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onSignOut();
                      }}
                      className="py-2 px-3 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap col-span-full"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out of Account</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {onNavigateToLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onNavigateToLogin();
                    }}
                    className="py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In Page</span>
                  </button>
                )}

                {onNavigateToSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onNavigateToSignUp();
                    }}
                    className="py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up Page</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
