<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In - SkillBridge Personal Life Management</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/style.css">
</head>
<body>
<div class="auth-wrapper">
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <span class="badge-brand">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    SkillBridge PLMS • Jakarta EE 10
                </span>
                <h1>Welcome Back</h1>
                <p>Personal Life Management System Login</p>
            </div>

            <%-- Server Error / Success Banners --%>
            <% if (request.getAttribute("errorMessage") != null) { %>
                <div class="alert alert-danger" role="alert">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div><%= request.getAttribute("errorMessage") %></div>
                </div>
            <% } %>

            <% if (request.getAttribute("infoMessage") != null) { %>
                <div class="alert alert-success" role="alert">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <div><%= request.getAttribute("infoMessage") %></div>
                </div>
            <% } %>

            <div id="clientErrorAlert" class="alert alert-danger" style="display: none;"></div>

            <!-- Mode Switcher: Form Submission vs JSON API Mode -->
            <div class="mode-toggle-card">
                <label for="jsonModeToggle">Phase 3 JSON Submission Mode</label>
                <label class="toggle-switch">
                    <input type="checkbox" id="jsonModeToggle">
                    <span class="toggle-slider"></span>
                </label>
            </div>

            <form id="loginForm" method="post" action="${pageContext.request.contextPath}/login"
                  data-dashboard-url="${pageContext.request.contextPath}/dashboard" novalidate>

                <div class="form-group">
                    <label class="form-label" for="email">Work or Personal Email <span class="required">*</span></label>
                    <input type="email" id="email" name="email" class="form-input"
                           placeholder="elena.vance@plms-enterprise.io"
                           value="<%= request.getAttribute("enteredEmail") != null ? request.getAttribute("enteredEmail") : "" %>"
                           required autofocus>
                    <div id="emailError" class="field-error"></div>
                </div>

                <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.375rem;">
                        <label class="form-label" for="password" style="margin-bottom: 0;">Password <span class="required">*</span></label>
                    </div>
                    <input type="password" id="password" name="password" class="form-input"
                           placeholder="Enter your account password" required>
                    <div id="passwordError" class="field-error"></div>
                </div>

                <button type="submit" id="submitBtn" class="btn-primary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                        <polyline points="10 17 15 12 10 7"></polyline>
                        <line x1="15" y1="12" x2="3" y2="12"></line>
                    </svg>
                    Sign In
                </button>
            </form>

            <div id="jsonPreview" class="json-preview-panel"></div>

            <div class="auth-footer">
                Don't have an account yet?
                <a href="${pageContext.request.contextPath}/register">Create New Account</a>
            </div>
        </div>
    </div>
</div>

<script src="${pageContext.request.contextPath}/js/validation.js"></script>
</body>
</html>
