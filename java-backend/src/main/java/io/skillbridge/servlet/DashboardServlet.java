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

import java.io.IOException;
import java.util.Date;

/**
 * Phase 4 & Phase 5: Protected DashboardServlet.
 * Enforces session authentication barrier: requests without a valid
 * HttpSession containing a "user" attribute are immediately rejected/redirected.
 */
@WebServlet(name = "DashboardServlet", urlPatterns = {"/dashboard", "/api/dashboard"})
public class DashboardServlet extends HttpServlet {
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
        String acceptHeader = request.getHeader("Accept");
        boolean isJson = (acceptHeader != null && acceptHeader.contains("application/json")) ||
                request.getRequestURI().endsWith("/api/dashboard");

        // Phase 5 Session Validation: do not create new session if none exists
        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("user") == null) {
            if (isJson) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\":\"Unauthorized: No active session. Please log in first.\"}");
                return;
            }
            response.sendRedirect(request.getContextPath() + "/login?error=unauthorized");
            return;
        }

        User user = (User) session.getAttribute("user");

        // Optionally refresh latest profile data from store
        if (userOperations != null && user.getId() != null) {
            User latest = userOperations.getUserById(user.getId());
            if (latest != null) {
                user = latest;
                session.setAttribute("user", latest);
                session.setAttribute("userTimezone", latest.getTimezone());
            }
        }

        if (isJson) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(String.format(
                    "{\"authenticated\":true,\"userId\":\"%s\",\"name\":\"%s\",\"email\":\"%s\",\"role\":\"%s\",\"timezone\":\"%s\",\"sessionId\":\"%s\"}",
                    escape(user.getId()), escape(user.getFullName()), escape(user.getEmail()),
                    escape(user.getRoleTitle()), escape(user.getTimezone()), escape(session.getId())
            ));
            return;
        }

        // Set rich dashboard metrics for JSP presentation
        request.setAttribute("currentUser", user);
        request.setAttribute("userName", user.getFullName());
        request.setAttribute("userEmail", user.getEmail());
        request.setAttribute("userRole", user.getRoleTitle());
        request.setAttribute("userTimezone", user.getTimezone());
        request.setAttribute("sessionId", session.getId());
        request.setAttribute("sessionCreated", new Date(session.getCreationTime()).toString());
        request.setAttribute("lastAccess", new Date(session.getLastAccessedTime()).toString());
        request.setAttribute("activeTasks", 7);
        request.setAttribute("completedTasks", 18);
        request.setAttribute("habitStreakDays", 14);
        request.setAttribute("cloudStorageMb", 248.5);

        request.getRequestDispatcher("/WEB-INF/views/dashboard.jsp").forward(request, response);
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
