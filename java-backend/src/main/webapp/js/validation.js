/**
 * SkillBridge Personal Life Management System
 * Phase 3 Client-side JavaScript Validation & JSON Submission Handler
 * Never exposes plain text passwords in JSON previews or storage.
 */

(function () {
    'use strict';

    // RFC compliant email regex
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // Username regex: 3-30 chars, alphanumeric with . _ -
    const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

    // Password Policy: Minimum 8 chars, 1 uppercase, 1 lowercase, 1 digit
    const PASSWORD_MIN_LEN = 8;
    const HAS_UPPERCASE = /[A-Z]/;
    const HAS_LOWERCASE = /[a-z]/;
    const HAS_DIGIT = /[0-9]/;

    window.addEventListener('DOMContentLoaded', () => {
        initLoginForm();
        initRegisterForm();
    });

    /**
     * Initialize Login Form Validation & JSON Toggle
     */
    function initLoginForm() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        const emailOrUserInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const jsonToggle = document.getElementById('jsonModeToggle');
        const jsonPreview = document.getElementById('jsonPreview');
        const submitBtn = document.getElementById('submitBtn');
        const clientErrorAlert = document.getElementById('clientErrorAlert');

        if (emailOrUserInput) {
            emailOrUserInput.addEventListener('input', () => {
                validateIdentifierField(emailOrUserInput);
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                if (passwordInput.value.length > 0) {
                    setFieldStatus(passwordInput, true);
                }
            });
        }

        form.addEventListener('submit', async (e) => {
            const isIdentifierValid = validateIdentifierField(emailOrUserInput);
            const isPasswordValid = passwordInput.value.trim().length > 0;

            if (!isPasswordValid) {
                setFieldStatus(passwordInput, false, 'Password is required.');
            }

            if (!isIdentifierValid || !isPasswordValid) {
                e.preventDefault();
                showClientError(clientErrorAlert, 'Please correct the validation errors in the form.');
                return;
            }

            // Phase 3: JSON mode handling via fetch API
            if (jsonToggle && jsonToggle.checked) {
                e.preventDefault();
                submitBtn.disabled = true;
                submitBtn.innerText = 'Authenticating via JSON...';

                const rawVal = emailOrUserInput.value.trim();
                const isEmail = rawVal.includes('@');
                const payload = {
                    username: !isEmail ? rawVal : '',
                    email: isEmail ? rawVal : '',
                    password: passwordInput.value
                };

                // Safe display copy: NEVER expose plain passwords in JSON preview
                const safeDisplayPayload = {
                    username: payload.username || undefined,
                    email: payload.email || undefined,
                    password: '•••••••• (Masked for Security)'
                };

                if (jsonPreview) {
                    jsonPreview.style.display = 'block';
                    jsonPreview.innerText = 'Sending Request Payload:\n' + JSON.stringify(safeDisplayPayload, null, 2);
                }

                try {
                    const response = await fetch(form.action, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        if (jsonPreview) {
                            jsonPreview.innerText += '\n\nResponse (200 OK - Safe User Data Structure):\n' + JSON.stringify(data, null, 2);
                        }
                        setTimeout(() => {
                            window.location.href = form.getAttribute('data-dashboard-url') || '/dashboard';
                        }, 500);
                    } else {
                        submitBtn.disabled = false;
                        submitBtn.innerText = 'Sign In';
                        showClientError(clientErrorAlert, data.error || 'Authentication failed. Please verify credentials.');
                        if (jsonPreview) {
                            jsonPreview.innerText += `\n\nResponse (${response.status}):\n` + JSON.stringify(data, null, 2);
                        }
                    }
                } catch (err) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Sign In';
                    showClientError(clientErrorAlert, 'Network or JSON parsing error: ' + err.message);
                }
            }
        });
    }

    /**
     * Initialize Registration Form Validation & JSON Toggle
     */
    function initRegisterForm() {
        const form = document.getElementById('registerForm');
        if (!form) return;

        const nameInput = document.getElementById('fullName');
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmInput = document.getElementById('confirmPassword');
        const timezoneSelect = document.getElementById('timezone');
        const jsonToggle = document.getElementById('jsonModeToggle');
        const jsonPreview = document.getElementById('jsonPreview');
        const submitBtn = document.getElementById('submitBtn');
        const clientErrorAlert = document.getElementById('clientErrorAlert');

        // Password strength meter elements
        const seg1 = document.getElementById('seg1');
        const seg2 = document.getElementById('seg2');
        const seg3 = document.getElementById('seg3');
        const strengthLabel = document.getElementById('strengthLabel');

        if (nameInput) {
            nameInput.addEventListener('input', () => {
                validateNameField(nameInput);
            });
        }

        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                validateUsernameField(usernameInput);
            });
        }

        if (emailInput) {
            emailInput.addEventListener('input', () => {
                validateEmailField(emailInput);
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                const val = passwordInput.value;
                updateStrengthMeter(val, seg1, seg2, seg3, strengthLabel);
                validatePasswordField(passwordInput);
                if (confirmInput && confirmInput.value.length > 0) {
                    validateConfirmPasswordField(passwordInput, confirmInput);
                }
            });
        }

        if (confirmInput) {
            confirmInput.addEventListener('input', () => {
                validateConfirmPasswordField(passwordInput, confirmInput);
            });
        }

        form.addEventListener('submit', async (e) => {
            const isNameValid = validateNameField(nameInput);
            const isUserValid = validateUsernameField(usernameInput);
            const isEmailValid = validateEmailField(emailInput);
            const isPasswordValid = validatePasswordField(passwordInput);
            const isConfirmValid = validateConfirmPasswordField(passwordInput, confirmInput);

            if (!isNameValid || !isUserValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
                e.preventDefault();
                showClientError(clientErrorAlert, 'Please resolve all validation errors highlighted above.');
                return;
            }

            // Phase 3 JSON submission handling
            if (jsonToggle && jsonToggle.checked) {
                e.preventDefault();
                submitBtn.disabled = true;
                submitBtn.innerText = 'Registering via JSON...';

                const payload = {
                    fullName: nameInput.value.trim(),
                    username: usernameInput ? usernameInput.value.trim() : '',
                    email: emailInput.value.trim(),
                    password: passwordInput.value,
                    confirmPassword: confirmInput.value,
                    timezone: timezoneSelect ? timezoneSelect.value : 'Asia/Kolkata',
                    roleTitle: 'Full Stack Engineer'
                };

                // Safe display copy: NEVER expose plain passwords in JSON preview
                const safeDisplayPayload = {
                    fullName: payload.fullName,
                    username: payload.username,
                    email: payload.email,
                    password: '•••••••• (Masked for Security)',
                    timezone: payload.timezone
                };

                if (jsonPreview) {
                    jsonPreview.style.display = 'block';
                    jsonPreview.innerText = 'Sending Request Payload:\n' + JSON.stringify(safeDisplayPayload, null, 2);
                }

                try {
                    const response = await fetch(form.action, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        if (jsonPreview) {
                            jsonPreview.innerText += '\n\nResponse (201 Created - Safe User Data Structure):\n' + JSON.stringify(data, null, 2);
                        }
                        setTimeout(() => {
                            window.location.href = form.getAttribute('data-dashboard-url') || '/dashboard';
                        }, 500);
                    } else {
                        submitBtn.disabled = false;
                        submitBtn.innerText = 'Create Account';
                        showClientError(clientErrorAlert, data.error || 'Registration failed.');
                        if (jsonPreview) {
                            jsonPreview.innerText += `\n\nResponse (${response.status}):\n` + JSON.stringify(data, null, 2);
                        }
                    }
                } catch (err) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Create Account';
                    showClientError(clientErrorAlert, 'Network or JSON parsing error: ' + err.message);
                }
            }
        });
    }

    function validateNameField(input) {
        if (!input) return true;
        const val = input.value.trim();
        if (val.length < 2) {
            setFieldStatus(input, false, 'Full Name must be at least 2 characters long.');
            return false;
        }
        setFieldStatus(input, true);
        return true;
    }

    function validateUsernameField(input) {
        if (!input) return true;
        const val = input.value.trim();
        if (val.length === 0) {
            setFieldStatus(input, false, 'Username is required.');
            return false;
        }
        if (!USERNAME_REGEX.test(val)) {
            setFieldStatus(input, false, 'Username must be 3-30 characters (letters, numbers, dot, underscore, or hyphen).');
            return false;
        }
        setFieldStatus(input, true);
        return true;
    }

    function validateIdentifierField(input) {
        if (!input) return true;
        const val = input.value.trim();
        if (val.length === 0) {
            setFieldStatus(input, false, 'Username or email address is required.');
            return false;
        }
        if (val.includes('@')) {
            if (!EMAIL_REGEX.test(val)) {
                setFieldStatus(input, false, 'Please enter a valid email address.');
                return false;
            }
        } else {
            if (!USERNAME_REGEX.test(val)) {
                setFieldStatus(input, false, 'Username must be 3-30 characters.');
                return false;
            }
        }
        setFieldStatus(input, true);
        return true;
    }

    function validateEmailField(input) {
        if (!input) return true;
        const val = input.value.trim();
        if (val.length === 0) {
            setFieldStatus(input, false, 'Email address is required.');
            return false;
        }
        if (!EMAIL_REGEX.test(val)) {
            setFieldStatus(input, false, 'Please enter a valid email address (e.g., alex@example.com).');
            return false;
        }
        setFieldStatus(input, true);
        return true;
    }

    function validatePasswordField(input) {
        if (!input) return true;
        const val = input.value;
        if (val.length < PASSWORD_MIN_LEN) {
            setFieldStatus(input, false, 'Password must be at least 8 characters long.');
            return false;
        }
        if (!HAS_UPPERCASE.test(val)) {
            setFieldStatus(input, false, 'Password must contain at least one uppercase letter (A-Z).');
            return false;
        }
        if (!HAS_LOWERCASE.test(val)) {
            setFieldStatus(input, false, 'Password must contain at least one lowercase letter (a-z).');
            return false;
        }
        if (!HAS_DIGIT.test(val)) {
            setFieldStatus(input, false, 'Password must contain at least one numeric digit (0-9).');
            return false;
        }
        setFieldStatus(input, true);
        return true;
    }

    function validateConfirmPasswordField(pwdInput, confirmInput) {
        if (!confirmInput) return true;
        const pwd = pwdInput ? pwdInput.value : '';
        const confirm = confirmInput.value;
        if (confirm.length === 0) {
            setFieldStatus(confirmInput, false, 'Please confirm your password.');
            return false;
        }
        if (pwd !== confirm) {
            setFieldStatus(confirmInput, false, 'Passwords do not match.');
            return false;
        }
        setFieldStatus(confirmInput, true);
        return true;
    }

    function updateStrengthMeter(val, seg1, seg2, seg3, label) {
        if (!seg1 || !seg2 || !seg3 || !label) return;

        let score = 0;
        if (val.length >= 8) score++;
        if (HAS_UPPERCASE.test(val) && HAS_LOWERCASE.test(val)) score++;
        if (HAS_DIGIT.test(val) && /[^A-Za-z0-9]/.test(val)) score++;

        seg1.style.backgroundColor = '#cbd5e1';
        seg2.style.backgroundColor = '#cbd5e1';
        seg3.style.backgroundColor = '#cbd5e1';

        if (score === 0 && val.length > 0) {
            seg1.style.backgroundColor = '#ef4444';
            label.innerText = 'Weak';
            label.style.color = '#ef4444';
        } else if (score === 1) {
            seg1.style.backgroundColor = '#f59e0b';
            label.innerText = 'Fair';
            label.style.color = '#f59e0b';
        } else if (score === 2) {
            seg1.style.backgroundColor = '#3b82f6';
            seg2.style.backgroundColor = '#3b82f6';
            label.innerText = 'Good';
            label.style.color = '#3b82f6';
        } else if (score >= 3) {
            seg1.style.backgroundColor = '#10b981';
            seg2.style.backgroundColor = '#10b981';
            label.innerText = 'Strong & Compliant';
            label.style.color = '#10b981';
        } else {
            label.innerText = 'Password policy: 8+ chars, upper, lower, number';
            label.style.color = '#94a3b8';
        }
    }

    function setFieldStatus(input, isValid, errorMsg) {
        const errorEl = document.getElementById(input.id + 'Error');
        if (isValid) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
            if (errorEl) {
                errorEl.classList.remove('active');
                errorEl.innerText = '';
            }
        } else {
            input.classList.remove('is-valid');
            input.classList.add('is-invalid');
            if (errorEl) {
                errorEl.innerText = errorMsg || 'Invalid value.';
                errorEl.classList.add('active');
            }
        }
    }

    function showClientError(alertEl, msg) {
        if (!alertEl) return;
        alertEl.style.display = 'flex';
        alertEl.innerText = msg;
    }
})();
