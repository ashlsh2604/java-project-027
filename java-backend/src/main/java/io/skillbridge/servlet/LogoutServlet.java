package io.skillbridge.servlet;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/**
 * Phase 4 & Phase 5: LogoutServlet terminating user sessions via session.invalidate().
 */
@WebServlet(name = "LogoutServlet", urlPatterns = {"/logout", "/api/auth/servlet-logout"})
public class LogoutServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processLogout(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processLogout(request, response);
    }

    private void processLogout(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String contentType = request.getContentType();
        String accept = request.getHeader("Accept");
        String uri = request.getRequestURI();
        boolean isJson = (contentType != null && contentType.toLowerCase().contains("application/json")) ||
                (accept != null && accept.toLowerCase().contains("application/json")) ||
                (uri != null && uri.endsWith("/servlet-logout"));

        // Phase 5: Invalidate existing HttpSession
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        if (isJson) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":true,\"message\":\"Session invalidated successfully. Logged out.\"}");
            return;
        }

        response.sendRedirect(request.getContextPath() + "/login?logout=success");
    }
}
