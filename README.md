# SkillBridge - Personal Life Management System (PLMS)

An enterprise personal life management and habit tracking web application built with **Java (Jakarta EE 10 / Servlets & JSP)** and modern **React / Vite**.

---

## Project Structure & Phases

### Phase 1: Java Domain Model & Input Validation
- **Package**: `io.skillbridge.model`
- **Class**: `User.java`
  - Encapsulates `username`, `password` (transient in-memory), `fullName`, `email`, `roleTitle`, and `timezone`.
  - Basic input validation methods:
    - `isValidUsername(String)`: 3–30 alphanumeric characters with `.`, `_`, or `-`.
    - `isValidPassword(String)`: Minimum 8 characters with at least 1 uppercase letter, 1 lowercase letter, and 1 numeric digit.
    - `isValidEmail(String)`: Standard RFC-compliant email verification.
    - `validate()` and `isValid()`: Self-validating JavaBean contract.

### Phase 2: Operations Interface & Exception Handling
- **Package**: `io.skillbridge.operations` & `io.skillbridge.exception`
- **Interface**: `UserOperations.java`
  - Defines business contracts for `registerUser`, `authenticate`, `authenticateUser`, `validateCredentials`, `validateUserInput`, and user queries.
- **Implementation**: `UserOperationsImpl.java`
  - Thread-safe repository utilizing PBKDF2WithHmacSHA256 password hashing (10,000 iterations, 32-byte salt).
  - Persists accounts to `data/plms-db.json`.
- **Exception Classes**:
  - `ValidationException`: Handles invalid user inputs with structured error lists.
  - `AuthenticationException`: Thrown on invalid credentials or unauthorized access.

### Phase 3: Presentation, Client-Side Validation & Safe JSON
- **JSP Views**: `login.jsp`, `register.jsp`, `dashboard.jsp`.
- **Styles**: `css/style.css` (responsive, modern UI).
- **Client Validation**: `js/validation.js` with instant input feedback and password strength meter.
- **Safe JSON Policy**: Plain text passwords and password hashes are strictly filtered and never exposed in client JSON responses or logs.

### Phase 4: Servlets, Server Validation & Session Management
- **Servlets (`io.skillbridge.servlet`)**:
  - `LoginServlet` (`/login`): Server-side validation, authenticates credentials, initializes `HttpSession`, redirects to `/dashboard`.
  - `RegisterServlet` (`/register`): Server-side input validation, duplicate prevention, creates user, initializes session, redirects to `/dashboard`.
  - `DashboardServlet` (`/dashboard`): Protected servlet; blocks unauthenticated requests via session check and redirects to `/login?error=unauthorized`.
  - `LogoutServlet` (`/logout`): Terminates the session via `session.invalidate()` and redirects to `/login?logout=success`.
  - `AppContextListener`: Injects `UserOperations` into `ServletContext` at application startup.

### Phase 5: Web Server Configuration & Packaging
- **Tomcat 10.1 WAR Packaging**:
  - Maven POM (`java-backend/pom.xml`) configured with `<packaging>war</packaging>`.
  - Standalone WAR archive: `java-backend/target/skillbridge.war`.
- **Full-Stack Dev Gateway**:
  - `server.ts` running Express on port 3000 with reverse proxy to Java backend and seamless fallback.

---

## How to Run

### Option 1: Full-Stack Development Server (React + Java on Port 3000)

```bash
# 1. Install Node dependencies (if not already installed)
npm install

# 2. Start the development server
npm run dev
```

- Web App URL: `http://localhost:3000`
- API Health Check: `http://localhost:3000/api/auth/health`

---

### Option 2: Apache Tomcat 10.1 Standalone Deployment

```bash
# 1. Compile, run all 22 tests, and build WAR archive
mvn -f java-backend/pom.xml clean package

# 2. Deploy the generated WAR to Apache Tomcat 10.1
cp java-backend/target/skillbridge.war $CATALINA_HOME/webapps/

# 3. Start Apache Tomcat
$CATALINA_HOME/bin/catalina.sh run
```

- Access Login: `http://localhost:8080/skillbridge/login`
- Access Protected Dashboard: `http://localhost:8080/skillbridge/dashboard`

---

## Running the Automated Test Suite

```bash
mvn -f java-backend/pom.xml test
```

Executes 22 automated tests covering:
- `User` class input validation (username, password, email)
- Clear invalid input exception handling (`ValidationException`, `AuthenticationException`)
- `LoginServlet` session creation & error routing
- `RegisterServlet` duplicate detection & input validation
- `DashboardServlet` unauthorized redirection & access barrier
- `LogoutServlet` `session.invalidate()` verification
