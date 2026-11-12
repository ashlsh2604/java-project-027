package io.skillbridge.servlet;

import io.skillbridge.model.User;
import io.skillbridge.operations.UserOperations;
import io.skillbridge.operations.UserOperationsImpl;
import jakarta.servlet.ServletConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Phase 4: RegisterServlet handling registration, validation, duplicate prevention,
 * and automatic HttpSession initialization.
 */
@WebServlet(name = "RegisterServlet", urlPatterns = {"/register", "/api/auth/servlet-register"})
public class RegisterServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private UserOperations userOperations;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        Object ops = config.getServletContext().getAttribute(AppContextListener.USER_OPERATIONS_KEY);
        if (ops instanceof UserOperations) {
            this.userOperations = (UserOperations) ops;
        } else {
            this.userOperations = UserOperationsImpl.getInstance();
        }
    }

    public void setUserOperations(UserOperations userOperations) {
        this.userOperations = userOperations;
    }

    public UserOperations getUserOperations() {
        return this.userOperations;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (session != null && session.getAttribute("user") != null) {
            response.sendRedirect(request.getContextPath() + "/dashboard");
            return;
        }

        request.getRequestDispatcher("/WEB-INF/views/register.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String contentType = request.getContentType();
        boolean isJson = contentType != null && contentType.toLowerCase().contains("application/json");

        String fullName = "";
        String username = "";
        String email = "";
        String password = "";
        String confirmPassword = "";
        String timezone = "Asia/Kolkata";
        String roleTitle = "Full Stack Engineer";

        if (isJson) {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = request.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }
            String jsonStr = sb.toString();
            fullName = extractJsonField(jsonStr, "fullName");
            if (fullName.isBlank()) {
                fullName = extractJsonField(jsonStr, "name");
            }
            username = extractJsonField(jsonStr, "username");
            email = extractJsonField(jsonStr, "email");
            password = extractJsonField(jsonStr, "password");
            confirmPassword = extractJsonField(jsonStr, "confirmPassword");
            String tz = extractJsonField(jsonStr, "timezone");
            if (!tz.isBlank()) {
                timezone = tz;
            }
            String role = extractJsonField(jsonStr, "roleTitle");
            if (!role.isBlank()) {
                roleTitle = role;
            }
        } else {
            fullName = request.getParameter("fullName");
            if (fullName == null || fullName.isBlank()) {
                fullName = request.getParameter("name");
            }
            username = request.getParameter("username");
            email = request.getParameter("email");
            password = request.getParameter("password");
            confirmPassword = request.getParameter("confirmPassword");
            String tz = request.getParameter("timezone");
            if (tz != null && !tz.isBlank()) {
                timezone = tz;
            }
            String role = request.getParameter("roleTitle");
            if (role != null && !role.isBlank()) {
                roleTitle = role;
            }
        }

        fullName = fullName != null ? fullName.trim() : "";
        username = username != null ? username.trim() : "";
        email = email != null ? email.trim() : "";
        password = password != null ? password : "";
        confirmPassword = confirmPassword != null ? confirmPassword : "";

        // Phase 3 & 4 Validation: Missing fields
        if (fullName.isEmpty() || email.isEmpty() || password.isEmpty()) {
            sendError(request, response, isJson, HttpServletResponse.SC_BAD_REQUEST,
                    "All required fields (Name, Email, Password) must be provided.",
                    fullName, email, timezone);
            return;
        }

        // Email format check
        if (!userOperations.validateEmailFormat(email)) {
            sendError(request, response, isJson, HttpServletResponse.SC_BAD_REQUEST,
                    "Please enter a valid email address.",
                    fullName, email, timezone);
            return;
        }

        // Username format check if supplied
        if (!username.isEmpty() && !User.isValidUsername(username)) {
            sendError(request, response, isJson, HttpServletResponse.SC_BAD_REQUEST,
                    "Username must be between 3 and 30 characters (letters, numbers, dot, underscore, or hyphen).",
                    fullName, email, timezone);
            return;
        }

        // Password matching check
        if (!confirmPassword.isEmpty() && !password.equals(confirmPassword)) {
            sendError(request, response, isJson, HttpServletResponse.SC_BAD_REQUEST,
                    "Passwords do not match. Please re-enter identical passwords.",
                    fullName, email, timezone);
            return;
        }

        // Password policy check
        if (!userOperations.validatePasswordPolicy(password)) {
            sendError(request, response, isJson, HttpServletResponse.SC_BAD_REQUEST,
                    "Password does not meet syllabus policy: Minimum 8 characters with at least one uppercase letter, one lowercase letter, and one digit.",
                    fullName, email, timezone);
            return;
        }

        // Duplicate user check
        if (userOperations.isEmailRegistered(email)) {
            sendError(request, response, isJson, HttpServletResponse.SC_CONFLICT,
                    "An account with email '" + email + "' already exists. Please log in.",
                    fullName, email, timezone);
            return;
        }

        if (!username.isEmpty() && userOperations.isUsernameRegistered(username)) {
            sendError(request, response, isJson, HttpServletResponse.SC_CONFLICT,
                    "Username '" + username + "' is already taken. Please choose another username.",
                    fullName, email, timezone);
            return;
        }

        // Construct and register new user
        String newId = "usr-" + UUID.randomUUID().toString().substring(0, 8);
        User newUser = new User();
        newUser.setId(newId);
        newUser.setFullName(fullName);
        newUser.setUsername(!username.isEmpty() ? username : (email.contains("@") ? email.substring(0, email.indexOf('@')) : email));
        newUser.setEmail(email);
        newUser.setTimezone(timezone);
        newUser.setRoleTitle(roleTitle);

        boolean registered = false;
        try {
            registered = userOperations.registerUser(newUser, password);
        } catch (IllegalArgumentException e) {
            sendError(request, response, isJson, HttpServletResponse.SC_BAD_REQUEST,
                    e.getMessage(), fullName, email, timezone);
            return;
        }

        if (!registered) {
            sendError(request, response, isJson, HttpServletResponse.SC_CONFLICT,
                    "Registration failed: duplicate account or invalid data.",
                    fullName, email, timezone);
            return;
        }

        // Phase 5: Establish secure HttpSession immediately
        HttpSession session = request.getSession(true);
        session.setAttribute("user", newUser);
        session.setAttribute("userId", newUser.getId());
        session.setAttribute("userEmail", newUser.getEmail());
        session.setAttribute("username", newUser.getUsername());
        session.setAttribute("userName", newUser.getFullName());
        session.setAttribute("userRole", newUser.getRoleTitle());
        session.setAttribute("userTimezone", newUser.getTimezone());
        session.setAttribute("authMethod", "Jakarta EE 10 HttpSession (Tomcat 10.1)");

        if (isJson) {
            response.setStatus(HttpServletResponse.SC_CREATED);
            response.setContentType("application/json;charset=UTF-8");
            // Safe JSON user-data structure: never expose passwords or password hashes
            response.getWriter().write("{\"success\":true,\"user\":{\"id\":\"" + escape(newUser.getId()) + "\",\"username\":\"" + escape(newUser.getUsername()) + "\",\"email\":\"" + escape(newUser.getEmail()) + "\",\"fullName\":\"" + escape(newUser.getFullName()) + "\",\"timezone\":\"" + escape(newUser.getTimezone()) + "\"},\"message\":\"Registration successful\"}");
            return;
        }

        response.sendRedirect(request.getContextPath() + "/dashboard");
    }

    private void sendError(HttpServletRequest request, HttpServletResponse response, boolean isJson,
                           int statusCode, String message, String enteredName, String enteredEmail, String enteredTz)
            throws ServletException, IOException {
        if (isJson) {
            response.setStatus(statusCode);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"" + escape(message) + "\"}");
            return;
        }

        request.setAttribute("errorMessage", message);
        request.setAttribute("enteredFullName", enteredName);
        request.setAttribute("enteredEmail", enteredEmail);
        request.setAttribute("enteredTimezone", enteredTz);
        request.getRequestDispatcher("/WEB-INF/views/register.jsp").forward(request, response);
    }

    private String extractJsonField(String json, String field) {
        Pattern pattern = Pattern.compile("\"" + field + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
