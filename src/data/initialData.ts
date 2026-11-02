import {
  CloudDocument,
  GoalItem,
  HabitItem,
  JavaSourceFile,
  LifeCategory,
  SessionAuditEntry,
  TaskItem,
  TaskPriority,
  TaskStatus,
  UserAccount,
} from '../types/plms';

/**
 * Generates an array of the last N days (ending today) in YYYY-MM-DD format.
 */
export function getPastDateStrings(daysCount: number): string[] {
  const result: string[] = [];
  const base = new Date();
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    result.push(`${yyyy}-${mm}-${dd}`);
  }
  return result;
}

export function getOffsetDateString(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function computeDeterministicHash(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0, ch; i < input.length; i++) {
    ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${hex1}${hex2}${hex1.split('').reverse().join('')}${hex2.split('').reverse().join('')}`;
}

const past14 = getPastDateStrings(14);

export const INITIAL_USER: UserAccount = {
  id: 'usr-elena-vance-01',
  fullName: 'Elena Vance',
  email: 'elena.vance@plms-enterprise.io',
  roleTitle: 'Principal Java Systems Architect',
  timezone: 'America/Los_Angeles (UTC-08:00)',
  passwordHash: computeDeterministicHash('Architect2026!'),
  createdAt: '2026-01-14T09:00:00Z',
  lastLoginAt: new Date().toISOString(),
};

export const INITIAL_AUDIT_LOGS: SessionAuditEntry[] = [
  {
    id: 'aud-101',
    event: 'Spring Security JWT Bearer Token Issued (RS256)',
    ipAddress: '192.0.2.44',
    device: 'macOS Sequoia · Workstation Chrome',
    timestamp: 'Just now',
    status: 'Verified',
  },
  {
    id: 'aud-102',
    event: 'Cloud Vault AES-256 Snapshot Synchronized',
    ipAddress: '192.0.2.44',
    device: 'macOS Sequoia · Workstation Chrome',
    timestamp: '18 mins ago',
    status: 'Verified',
  },
  {
    id: 'aud-103',
    event: 'Automated Daily Habit Ledger Checkpoint',
    ipAddress: '192.0.2.44',
    device: 'PLMS Scheduled Daemon',
    timestamp: 'Today, 06:00',
    status: 'Verified',
  },
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'TSK-1042',
    title: 'Finalize Spring Boot 3.4 OAuth2 Resource Server & JWT Key Rotation',
    description: 'Audit RSA keypair rotation schedule and verify stateless session filter chain for the PLMS API gateway.',
    category: LifeCategory.WORK,
    priority: TaskPriority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    dueDate: getOffsetDateString(0),
    estimatedMinutes: 90,
    loggedMinutes: 65,
    createdAt: getOffsetDateString(-3),
    subtasks: [
      { id: 'sub-1', title: 'Configure NimbusJwtDecoder with JWK Set URI', completed: true },
      { id: 'sub-2', title: 'Write integration tests for /api/v1/tasks endpoint', completed: true },
      { id: 'sub-3', title: 'Benchmark HikariCP connection pool under load', completed: false },
    ],
  },
  {
    id: 'TSK-1043',
    title: 'Rebalance Q4 Tax-Advantaged Index Portfolio & Treasury Ladder',
    description: 'Review allocation drift across S&P 500 core index, international equities, and 6-month T-Bill maturity dates.',
    category: LifeCategory.FINANCE,
    priority: TaskPriority.HIGH,
    status: TaskStatus.TODO,
    dueDate: getOffsetDateString(1),
    estimatedMinutes: 60,
    loggedMinutes: 15,
    createdAt: getOffsetDateString(-2),
    subtasks: [
      { id: 'sub-4', title: 'Export Q3 brokerage dividend ledger CSV', completed: true },
      { id: 'sub-5', title: 'Execute limit orders to restore 75/25 target weight', completed: false },
    ],
  },
  {
    id: 'TSK-1044',
    title: 'Zone 2 Aerobic Threshold Run (10 km Easy Pace)',
    description: 'Maintain heart rate strictly between 138–146 BPM along the waterfront trail; log cadence and splits.',
    category: LifeCategory.HEALTH,
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    dueDate: getOffsetDateString(0),
    estimatedMinutes: 55,
    loggedMinutes: 54,
    createdAt: getOffsetDateString(-1),
    subtasks: [
      { id: 'sub-6', title: '10-minute dynamic mobility warm-up', completed: true },
      { id: 'sub-7', title: '10 km continuous aerobic run', completed: true },
    ],
  },
  {
    id: 'TSK-1045',
    title: 'Study Java Virtual Threads (Project Loom) Structured Concurrency',
    description: 'Complete Chapter 6 exercises on StructuredTaskScope and benchmark throughput against reactive WebFlux pipelines.',
    category: LifeCategory.LEARNING,
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.IN_PROGRESS,
    dueDate: getOffsetDateString(2),
    estimatedMinutes: 75,
    loggedMinutes: 40,
    createdAt: getOffsetDateString(-4),
    subtasks: [
      { id: 'sub-8', title: 'Implement ShutdownOnFailure task scope prototype', completed: true },
      { id: 'sub-9', title: 'Document thread pinning edge cases with synchronized blocks', completed: false },
    ],
  },
  {
    id: 'TSK-1046',
    title: 'Renew Annual Home Umbrella & Property Insurance Policy',
    description: 'Compare updated replacement-cost riders and upload signed policy declaration to Cloud Document Vault.',
    category: LifeCategory.PERSONAL,
    priority: TaskPriority.LOW,
    status: TaskStatus.TODO,
    dueDate: getOffsetDateString(4),
    estimatedMinutes: 45,
    loggedMinutes: 0,
    createdAt: getOffsetDateString(-2),
    subtasks: [
      { id: 'sub-10', title: 'Verify deductible alignment with auto policy', completed: false },
      { id: 'sub-11', title: 'Archive signed PDF policy in Identity & Legal folder', completed: false },
    ],
  },
  {
    id: 'TSK-1047',
    title: 'Complete Annual Comprehensive Blood Panel & Lipid Review',
    description: 'Fasting morning lab draw (ApoB, HbA1c, Vitamin D, hs-CRP) and upload lab report to Health folder.',
    category: LifeCategory.HEALTH,
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    dueDate: getOffsetDateString(-1),
    estimatedMinutes: 45,
    loggedMinutes: 45,
    createdAt: getOffsetDateString(-5),
    subtasks: [
      { id: 'sub-12', title: '12-hour overnight fast prior to appointment', completed: true },
      { id: 'sub-13', title: 'Record biomarker values into annual health log', completed: true },
    ],
  },
];

export const INITIAL_HABITS: HabitItem[] = [
  {
    id: 'HAB-01',
    name: 'Deep Architecture Focus (90m Uninterrupted)',
    category: LifeCategory.WORK,
    targetDaysPerWeek: 6,
    unitLabel: '90 min block',
    completedDates: [
      past14[0], past14[1], past14[2], past14[3], past14[4],
      past14[6], past14[7], past14[8], past14[9], past14[10],
      past14[11], past14[12], past14[13],
    ],
    notes: 'Zero notifications before 10:30 AM.',
  },
  {
    id: 'HAB-02',
    name: 'Strength & Zone 2 Cardiovascular Training',
    category: LifeCategory.HEALTH,
    targetDaysPerWeek: 5,
    unitLabel: '45+ min session',
    completedDates: [
      past14[0], past14[1], past14[3], past14[4], past14[6],
      past14[8], past14[9], past14[11], past14[12], past14[13],
    ],
    notes: 'Alternate upper/lower resistance with aerobic endurance.',
  },
  {
    id: 'HAB-03',
    name: 'Technical Literature & Paper Reading (30 Pages)',
    category: LifeCategory.LEARNING,
    targetDaysPerWeek: 7,
    unitLabel: '30 pages',
    completedDates: [
      past14[1], past14[2], past14[3], past14[4], past14[5],
      past14[7], past14[8], past14[9], past14[10], past14[11],
      past14[12], past14[13],
    ],
    notes: 'Currently reading Designing Data-Intensive Applications & Java Concurrency.',
  },
  {
    id: 'HAB-04',
    name: 'Zero-Screen Wind Down & Hydration Target (3.0L)',
    category: LifeCategory.HEALTH,
    targetDaysPerWeek: 7,
    unitLabel: '3.0 Liters',
    completedDates: [
      past14[0], past14[2], past14[3], past14[5], past14[6],
      past14[7], past14[9], past14[10], past14[11], past14[12],
      past14[13],
    ],
    notes: 'No backlit screens 60 minutes prior to sleep.',
  },
  {
    id: 'HAB-05',
    name: 'Daily Expense Ledger & Cashflow Reconciliation',
    category: LifeCategory.FINANCE,
    targetDaysPerWeek: 5,
    unitLabel: 'Daily audit',
    completedDates: [
      past14[0], past14[2], past14[4], past14[6], past14[8],
      past14[10], past14[11], past14[12], past14[13],
    ],
    notes: 'Categorize all transactions and verify zero unrecognized charges.',
  },
];

export const INITIAL_GOALS: GoalItem[] = [
  {
    id: 'GOL-201',
    title: 'Liquid Treasury & High-Yield Reserve Fund',
    category: LifeCategory.FINANCE,
    horizon: 'Annual 2026',
    currentValue: 42500,
    targetValue: 50000,
    unit: 'USD',
    deadline: '2026-12-31',
    notes: 'Allocated across 4-week and 13-week US Treasury Bills at 4.85% yield.',
    milestones: [
      { id: 'ms-1', title: 'Reach $25,000 baseline emergency reserve', targetDate: '2026-04-30', completed: true },
      { id: 'ms-2', title: 'Complete $37,500 3-rung T-Bill ladder', targetDate: '2026-08-31', completed: true },
      { id: 'ms-3', title: 'Automate final $7,500 Q4 contribution', targetDate: '2026-12-15', completed: false },
    ],
  },
  {
    id: 'GOL-202',
    title: 'Annual Half-Marathon & Aerobic Base Volume',
    category: LifeCategory.HEALTH,
    horizon: 'Annual 2026',
    currentValue: 1180,
    targetValue: 1400,
    unit: 'km',
    deadline: '2026-12-31',
    notes: 'Consistent 28–32 km weekly volume with zero overuse injuries.',
    milestones: [
      { id: 'ms-4', title: 'Log 700 km mid-year distance benchmark', targetDate: '2026-06-30', completed: true },
      { id: 'ms-5', title: 'Run sub-1:38:00 autumn half-marathon time trial', targetDate: '2026-10-18', completed: true },
      { id: 'ms-6', title: 'Complete 1,400 km cumulative annual mileage', targetDate: '2026-12-31', completed: false },
    ],
  },
  {
    id: 'GOL-203',
    title: 'Enterprise Cloud & Distributed Systems Reading Canon',
    category: LifeCategory.LEARNING,
    horizon: 'Annual 2026',
    currentValue: 19,
    targetValue: 24,
    unit: 'Books',
    deadline: '2026-12-31',
    notes: 'Annotated summaries stored in the Cloud Document Vault.',
    milestones: [
      { id: 'ms-7', title: 'Finish 12 core distributed systems monographs', targetDate: '2026-06-30', completed: true },
      { id: 'ms-8', title: 'Publish 6 internal architecture RFC notes', targetDate: '2026-10-01', completed: true },
      { id: 'ms-9', title: 'Complete remaining 5 JVM internals volumes', targetDate: '2026-12-20', completed: false },
    ],
  },
  {
    id: 'GOL-204',
    title: 'Personal Life Management System Java 21 Microservice Release',
    category: LifeCategory.WORK,
    horizon: 'Q4 2026',
    currentValue: 88,
    targetValue: 100,
    unit: '% Complete',
    deadline: '2026-11-30',
    notes: 'Full Spring Boot 3.4 + PostgreSQL + React 19 production deployment.',
    milestones: [
      { id: 'ms-10', title: 'Spring Security 6 JWT authentication filter', targetDate: '2026-10-05', completed: true },
      { id: 'ms-11', title: 'Flyway database schema migrations & indexes', targetDate: '2026-10-22', completed: true },
      { id: 'ms-12', title: 'Cloud document SHA-256 verification service', targetDate: '2026-11-01', completed: true },
      { id: 'ms-13', title: 'Zero-downtime container deployment pipeline', targetDate: '2026-11-28', completed: false },
    ],
  },
];

const doc1Content = `# 2026 Q4 Investment & Treasury Allocation Ledger
Owner: Elena Vance
Updated: 2026-11-01
Classification: Confidential Financial Record

## 1. Core Asset Allocation Summary
- US Broad Market Index (VTI): 52.0% ($148,200)
- International Developed Equities (VXUS): 18.0% ($51,300)
- US Treasury Bill Ladder (4-Week / 13-Week): 22.0% ($62,700)
- Cash Operating Buffer: 8.0% ($22,800)

## 2. Q4 Rebalancing Directives
1. Redirect November dividend distributions into 13-week Treasury maturity rung.
2. Harvest tax losses if any individual tax lot drops > 4.5% below cost basis.
3. Maximize annual HSA family contribution prior to December 15 payroll cutoff.`;

const doc2Content = `# PLMS Java 21 Spring Boot Architecture RFC-004
Author: Elena Vance, Principal Systems Architect
Runtime: OpenJDK 21.0.5 LTS (Virtual Threads Enabled)
Framework: Spring Boot 3.4.0 / Spring Security 6.4

## 1. Executive Summary
The Personal Life Management System (PLMS) unifies task execution, habit consistency telemetry, quantitative goal roadmaps, and encrypted document storage under a single multi-layered Java architecture.

## 2. Security & Integrity Guarantees
- Stateless JWT authentication signed with RSA-256 asymmetric keys.
- All cloud vault documents undergo deterministic SHA-256 checksum verification prior to persistence.
- Optimistic locking (@Version) on all JPA entities prevents lost updates across concurrent devices.`;

const doc3Content = `# Annual Comprehensive Biomarker & Longevity Panel
Patient: Elena Vance
Lab Date: 2026-10-29
Ordering Physician: Dr. Marcus Chen, MD

## Key Cardiovascular & Metabolic Markers
- ApoB: 68 mg/dL (Optimal < 80 mg/dL)
- Fasting Glucose: 84 mg/dL (Normal 70-99 mg/dL)
- HbA1c: 5.0% (Optimal < 5.4%)
- hs-CRP: 0.4 mg/L (Low cardiovascular inflammation < 1.0 mg/L)
- Vitamin D (25-OH): 52 ng/mL (Optimal 40-60 ng/mL)
- Resting Heart Rate: 49 BPM | VO2 Max Estimate: 51 mL/kg/min`;

const doc4Content = `# Executive Employment & IP Assignment Agreement Addendum
Document ID: LEG-2026-8841
Effective Date: 2026-09-15
Status: Executed & Countersigned

## Summary of Retained Open-Source Carveouts
Section 4.2 explicitly exempts the "Personal Life Management System (PLMS)" software suite, personal productivity algorithms, and private documentation vaults developed on personal hardware outside corporate hours.`;

export const INITIAL_DOCUMENTS: CloudDocument[] = [
  {
    id: 'DOC-901',
    title: '2026 Q4 Investment & Treasury Allocation Ledger',
    fileName: '2026-q4-treasury-allocation.md',
    folder: 'Financial Records',
    mimeType: 'text/markdown',
    sizeBytes: new TextEncoder().encode(doc1Content).length,
    content: doc1Content,
    sha256Checksum: computeDeterministicHash(doc1Content),
    version: 4,
    starred: true,
    updatedAt: '2026-11-01 17:42',
    syncState: 'Synced',
  },
  {
    id: 'DOC-902',
    title: 'PLMS Java 21 Spring Boot Architecture RFC-004',
    fileName: 'plms-java21-architecture-rfc004.md',
    folder: 'Career & Contracts',
    mimeType: 'text/markdown',
    sizeBytes: new TextEncoder().encode(doc2Content).length,
    content: doc2Content,
    sha256Checksum: computeDeterministicHash(doc2Content),
    version: 7,
    starred: true,
    updatedAt: '2026-11-02 08:15',
    syncState: 'Synced',
  },
  {
    id: 'DOC-903',
    title: 'Annual Comprehensive Biomarker & Longevity Panel',
    fileName: '2026-biomarker-longevity-panel.md',
    folder: 'Health & Medical',
    mimeType: 'text/markdown',
    sizeBytes: new TextEncoder().encode(doc3Content).length,
    content: doc3Content,
    sha256Checksum: computeDeterministicHash(doc3Content),
    version: 2,
    starred: false,
    updatedAt: '2026-10-29 14:20',
    syncState: 'Synced',
  },
  {
    id: 'DOC-904',
    title: 'Executive Employment & IP Carveout Addendum',
    fileName: 'ip-carveout-addendum-2026.md',
    folder: 'Identity & Legal',
    mimeType: 'text/markdown',
    sizeBytes: new TextEncoder().encode(doc4Content).length,
    content: doc4Content,
    sha256Checksum: computeDeterministicHash(doc4Content),
    version: 1,
    starred: true,
    updatedAt: '2026-09-15 11:05',
    syncState: 'Synced',
  },
];

export const JAVA_SPRING_BOOT_FILES: JavaSourceFile[] = [
  {
    id: 'java-auth-controller',
    fileName: 'AuthController.java',
    packagePath: 'src/main/java/io/plms/core/web/AuthController.java',
    language: 'java',
    description: 'Dedicated Login, Sign Up, and Logout REST endpoints with Jakarta Bean Validation and database persistence.',
    code: `package io.plms.core.web;

import io.plms.core.domain.UserEntity;
import io.plms.core.service.AuthenticationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationService authService;

    public AuthController(AuthenticationService authService) {
        this.authService = authService;
    }

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String password
    ) {}

    public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 120) String fullName,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 128) String password,
        @NotBlank String confirmPassword,
        @NotBlank String roleTitle,
        String timezone
    ) {}

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        UserEntity created = authService.registerUser(request);
        String token = authService.issueSessionToken(created);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "user", created,
            "token", token
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        UserEntity user = authService.authenticate(request.email(), request.password());
        String token = authService.issueSessionToken(user);
        return ResponseEntity.ok(Map.of(
            "user", user,
            "token", token
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Boolean>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        authService.revokeSessionToken(authHeader);
        return ResponseEntity.ok(Map.of("success", true));
    }
}`,
  },
  {
    id: 'java-app',
    fileName: 'PersonalLifeApplication.java',
    packagePath: 'src/main/java/io/plms/core/PersonalLifeApplication.java',
    language: 'java',
    description: 'Java 21 Spring Boot 3.4 entry point with virtual threads and scheduled cloud sync executors.',
    code: `package io.plms.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.task.TaskExecutionAutoConfiguration;
import org.springframework.boot.web.embedded.tomcat.TomcatProtocolHandlerCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.core.task.support.TaskExecutorAdapter;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.concurrent.Executors;

@SpringBootApplication
@EnableScheduling
public class PersonalLifeApplication {

    public static void main(String[] args) {
        SpringApplication.run(PersonalLifeApplication.class, args);
    }

    /**
     * Enables Java 21 Project Loom Virtual Threads for high-concurrency
     * task dashboard telemetry and non-blocking cloud document synchronization.
     */
    @Bean(TaskExecutionAutoConfiguration.APPLICATION_TASK_EXECUTOR_BEAN_NAME)
    public AsyncTaskExecutor asyncTaskExecutor() {
        return new TaskExecutorAdapter(Executors.newVirtualThreadPerTaskExecutor());
    }

    @Bean
    public TomcatProtocolHandlerCustomizer<?> protocolHandlerVirtualThreadExecutorCustomizer() {
        return protocolHandler -> protocolHandler.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
    }
}`,
  },
  {
    id: 'java-security',
    fileName: 'SecurityConfiguration.java',
    packagePath: 'src/main/java/io/plms/core/security/SecurityConfiguration.java',
    language: 'java',
    description: 'Spring Security 6 stateless JWT filter chain, BCrypt password encoder, and CORS policy.',
    code: `package io.plms.core.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfiguration {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/login", "/api/v1/auth/register", "/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}`,
  },
  {
    id: 'java-task-controller',
    fileName: 'TaskDashboardController.java',
    packagePath: 'src/main/java/io/plms/core/web/TaskDashboardController.java',
    language: 'java',
    description: 'REST controller handling task lifecycle, focus minute logging, and priority filtering.',
    code: `package io.plms.core.web;

import io.plms.core.domain.TaskEntity;
import io.plms.core.domain.TaskPriority;
import io.plms.core.domain.TaskStatus;
import io.plms.core.service.TaskDashboardService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tasks")
public class TaskDashboardController {

    private final TaskDashboardService taskService;

    public TaskDashboardController(TaskDashboardService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<TaskEntity>> listUserTasks(
            @AuthenticationPrincipal Jwt principal,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority) {
        String userId = principal.getSubject();
        return ResponseEntity.ok(taskService.findTasks(userId, status, priority));
    }

    @PostMapping
    public ResponseEntity<TaskEntity> createTask(
            @AuthenticationPrincipal Jwt principal,
            @Valid @RequestBody TaskEntity payload) {
        return ResponseEntity.ok(taskService.createTask(principal.getSubject(), payload));
    }

    @PatchMapping("/{taskId}/focus-session")
    public ResponseEntity<TaskEntity> recordFocusMinutes(
            @AuthenticationPrincipal Jwt principal,
            @PathVariable String taskId,
            @RequestBody Map<String, Integer> body) {
        int elapsedMinutes = body.getOrDefault("minutes", 25);
        return ResponseEntity.ok(
            taskService.appendFocusMinutes(principal.getSubject(), taskId, elapsedMinutes)
        );
    }
}`,
  },
  {
    id: 'java-vault-service',
    fileName: 'CloudDocumentVaultService.java',
    packagePath: 'src/main/java/io/plms/core/service/CloudDocumentVaultService.java',
    language: 'java',
    description: 'Cloud-synced document storage service computing SHA-256 digests and versioned snapshots.',
    code: `package io.plms.core.service;

import io.plms.core.domain.CloudDocumentEntity;
import io.plms.core.repository.CloudDocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;

@Service
public class CloudDocumentVaultService {

    private final CloudDocumentRepository documentRepository;

    public CloudDocumentVaultService(CloudDocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    @Transactional
    public CloudDocumentEntity synchronizeDocument(String userId, CloudDocumentEntity incoming) {
        String sha256 = computeSha256Hex(incoming.getContent());
        incoming.setOwnerId(userId);
        incoming.setSha256Checksum(sha256);
        incoming.setSizeBytes(incoming.getContent().getBytes(StandardCharsets.UTF_8).length);
        incoming.setVersion(incoming.getVersion() + 1);
        incoming.setSyncedAt(Instant.now());
        return documentRepository.save(incoming);
    }

    private String computeSha256Hex(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encoded = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encoded);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable in JVM", e);
        }
    }
}`,
  },
  {
    id: 'java-pom',
    fileName: 'pom.xml',
    packagePath: 'pom.xml',
    language: 'xml',
    description: 'Maven build specification for Java 21, Spring Boot 3.4, Spring Security OAuth2, and PostgreSQL.',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.4.0</version>
    </parent>

    <groupId>io.plms</groupId>
        <artifactId>personal-life-management-system</artifactId>
    <version>2.4.0-RELEASE</version>
    <name>Personal Life Management System</name>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
    </dependencies>
</project>`,
  },
  {
    id: 'java-schema',
    fileName: 'V1__init_plms_schema.sql',
    packagePath: 'src/main/resources/db/migration/V1__init_plms_schema.sql',
    language: 'sql',
    description: 'Flyway relational database schema for users, tasks, habits, goals, and cloud vault documents.',
    code: `-- Flyway Migration V1: Personal Life Management System Core Schema
CREATE TABLE plms_users (
    user_id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_title VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE plms_tasks (
    task_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES plms_users(user_id),
    title VARCHAR(240) NOT NULL,
    category VARCHAR(64) NOT NULL,
    priority VARCHAR(16) NOT NULL,
    status VARCHAR(32) NOT NULL,
    due_date DATE NOT NULL,
    estimated_minutes INT NOT NULL DEFAULT 30,
    logged_minutes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE plms_cloud_documents (
    document_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES plms_users(user_id),
    title VARCHAR(240) NOT NULL,
    file_name VARCHAR(240) NOT NULL,
    folder VARCHAR(64) NOT NULL,
    size_bytes BIGINT NOT NULL,
    sha256_checksum CHAR(64) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    content TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`,
  },
];
