<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="io.skillbridge.model.User" %>
<%@ page import="java.util.Date" %>
<%
    // Phase 5 Protection: Restrict unauthorized access
    if (session == null || session.getAttribute("user") == null) {
        response.sendRedirect(request.getContextPath() + "/login?error=unauthorized");
        return;
    }

    User currentUser = (User) session.getAttribute("user");
    String userName = currentUser.getFullName() != null ? currentUser.getFullName() : "Enterprise Member";
    String userEmail = currentUser.getEmail();
    String userRole = currentUser.getRoleTitle() != null ? currentUser.getRoleTitle() : "Software Engineer";
    String userTz = currentUser.getTimezone() != null ? currentUser.getTimezone() : "Asia/Kolkata";
    String sessionId = session.getId();
    String sessionCreated = new Date(session.getCreationTime()).toString();
    String initial = userName.length() > 0 ? userName.substring(0, 1).toUpperCase() : "U";
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Personal Life Management System</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/style.css">
</head>
<body>
<div class="dashboard-layout">
    <!-- Navbar -->
    <header class="dash-nav">
        <div class="dash-nav-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span class="dash-nav-brand-title">SkillBridge Personal Life Management</span>
        </div>

        <div class="dash-nav-user">
            <div class="user-badge">
                <div class="avatar-circle"><%= initial %></div>
                <div style="line-height: 1.2;">
                    <div style="font-weight: 600; font-size: 0.875rem;"><%= userName %></div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);"><%= userEmail %></div>
                </div>
            </div>

            <!-- Phase 5 Logout Form -->
            <form method="post" action="${pageContext.request.contextPath}/logout" style="margin: 0;">
                <button type="submit" class="btn-secondary" title="Invalidate HttpSession and Sign Out">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sign Out
                </button>
            </form>
        </div>
    </header>

    <!-- Main Container -->
    <main class="dash-container">
        <!-- Header Banner -->
        <div class="dash-header-banner">
            <h2>Welcome, <%= userName %></h2>
            <p>Your unified workstation for task progression, daily habits, strategic goals, and cloud assets.</p>

            <div class="dash-meta-pills">
                <span class="meta-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    Timezone: <strong><%= userTz %></strong>
                </span>
                <span class="meta-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Role: <strong><%= userRole %></strong>
                </span>
                <span class="meta-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Session ID: <code><%= sessionId.length() > 16 ? sessionId.substring(0, 16) + "..." : sessionId %></code>
                </span>
                <span class="meta-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 10"></polyline></svg>
                    Session Created: <%= sessionCreated %>
                </span>
            </div>
        </div>

        <!-- Metric Counters -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-card-title">Active Tasks</div>
                <div class="stat-card-val" style="color: var(--primary);">7</div>
                <div class="stat-card-sub">3 high priority due this week</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-title">Completed Tasks</div>
                <div class="stat-card-val" style="color: var(--success);">18</div>
                <div class="stat-card-sub">+4 closed in the last 48 hours</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-title">Habit Streak</div>
                <div class="stat-card-val" style="color: #0ea5e9;">14 Days</div>
                <div class="stat-card-sub">Longest continuous run this quarter</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-title">Cloud Storage Sync</div>
                <div class="stat-card-val" style="color: #8b5cf6;">248.5 MB</div>
                <div class="stat-card-sub">Encrypted & synced with JSON store</div>
            </div>
        </div>

        <!-- Interactive Modules -->
        <div class="modules-grid">
            <!-- Left Column: Tasks & Habits -->
            <div>
                <!-- 14-Day Habit Tracker -->
                <div class="module-card">
                    <div class="module-header">
                        <h3>14-Day Habit Tracker Matrix</h3>
                        <span style="font-size: 0.8125rem; color: var(--success); font-weight: 600;">100% Completion Rate</span>
                    </div>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
                        Consistency visualization for daily engineering, deep focus, and wellness routines:
                    </p>
                    <div class="habit-matrix">
                        <% for (int i = 1; i <= 14; i++) { %>
                            <div class="habit-day-cell completed" title="Day <%= i %> - Completed">✓</div>
                        <% } %>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
                        <span>14 Days Ago</span>
                        <span>Today</span>
                    </div>
                </div>

                <!-- Interactive Task Tracking -->
                <div class="module-card">
                    <div class="module-header">
                        <h3>Interactive Task Tracker</h3>
                        <span class="badge-brand" style="margin: 0;">Sprint 4</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 0.5rem; border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <input type="checkbox" checked style="accent-color: var(--primary);">
                                <span style="font-size: 0.875rem; text-decoration: line-through; color: var(--text-muted);">
                                    Configure Maven WAR packaging for standalone Tomcat 10.1
                                </span>
                            </div>
                            <span style="font-size: 0.75rem; background: #dcfce7; color: #15803d; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600;">Done</span>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 0.5rem; border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <input type="checkbox" checked style="accent-color: var(--primary);">
                                <span style="font-size: 0.875rem; text-decoration: line-through; color: var(--text-muted);">
                                    Implement UserOperations interface for authentication & validation
                                </span>
                            </div>
                            <span style="font-size: 0.75rem; background: #dcfce7; color: #15803d; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600;">Done</span>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 0.5rem; border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <input type="checkbox" style="accent-color: var(--primary);">
                                <span style="font-size: 0.875rem; font-weight: 500;">
                                    Execute full JUnit 5 & Mockito servlet lifecycle integration suite
                                </span>
                            </div>
                            <span style="font-size: 0.75rem; background: #fef3c7; color: #b45309; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600;">In Progress</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Goals & Storage -->
            <div>
                <!-- Goal Visualization -->
                <div class="module-card">
                    <div class="module-header">
                        <h3>Goal Visualization</h3>
                    </div>

                    <div class="goal-item">
                        <div class="goal-info">
                            <span style="font-weight: 600;">Jakarta EE 10 Mastery</span>
                            <span style="color: var(--primary); font-weight: 700;">100%</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: 100%;"></div>
                        </div>
                    </div>

                    <div class="goal-item">
                        <div class="goal-info">
                            <span style="font-weight: 600;">Servlet Dependency Injection</span>
                            <span style="color: var(--primary); font-weight: 700;">100%</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: 100%;"></div>
                        </div>
                    </div>

                    <div class="goal-item">
                        <div class="goal-info">
                            <span style="font-weight: 600;">Full Unit & Mockito Test Suite</span>
                            <span style="color: var(--primary); font-weight: 700;">90%</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: 90%;"></div>
                        </div>
                    </div>
                </div>

                <!-- Cloud-Synced Storage Summary -->
                <div class="module-card">
                    <div class="module-header">
                        <h3>Cloud Document Storage</h3>
                    </div>
                    <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 1rem;">
                        Synchronized with database backing store at <code>data/plms-db.json</code>.
                    </p>
                    <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
                        <li style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                            <span>📄 syllabus_practical_spec.pdf</span>
                            <span style="color: var(--text-muted); font-size: 0.75rem;">2.4 MB</span>
                        </li>
                        <li style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                            <span>📊 quarterly_growth_matrix.xlsx</span>
                            <span style="color: var(--text-muted); font-size: 0.75rem;">1.1 MB</span>
                        </li>
                        <li style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0;">
                            <span>🔒 auth_architecture_diagram.png</span>
                            <span style="color: var(--text-muted); font-size: 0.75rem;">4.8 MB</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </main>
</div>
</body>
</html>
