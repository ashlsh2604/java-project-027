package io.skillbridge.servlet;

import io.skillbridge.operations.UserOperations;
import io.skillbridge.operations.UserOperationsImpl;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

/**
 * Phase 4: Jakarta EE ServletContextListener for dependency injection.
 * Initializes and injects the UserOperations singleton into ServletContext
 * so all servlets can retrieve it without hardcoded tight coupling.
 */
@WebListener
public class AppContextListener implements ServletContextListener {

    public static final String USER_OPERATIONS_KEY = "userOperations";

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        UserOperations userOperations = UserOperationsImpl.getInstance();
        sce.getServletContext().setAttribute(USER_OPERATIONS_KEY, userOperations);
        System.out.println("[AppContextListener] UserOperations dependency injected into ServletContext.");
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        sce.getServletContext().removeAttribute(USER_OPERATIONS_KEY);
        System.out.println("[AppContextListener] ServletContext destroyed.");
    }
}
