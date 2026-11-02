<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Account - SkillBridge Personal Life Management</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/style.css">
</head>
<body>
<div class="auth-wrapper">
    <div class="auth-container" style="max-width: 520px;">
        <div class="auth-card">
            <div class="auth-header">
                <span class="badge-brand">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    SkillBridge PLMS • Jakarta EE 10
                </span>
                <h1>Create Account</h1>
                <p>Register for Personal Life Management System</p>
            </div>

            <%-- Server Error Alert --%>
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

            <div id="clientErrorAlert" class="alert alert-danger" style="display: none;"></div>

            <!-- Mode Switcher: Form Submission vs JSON API Mode -->
            <div class="mode-toggle-card">
                <label for="jsonModeToggle">Phase 3 JSON Submission Mode</label>
                <label class="toggle-switch">
                    <input type="checkbox" id="jsonModeToggle">
                    <span class="toggle-slider"></span>
                </label>
            </div>

            <form id="registerForm" method="post" action="${pageContext.request.contextPath}/register"
                  data-dashboard-url="${pageContext.request.contextPath}/dashboard" novalidate>

                <div class="form-group">
                    <label class="form-label" for="fullName">Full Name <span class="required">*</span></label>
                    <input type="text" id="fullName" name="fullName" class="form-input"
                           placeholder="e.g. Alex Morgan"
                           value="<%= request.getAttribute("enteredFullName") != null ? request.getAttribute("enteredFullName") : "" %>"
                           required autofocus>
                    <div id="fullNameError" class="field-error"></div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="email">Email Address <span class="required">*</span></label>
                    <input type="email" id="email" name="email" class="form-input"
                           placeholder="alex.morgan@example.com"
                           value="<%= request.getAttribute("enteredEmail") != null ? request.getAttribute("enteredEmail") : "" %>"
                           required>
                    <div id="emailError" class="field-error"></div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="password">Password <span class="required">*</span></label>
                    <input type="password" id="password" name="password" class="form-input"
                           placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit" required>
                    <div id="passwordError" class="field-error"></div>

                    <!-- Password Strength Meter -->
                    <div class="strength-meter">
                        <div class="strength-bar-container">
                            <div class="strength-segment" id="seg1"></div>
                            <div class="strength-segment" id="seg2"></div>
                            <div class="strength-segment" id="seg3"></div>
                        </div>
                        <div class="strength-text">
                            <span>Policy Requirement</span>
                            <span id="strengthLabel">Min 8 chars, A-Z, a-z, 0-9</span>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="confirmPassword">Confirm Password <span class="required">*</span></label>
                    <input type="password" id="confirmPassword" name="confirmPassword" class="form-input"
                           placeholder="Re-enter identical password" required>
                    <div id="confirmPasswordError" class="field-error"></div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="timezone">Time Zone (Configured for India / Global)</label>
                    <select id="timezone" name="timezone" class="form-select">
                        <option value="Asia/Kolkata" selected>Asia/Kolkata (IST - India Standard Time UTC+05:30)</option>
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="America/New_York">America/New_York (EST/EDT UTC-05:00)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT UTC-08:00)</option>
                        <option value="Europe/London">Europe/London (GMT/BST UTC+00:00)</option>
                        <option value="Europe/Berlin">Europe/Berlin (CET/CEST UTC+01:00)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (JST UTC+09:00)</option>
                        <option value="Australia/Sydney">Australia/Sydney (AEST UTC+10:00)</option>
                    </select>
                </div>

                <button type="submit" id="submitBtn" class="btn-primary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    Create Account
                </button>
            </form>

            <div id="jsonPreview" class="json-preview-panel"></div>

            <div class="auth-footer">
                Already registered?
                <a href="${pageContext.request.contextPath}/login">Sign In Instead</a>
            </div>
        </div>
    </div>
</div>

<script src="${pageContext.request.contextPath}/js/validation.js"></script>
</body>
</html>
