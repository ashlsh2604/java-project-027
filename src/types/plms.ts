export enum TaskPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum TaskStatus {
  TODO = 'Todo',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export enum LifeCategory {
  WORK = 'Work & Engineering',
  PERSONAL = 'Personal & Family',
  HEALTH = 'Health & Athletics',
  FINANCE = 'Finance & Wealth',
  LEARNING = 'Research & Learning',
}

export interface SubtaskItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: LifeCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  estimatedMinutes: number;
  loggedMinutes: number;
  subtasks: SubtaskItem[];
  createdAt: string;
}

export interface HabitItem {
  id: string;
  name: string;
  category: LifeCategory;
  targetDaysPerWeek: number;
  unitLabel: string;
  completedDates: string[]; // Array of YYYY-MM-DD strings
  notes: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
}

export interface GoalItem {
  id: string;
  title: string;
  category: LifeCategory;
  horizon: 'Q4 2026' | 'Annual 2026' | 'Long-Term';
  currentValue: number;
  targetValue: number;
  unit: string;
  deadline: string;
  milestones: GoalMilestone[];
  notes: string;
}

export type DocumentFolder =
  | 'Financial Records'
  | 'Career & Contracts'
  | 'Health & Medical'
  | 'Personal Notes'
  | 'Identity & Legal';

export interface CloudDocument {
  id: string;
  title: string;
  fileName: string;
  folder: DocumentFolder;
  mimeType: string;
  sizeBytes: number;
  content: string;
  sha256Checksum: string;
  version: number;
  starred: boolean;
  updatedAt: string;
  syncState: 'Synced' | 'Syncing' | 'Local Draft';
}

export interface UserAccount {
  id: string;
  username?: string;
  fullName: string;
  email: string;
  roleTitle: string;
  timezone: string;
  passwordHash?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface SessionAuditEntry {
  id: string;
  event: string;
  ipAddress: string;
  device: string;
  timestamp: string;
  status: 'Verified' | 'Warning';
}

export interface JavaSourceFile {
  id: string;
  fileName: string;
  packagePath: string;
  language: 'java' | 'xml' | 'sql' | 'properties';
  description: string;
  code: string;
}
