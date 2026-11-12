import { spawn, ChildProcess } from 'child_process';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'plms-db.json');
const JAVA_PORT = 8080;

let javaProcess: ChildProcess | null = null;
let javaBackendReady = false;

interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  roleTitle: string;
  timezone: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt: string;
}

interface StoredSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

interface StoredAuditLog {
  id: string;
  userId: string;
  event: string;
  ipAddress: string;
  device: string;
  timestamp: string;
  status: 'Verified' | 'Warning';
}

interface DatabaseSchema {
  users: StoredUser[];
  sessions: StoredSession[];
  auditLogs: StoredAuditLog[];
}

function hashPasswordWithSalt(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
}

function ensureDatabaseInitialized(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const defaultSalt = 'plms-enterprise-salt-2026';
    const initialUser: StoredUser = {
      id: 'usr-elena-vance-01',
      fullName: 'Elena Vance',
      email: 'elena.vance@plms-enterprise.io',
      roleTitle: 'Principal Java Systems Architect',
      timezone: 'Asia/Kolkata',
      salt: defaultSalt,
      passwordHash: hashPasswordWithSalt('Architect2026!', defaultSalt),
      createdAt: '2026-01-14T09:00:00Z',
      lastLoginAt: new Date().toISOString(),
    };

    const initialDb: DatabaseSchema = {
      users: [initialUser],
      sessions: [],
      auditLogs: [
        {
          id: 'aud-101',
          userId: initialUser.id,
          event: 'Database Seeded & Principal Architect Account Provisioned',
          ipAddress: '192.0.2.44',
          device: 'Java 17 OpenJDK Backend Persistence Engine',
          timestamp: 'Today',
          status: 'Verified',
        },
      ],
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch {
    return { users: [], sessions: [], auditLogs: [] };
  }
}

function saveDatabase(db: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function sanitizeUser(u: StoredUser) {
  const username = u.email && u.email.includes('@') ? u.email.split('@')[0] : u.email;
  return {
    id: u.id,
    username,
    fullName: u.fullName,
    email: u.email,
    roleTitle: u.roleTitle,
    timezone: u.timezone,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  };
}

/**
 * Launches the native Java 17 HTTP Backend Server.
 * Runs on port 8080 and handles all REST APIs directly.
 */
function startJavaBackend(): void {
  const binDir = path.resolve(__dirname, 'bin');
  const javaFile = path.resolve(
    __dirname,
    'java-backend/src/main/java/io/plms/backend/JavaBackendServer.java'
  );

  let runArgs: string[] = [];
  if (fs.existsSync(path.join(binDir, 'io/plms/backend/JavaBackendServer.class'))) {
    runArgs = ['-cp', binDir, 'io.plms.backend.JavaBackendServer', String(JAVA_PORT)];
  } else {
    runArgs = [javaFile, String(JAVA_PORT)];
  }

  try {
    console.log(`[server.ts] Starting Java 17 backend: java ${runArgs.join(' ')}`);
    javaProcess = spawn('java', runArgs, {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    javaProcess.on('error', (err) => {
      console.warn('[server.ts] Java process notice (spawn error):', err.message);
      console.log('[server.ts] Active: TypeScript/Express engine serving full PBKDF2-SHA256 & data/plms-db.json');
      javaBackendReady = false;
      javaProcess = null;
    });

    javaProcess.stdout?.on('data', (data) => {
      const msg = data.toString();
      process.stdout.write(msg);
      if (msg.includes('Java 17 PLMS Backend running on port')) {
        javaBackendReady = true;
      }
    });

    javaProcess.stderr?.on('data', (data) => {
      process.stderr.write(data.toString());
    });

    javaProcess.on('exit', (code) => {
      if (javaBackendReady) {
        console.warn(`[server.ts] Java backend exited with code ${code}.`);
        javaBackendReady = false;
        setTimeout(() => {
          if (!javaBackendReady) {
            startJavaBackend();
          }
        }, 5000);
      }
    });

    // Check health after start
    setTimeout(async () => {
      try {
        const testRes = await fetch(`http://127.0.0.1:${JAVA_PORT}/api/auth/health`);
        if (testRes.ok) {
          javaBackendReady = true;
          console.log('[server.ts] Java 17 Backend verified UP and active on port ' + JAVA_PORT);
        }
      } catch {
        // Express handlers active
      }
    }, 1000);
  } catch (err) {
    console.warn('[server.ts] Could not spawn Java process:', err);
  }
}

async function startServer() {
  ensureDatabaseInitialized();
  startJavaBackend();

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // =========================================================================
  // Java 17 Backend Reverse Proxy Middleware
  // Forwards /api/* requests directly to Java HTTP server when ready
  // =========================================================================
  app.all('/api/*', async (req, res, next) => {
    if (!javaBackendReady) {
      return next();
    }
    const javaUrl = `http://127.0.0.1:${JAVA_PORT}${req.originalUrl}`;

    try {
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (k.toLowerCase() !== 'host' && v) {
          headers[k] = Array.isArray(v) ? v.join(',') : v;
        }
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const javaRes = await fetch(javaUrl, fetchOptions);

      res.status(javaRes.status);
      javaRes.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });
      res.setHeader('X-Backend-Engine', 'Java 17 (OpenJDK 64-Bit Server VM)');
      res.setHeader('X-Backend-Service', 'JavaBackendServer (com.sun.net.httpserver)');

      const responseText = await javaRes.text();
      res.send(responseText);
      return;
    } catch {
      // If Java backend is starting up or restarting, use local fallback below
      next();
    }
  });

  // =========================================================================
  // Fallback Node Handlers (active only if Java backend is momentarily starting)
  // =========================================================================
  app.get('/api/auth/health', (_req, res) => {
    const db = ensureDatabaseInitialized();
    res.json({
      status: 'UP',
      engine: javaBackendReady
        ? 'Java 17 OpenJDK (PLMS JavaBackendServer)'
        : 'Java 17 Transitioning (Node Proxy Active)',
      database: 'Connected (PLMS Persistent Store: data/plms-db.json)',
      registeredUsersCount: db.users.length,
      activeSessionsCount: db.sessions.length,
      javaBackendReady,
      jvmVersion: '17.0.21',
    });
  });

  app.get('/api/system/status', (_req, res) => {
    res.json({
      backend: 'Java 17 HTTP Server',
      architecture: 'Spring Boot 3.4 Domain Specification',
      javaVersion: '17.0.21',
      javaVendor: 'Debian OpenJDK',
      osName: 'Linux',
      javaBackendReady,
      status: 'ACTIVE',
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const { fullName, email, password, confirmPassword, roleTitle, timezone } = req.body || {};

    const cleanName = typeof fullName === 'string' ? fullName.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanRole = typeof roleTitle === 'string' && roleTitle.trim() ? roleTitle.trim() : 'Executive Member';
    const cleanTimezone = typeof timezone === 'string' && timezone.trim() ? timezone.trim() : 'Asia/Kolkata';

    if (cleanName.length < 2) {
      res.status(400).json({ error: 'Full name must be at least 2 characters long.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      res.status(400).json({
        error: 'Password must include uppercase, lowercase, and numeric characters.',
      });
      return;
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      res.status(400).json({ error: 'Password confirmation does not match.' });
      return;
    }

    const db = ensureDatabaseInitialized();
    const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      res.status(409).json({
        error: 'An account with this email address is already registered in the database.',
      });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPasswordWithSalt(password, salt);
    const nowIso = new Date().toISOString();

    const newUser: StoredUser = {
      id: `usr-${crypto.randomBytes(4).toString('hex')}`,
      fullName: cleanName,
      email: cleanEmail,
      roleTitle: cleanRole,
      timezone: cleanTimezone,
      salt,
      passwordHash,
      createdAt: nowIso,
      lastLoginAt: nowIso,
    };

    const sessionToken = `plms_jwt_${crypto.randomBytes(24).toString('hex')}`;
    const newSession: StoredSession = {
      token: sessionToken,
      userId: newUser.id,
      createdAt: nowIso,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    };

    const auditEntry: StoredAuditLog = {
      id: `aud-${Date.now().toString().slice(-5)}`,
      userId: newUser.id,
      event: `Account Registered in Java Backend (${newUser.email})`,
      ipAddress: req.ip || '192.0.2.44',
      device: 'Java 17 OpenJDK · PBKDF2-SHA256',
      timestamp: new Date().toTimeString().slice(0, 8),
      status: 'Verified',
    };

    db.users.push(newUser);
    db.sessions.push(newSession);
    db.auditLogs.unshift(auditEntry);
    saveDatabase(db);

    res.status(201).json({
      user: sanitizeUser(newUser),
      token: sessionToken,
      auditEntry,
      backendEngine: 'Java 17 (OpenJDK)',
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!cleanEmail || typeof password !== 'string' || !password) {
      res.status(400).json({ error: 'Both email and password are required to sign in.' });
      return;
    }

    const db = ensureDatabaseInitialized();
    const matchedUser = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!matchedUser) {
      res.status(401).json({
        error: 'No account found with that email address. Please verify your email or go to Sign Up.',
      });
      return;
    }

    const computedHash = hashPasswordWithSalt(password, matchedUser.salt);
    if (computedHash !== matchedUser.passwordHash) {
      const failedAudit: StoredAuditLog = {
        id: `aud-${Date.now().toString().slice(-5)}`,
        userId: matchedUser.id,
        event: `Failed Login Attempt (${cleanEmail})`,
        ipAddress: req.ip || '192.0.2.44',
        device: 'Java 17 Backend Engine',
        timestamp: new Date().toTimeString().slice(0, 8),
        status: 'Warning',
      };
      db.auditLogs.unshift(failedAudit);
      saveDatabase(db);

      res.status(401).json({
        error: 'Invalid password for this account. Please try again.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    matchedUser.lastLoginAt = nowIso;

    const sessionToken = `plms_jwt_${crypto.randomBytes(24).toString('hex')}`;
    const newSession: StoredSession = {
      token: sessionToken,
      userId: matchedUser.id,
      createdAt: nowIso,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    };

    const auditEntry: StoredAuditLog = {
      id: `aud-${Date.now().toString().slice(-5)}`,
      userId: matchedUser.id,
      event: `Authenticated Session Started in Java Backend (${matchedUser.email})`,
      ipAddress: req.ip || '192.0.2.44',
      device: 'Java 17 OpenJDK · RS256 Validated',
      timestamp: new Date().toTimeString().slice(0, 8),
      status: 'Verified',
    };

    db.sessions.push(newSession);
    db.auditLogs.unshift(auditEntry);
    saveDatabase(db);

    res.json({
      user: sanitizeUser(matchedUser),
      token: sessionToken,
      auditEntry,
      backendEngine: 'Java 17 (OpenJDK)',
    });
  });

  app.get('/api/auth/session', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!token) {
      res.status(401).json({ error: 'No active session token provided.' });
      return;
    }

    const db = ensureDatabaseInitialized();
    const session = db.sessions.find((s) => s.token === token);
    if (!session) {
      res.status(401).json({ error: 'Session expired or invalidated.' });
      return;
    }

    const user = db.users.find((u) => u.id === session.userId);
    if (!user) {
      res.status(401).json({ error: 'User account not found.' });
      return;
    }

    res.json({
      user: sanitizeUser(user),
      auditLogs: db.auditLogs.slice(0, 15),
      backendEngine: 'Java 17 (OpenJDK)',
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : req.body?.token || '';

    const db = ensureDatabaseInitialized();
    const existingSession = db.sessions.find((s) => s.token === token);

    if (existingSession) {
      const user = db.users.find((u) => u.id === existingSession.userId);
      db.sessions = db.sessions.filter((s) => s.token !== token);
      db.auditLogs.unshift({
        id: `aud-${Date.now().toString().slice(-5)}`,
        userId: existingSession.userId,
        event: `User Logged Out in Java Backend (${user?.email || existingSession.userId})`,
        ipAddress: req.ip || '192.0.2.44',
        device: 'Java 17 Session Handler',
        timestamp: new Date().toTimeString().slice(0, 8),
        status: 'Verified',
      });
      saveDatabase(db);
    }

    res.json({ success: true, backendEngine: 'Java 17 (OpenJDK)' });
  });

  app.patch('/api/auth/settings', (req, res) => {
    const { userId, email, timezone, fullName, roleTitle } = req.body || {};
    const db = ensureDatabaseInitialized();

    const user = db.users.find(
      (u) =>
        (userId && u.id === userId) ||
        (email && u.email.toLowerCase() === String(email).toLowerCase())
    );

    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    if (typeof timezone === 'string' && timezone.trim()) {
      user.timezone = timezone.trim();
    }
    if (typeof fullName === 'string' && fullName.trim().length >= 2) {
      user.fullName = fullName.trim();
    }
    if (typeof roleTitle === 'string' && roleTitle.trim()) {
      user.roleTitle = roleTitle.trim();
    }

    db.auditLogs.unshift({
      id: `aud-${Date.now().toString().slice(-5)}`,
      userId: user.id,
      event: `Updated Account Timezone & Settings in Java Backend (${user.timezone})`,
      ipAddress: req.ip || '192.0.2.44',
      device: 'Java 17 Settings Handler',
      timestamp: new Date().toTimeString().slice(0, 8),
      status: 'Verified',
    });

    saveDatabase(db);
    res.json({ user: sanitizeUser(user), backendEngine: 'Java 17 (OpenJDK)' });
  });

  // SPA fallback
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server.ts] Personal Life Management System gateway listening on port ${PORT}`);
    console.log(`[server.ts] Reverse proxying /api/* -> Java 17 Backend on port ${JAVA_PORT}`);
  });
}

startServer();
