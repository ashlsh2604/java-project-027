import { computeDeterministicHash, INITIAL_USER } from '../data/initialData';
import { SessionAuditEntry, UserAccount } from '../types/plms';

const LOCAL_USERS_KEY = 'plms_users_v1';
const SESSION_TOKEN_KEY = 'plms_session_token_v1';
const ACTIVE_USER_KEY = 'plms_active_user_v1';

export interface AuthResponse {
  user: UserAccount;
  token: string;
  auditEntry?: SessionAuditEntry;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleTitle: string;
  timezone: string;
}

function getLocalUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) return [INITIAL_USER];
    const parsed = JSON.parse(raw) as UserAccount[];
    return parsed.length > 0 ? parsed : [INITIAL_USER];
  } catch {
    return [INITIAL_USER];
  }
}

function saveLocalUsers(users: UserAccount[]): void {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

export function getStoredSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function setStoredSession(user: UserAccount | null, token: string | null): void {
  if (user && token) {
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACTIVE_USER_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

export async function checkBackendHealth(): Promise<{
  online: boolean;
  registeredUsersCount: number;
}> {
  try {
    const res = await fetch('/api/auth/health');
    if (!res.ok) throw new Error('Health check failed');
    const data = await res.json();
    return {
      online: true,
      registeredUsersCount: data.registeredUsersCount ?? getLocalUsers().length,
    };
  } catch {
    return {
      online: false,
      registeredUsersCount: getLocalUsers().length,
    };
  }
}

export async function loginWithBackend(
  email: string,
  password: string
): Promise<AuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed.');
    }

    // Keep local user cache synced
    const localUsers = getLocalUsers();
    const exists = localUsers.some((u) => u.email.toLowerCase() === normalizedEmail);
    const syncedUser: UserAccount = {
      ...data.user,
      passwordHash: computeDeterministicHash(password),
    };
    if (!exists) {
      saveLocalUsers([...localUsers, syncedUser]);
    }

    setStoredSession(data.user, data.token);
    return data as AuthResponse;
  } catch (err) {
    // If server returned an explicit 400/401 error message, rethrow it directly
    if (
      err instanceof Error &&
      (err.message.includes('Invalid password') ||
        err.message.includes('No account found') ||
        err.message.includes('required'))
    ) {
      throw err;
    }

    // Fallback to local synchronized database if network/server is unreachable
    const localUsers = getLocalUsers();
    const matched = localUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!matched) {
      throw new Error(
        'No account found with that email address. Please verify your email or go to Sign Up.'
      );
    }
    const hashed = computeDeterministicHash(password);
    if (matched.passwordHash !== hashed) {
      throw new Error('Invalid password for this account. Please try again.');
    }

    const updatedUser: UserAccount = {
      ...matched,
      lastLoginAt: new Date().toISOString(),
    };
    const token = `plms_local_jwt_${Date.now()}`;
    setStoredSession(updatedUser, token);
    return {
      user: updatedUser,
      token,
      auditEntry: {
        id: `aud-${Date.now().toString().slice(-4)}`,
        event: `Authenticated Session Started (${updatedUser.email})`,
        ipAddress: '192.0.2.44',
        device: 'Workstation Browser · JWT RS256',
        timestamp: new Date().toTimeString().slice(0, 8),
        status: 'Verified',
      },
    };
  }
}

export async function registerWithBackend(
  payload: RegisterPayload
): Promise<AuthResponse> {
  const normalizedEmail = payload.email.trim().toLowerCase();

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        email: normalizedEmail,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    // Sync local store
    const localUsers = getLocalUsers();
    const localEntry: UserAccount = {
      ...data.user,
      passwordHash: computeDeterministicHash(payload.password),
    };
    saveLocalUsers([
      ...localUsers.filter((u) => u.email.toLowerCase() !== normalizedEmail),
      localEntry,
    ]);

    setStoredSession(data.user, data.token);
    return data as AuthResponse;
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes('already registered') ||
        err.message.includes('Password') ||
        err.message.includes('valid email') ||
        err.message.includes('Full name'))
    ) {
      throw err;
    }

    // Fallback to local database persistence
    const localUsers = getLocalUsers();
    if (localUsers.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error(
        'An account with this email address is already registered in the database.'
      );
    }

    const nowIso = new Date().toISOString();
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      fullName: payload.fullName.trim(),
      email: normalizedEmail,
      roleTitle: payload.roleTitle.trim() || 'Executive Member',
      timezone: payload.timezone || 'UTC',
      passwordHash: computeDeterministicHash(payload.password),
      createdAt: nowIso,
      lastLoginAt: nowIso,
    };

    saveLocalUsers([...localUsers, newUser]);
    const token = `plms_local_jwt_${Date.now()}`;
    setStoredSession(newUser, token);

    return {
      user: newUser,
      token,
      auditEntry: {
        id: `aud-${Date.now().toString().slice(-4)}`,
        event: `Account Registered & Persisted (${newUser.email})`,
        ipAddress: '192.0.2.44',
        device: 'Workstation Browser · PBKDF2-SHA256',
        timestamp: new Date().toTimeString().slice(0, 8),
        status: 'Verified',
      },
    };
  }
}

export async function logoutFromBackend(): Promise<void> {
  const token = getStoredSessionToken();
  setStoredSession(null, null);
  if (!token) return;
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    });
  } catch {
    // Session already cleared locally
  }
}

export async function verifyStoredSession(): Promise<{
  user: UserAccount | null;
  auditLogs?: SessionAuditEntry[];
}> {
  const token = getStoredSessionToken();
  if (!token) return { user: null };

  try {
    const res = await fetch('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setStoredSession(null, null);
      return { user: null };
    }
    const data = await res.json();
    return {
      user: data.user,
      auditLogs: data.auditLogs,
    };
  } catch {
    try {
      const raw = localStorage.getItem(ACTIVE_USER_KEY);
      return { user: raw ? (JSON.parse(raw) as UserAccount) : null };
    } catch {
      return { user: null };
    }
  }
}

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (India · IST, UTC+05:30)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (US Pacific · PT)' },
  { value: 'America/New_York', label: 'America/New_York (US Eastern · ET)' },
  { value: 'Europe/London', label: 'Europe/London (UK · GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (Central Europe · CET)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (Singapore · SGT)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Japan · JST)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

export async function updateUserTimezone(
  user: UserAccount,
  newTimezone: string
): Promise<UserAccount> {
  const updatedLocal: UserAccount = {
    ...user,
    timezone: newTimezone,
  };

  // Update local storage caches immediately
  const token = getStoredSessionToken();
  if (token) {
    setStoredSession(updatedLocal, token);
  }
  const localUsers = getLocalUsers().map((u) =>
    u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
      ? { ...u, timezone: newTimezone }
      : u
  );
  saveLocalUsers(localUsers);

  try {
    const res = await fetch('/api/auth/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        timezone: newTimezone,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user && token) {
        setStoredSession(data.user, token);
      }
      return data.user as UserAccount;
    }
  } catch {
    // Fallback to updatedLocal
  }

  return updatedLocal;
}

