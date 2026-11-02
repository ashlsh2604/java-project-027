package io.skillbridge.servlet;

import io.skillbridge.model.User;
import io.skillbridge.operations.UserOperations;
import io.skillbridge.operations.UserOperationsImpl;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletConfig;
import jakarta.servlet.ServletContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;

import java.io.BufferedReader;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Phase 4, 5, 6 Syllabus Integration Test Suite:
 * Tests Servlet Dependency Injection, LoginServlet, RegisterServlet,
 * DashboardServlet (session barrier), and LogoutServlet (session.invalidate()).
 */
class ServletFlowTest {

    @TempDir
    Path tempDir;

    private UserOperations userOperations;
    private LoginServlet loginServlet;
    private RegisterServlet registerServlet;
    private DashboardServlet dashboardServlet;
    private LogoutServlet logoutServlet;

    @BeforeEach
    void setUp() throws Exception {
        Path dbPath = tempDir.resolve("servlet-test-db.json");
        userOperations = new UserOperationsImpl(dbPath);

        // Pre-register a seed user for authentication testing
        User seedUser = new User();
        seedUser.setId("usr-test-01");
        seedUser.setFullName("Priya Patel");
        seedUser.setEmail("priya.patel@skillbridge.in");
        seedUser.setTimezone("Asia/Kolkata");
        seedUser.setRoleTitle("Lead Systems Engineer");
        userOperations.registerUser(seedUser, "PriyaSecret2026!");

        // Set up Servlets with Dependency Injection
        loginServlet = new LoginServlet();
        loginServlet.setUserOperations(userOperations);

        registerServlet = new RegisterServlet();
        registerServlet.setUserOperations(userOperations);

        dashboardServlet = new DashboardServlet();
        dashboardServlet.setUserOperations(userOperations);

        logoutServlet = new LogoutServlet();
    }

    @Test
    @DisplayName("Phase 4: Servlet Dependency Injection from ServletContext in init()")
    void testServletDependencyInjection() throws Exception {
        LoginServlet servlet = new LoginServlet();
        ServletConfig mockConfig = mock(ServletConfig.class);
        ServletContext mockContext = mock(ServletContext.class);

        when(mockConfig.getServletContext()).thenReturn(mockContext);
        when(mockContext.getAttribute(AppContextListener.USER_OPERATIONS_KEY)).thenReturn(userOperations);

        servlet.init(mockConfig);
        assertSame(userOperations, servlet.getUserOperations(),
                "Servlet should retrieve UserOperations injected from ServletContext");
    }

    @Test
    @DisplayName("Requirement 6: LoginServlet succeeds with valid credentials, sets HttpSession, and redirects to dashboard")
    void testLoginServlet_Success() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        HttpSession session = mock(HttpSession.class);

        when(request.getContentType()).thenReturn("application/x-www-form-urlencoded");
        when(request.getParameter("email")).thenReturn("priya.patel@skillbridge.in");
        when(request.getParameter("password")).thenReturn("PriyaSecret2026!");
        when(request.getContextPath()).thenReturn("/skillbridge");
        when(request.getSession(true)).thenReturn(session);

        loginServlet.doPost(request, response);

        // Verify HttpSession creation and user attributes
        verify(request).getSession(true);
        verify(session).setAttribute(eq("user"), any(User.class));
        verify(session).setAttribute(eq("userEmail"), eq("priya.patel@skillbridge.in"));
        verify(session).setAttribute(eq("userTimezone"), eq("Asia/Kolkata"));

        // Verify redirect to /dashboard
        verify(response).sendRedirect("/skillbridge/dashboard");
    }

    @Test
    @DisplayName("Requirement 6: LoginServlet rejects invalid credentials and forwards back to login JSP")
    void testLoginServlet_InvalidCredentials() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        RequestDispatcher dispatcher = mock(RequestDispatcher.class);

        when(request.getContentType()).thenReturn("application/x-www-form-urlencoded");
        when(request.getParameter("email")).thenReturn("priya.patel@skillbridge.in");
        when(request.getParameter("password")).thenReturn("WrongPassword999!");
        when(request.getRequestDispatcher("/WEB-INF/views/login.jsp")).thenReturn(dispatcher);

        loginServlet.doPost(request, response);

        verify(request).setAttribute(eq("errorMessage"), contains("Invalid email or password"));
        verify(dispatcher).forward(request, response);
        verify(response, never()).sendRedirect(anyString());
    }

    @Test
    @DisplayName("Phase 3: LoginServlet handles JSON authentication payload and returns 200 OK")
    void testLoginServlet_JsonPayload() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        HttpSession session = mock(HttpSession.class);

        String json = "{\"email\":\"priya.patel@skillbridge.in\",\"password\":\"PriyaSecret2026!\"}";
        when(request.getContentType()).thenReturn("application/json");
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader(json)));
        when(request.getSession(true)).thenReturn(session);

        StringWriter out = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(out));

        loginServlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_OK);
        assertTrue(out.toString().contains("\"success\":true"));
        assertTrue(out.toString().contains("priya.patel@skillbridge.in"));
    }

    @Test
    @DisplayName("Requirement 6: RegisterServlet creates user, creates session, and redirects to dashboard")
    void testRegisterServlet_Success() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        HttpSession session = mock(HttpSession.class);

        when(request.getContentType()).thenReturn("application/x-www-form-urlencoded");
        when(request.getParameter("fullName")).thenReturn("Vikram Sarabhai");
        when(request.getParameter("email")).thenReturn("vikram.sarabhai@isro.gov.in");
        when(request.getParameter("password")).thenReturn("RocketScience2026!");
        when(request.getParameter("confirmPassword")).thenReturn("RocketScience2026!");
        when(request.getParameter("timezone")).thenReturn("Asia/Kolkata");
        when(request.getContextPath()).thenReturn("/skillbridge");
        when(request.getSession(true)).thenReturn(session);

        registerServlet.doPost(request, response);

        // Verify registration in UserOperations
        User created = userOperations.getUserByEmail("vikram.sarabhai@isro.gov.in");
        assertNotNull(created, "New user should be persisted in UserOperations");
        assertEquals("Vikram Sarabhai", created.getFullName());
        assertEquals("Asia/Kolkata", created.getTimezone());

        // Verify session creation and redirect
        verify(request).getSession(true);
        verify(session).setAttribute(eq("user"), eq(created));
        verify(response).sendRedirect("/skillbridge/dashboard");
    }

    @Test
    @DisplayName("Requirement 6: RegisterServlet rejects duplicate email with conflict error")
    void testRegisterServlet_DuplicateEmail() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        RequestDispatcher dispatcher = mock(RequestDispatcher.class);

        when(request.getContentType()).thenReturn("application/x-www-form-urlencoded");
        when(request.getParameter("fullName")).thenReturn("Duplicate Priya");
        when(request.getParameter("email")).thenReturn("priya.patel@skillbridge.in"); // Already registered
        when(request.getParameter("password")).thenReturn("AnotherPass2026!");
        when(request.getParameter("confirmPassword")).thenReturn("AnotherPass2026!");
        when(request.getRequestDispatcher("/WEB-INF/views/register.jsp")).thenReturn(dispatcher);

        registerServlet.doPost(request, response);

        verify(request).setAttribute(eq("errorMessage"), contains("already exists"));
        verify(dispatcher).forward(request, response);
        verify(response, never()).sendRedirect(anyString());
    }

    @Test
    @DisplayName("Requirement 6: DashboardServlet blocks unauthorized access and redirects to /login?error=unauthorized")
    void testDashboardServlet_UnauthorizedAccess() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);

        // No session active
        when(request.getSession(false)).thenReturn(null);
        when(request.getRequestURI()).thenReturn("/skillbridge/dashboard");
        when(request.getContextPath()).thenReturn("/skillbridge");

        dashboardServlet.doGet(request, response);

        // Must redirect to login with error parameter
        verify(response).sendRedirect("/skillbridge/login?error=unauthorized");
    }

    @Test
    @DisplayName("Requirement 6: DashboardServlet blocks unauthorized JSON requests with 401 Unauthorized")
    void testDashboardServlet_UnauthorizedJsonAccess() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);

        when(request.getSession(false)).thenReturn(null);
        when(request.getRequestURI()).thenReturn("/skillbridge/api/dashboard");
        when(request.getHeader("Accept")).thenReturn("application/json");

        StringWriter out = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(out));

        dashboardServlet.doGet(request, response);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        assertTrue(out.toString().contains("Unauthorized"));
    }

    @Test
    @DisplayName("Phase 5: DashboardServlet allows authorized session and forwards to /WEB-INF/views/dashboard.jsp")
    void testDashboardServlet_AuthorizedAccess() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        HttpSession session = mock(HttpSession.class);
        RequestDispatcher dispatcher = mock(RequestDispatcher.class);

        User loggedInUser = userOperations.getUserByEmail("priya.patel@skillbridge.in");
        when(request.getSession(false)).thenReturn(session);
        when(request.getRequestURI()).thenReturn("/skillbridge/dashboard");
        when(session.getAttribute("user")).thenReturn(loggedInUser);
        when(session.getId()).thenReturn("sess-test-token-777");
        when(session.getCreationTime()).thenReturn(System.currentTimeMillis());
        when(session.getLastAccessedTime()).thenReturn(System.currentTimeMillis());
        when(request.getRequestDispatcher("/WEB-INF/views/dashboard.jsp")).thenReturn(dispatcher);

        dashboardServlet.doGet(request, response);

        // Verify request attributes are set for JSP
        verify(request).setAttribute("userName", "Priya Patel");
        verify(request).setAttribute("userEmail", "priya.patel@skillbridge.in");
        verify(request).setAttribute("userTimezone", "Asia/Kolkata");
        verify(dispatcher).forward(request, response);
    }

    @Test
    @DisplayName("Phase 5 & Requirement 6: LogoutServlet invalidates session and redirects to /login?logout=success")
    void testLogoutServlet_InvalidatesSession() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        HttpSession session = mock(HttpSession.class);

        when(request.getSession(false)).thenReturn(session);
        when(request.getRequestURI()).thenReturn("/skillbridge/logout");
        when(request.getContextPath()).thenReturn("/skillbridge");

        logoutServlet.doPost(request, response);

        // Verify session.invalidate() was strictly called
        verify(session).invalidate();

        // Verify redirect to login with logout=success
        verify(response).sendRedirect("/skillbridge/login?logout=success");
    }
}
