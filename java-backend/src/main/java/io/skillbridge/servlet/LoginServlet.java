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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Phase 4: LoginServlet handling authentication, HttpSession lifecycle,
 * and error handling for invalid credentials.
 */
@WebServlet(name = "LoginServlet", urlPatterns = {"/login", "/api/auth/servlet-login"})
public class LoginServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private UserOperations userOperations;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        // Servlet Dependency Injection from ServletContext
        Object ops = config.getServletContext().getAttribute(AppContextListener.USER_OPERATIONS_KEY);
        if (ops instanceof UserOperations) {
            this.userOperations = (UserOperations) ops;
        } else {
            this.userOperations = UserOperationsImpl.getInstance();
        }
    }

    /**
     * Dependency injection setter for unit testing and mock frameworks.
     */
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

        String error = request.getParameter("error");
        if ("unauthorized".equalsIgnoreCase(error)) {
            request.setAttribute("errorMessage", "Access Denied: Please log in to view the protected dashboard.");
        } else if ("invalid".equalsIgnoreCase(error)) {
            request.setAttribute("errorMessage", "Invalid email or password. Please try again.");
        }

        String logout = request.getParameter("logout");
        if ("success".equalsIgnoreCase(logout)) {
            request.setAttribute("infoMessage", "You have been successfully logged out.");
        }

        request.getRequestDispatcher("/WEB-INF/views/login.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String contentType = request.getContentType();
        boolean isJson = contentType != null && contentType.toLowerCase().contains("application/json");

        String identifier = "";
        String password = "";

        if (isJson) {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = request.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }
            String jsonStr = sb.toString();
            identifier = extractJsonField(jsonStr, "username");
            if (identifier.isBlank()) {
                identifier = extractJsonField(jsonStr, "email");
            }
            password = extractJsonField(jsonStr, "password");
        } else {
            identifier = request.getParameter("username");
            if (identifier == null || identifier.isBlank()) {
                identifier = request.getParameter("email");
            }
            password = request.getParameter("password");
        }

        if (identifier == null || identifier.isBlank() || password == null || password.isBlank()) {
            if (isJson) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\":\"Both username/email and password are required.\"}");
                return;
            }
            request.setAttribute("errorMessage", "Please provide both username/email and password.");
            request.setAttribute("enteredEmail", identifier);
            request.getRequestDispatcher("/WEB-INF/views/login.jsp").forward(request, response);
            return;
        }

        User authenticated = userOperations.authenticate(identifier.trim(), password);

        if (authenticated == null) {
            if (isJson) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\":\"Invalid credentials. No matching account found.\"}");
                return;
            }
            request.setAttribute("errorMessage", "Invalid username/email or password. Please try again.");
            request.setAttribute("enteredEmail", identifier.trim());
            request.getRequestDispatcher("/WEB-INF/views/login.jsp").forward(request, response);
            return;
        }

        // Phase 5: Create brand new secure HttpSession upon successful authentication
        HttpSession session = request.getSession(true);
        session.setAttribute("user", authenticated);
        session.setAttribute("userId", authenticated.getId());
        session.setAttribute("userEmail", authenticated.getEmail());
        session.setAttribute("username", authenticated.getUsername());
        session.setAttribute("userName", authenticated.getFullName());
        session.setAttribute("userRole", authenticated.getRoleTitle());
        session.setAttribute("userTimezone", authenticated.getTimezone());
        session.setAttribute("authMethod", "Jakarta EE 10 HttpSession (Tomcat 10.1)");

        if (isJson) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("application/json;charset=UTF-8");
            // Never expose passwords or password hashes in JSON response
            response.getWriter().write("{\"success\":true,\"userId\":\"" + authenticated.getId() + "\",\"username\":\"" + escape(authenticated.getUsername()) + "\",\"email\":\"" + escape(authenticated.getEmail()) + "\"}");
            return;
        }

        response.sendRedirect(request.getContextPath() + "/dashboard");
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
